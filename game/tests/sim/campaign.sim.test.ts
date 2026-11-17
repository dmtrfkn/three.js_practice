// Симуляция кампаний на реальном ядре игры. Запуск: npm run sim
import { describe, it, expect } from 'vitest';
import {
  newCampaign, takeOffer, startInspection, openItem, closeCard, toDialogue, ask, continueDialogue, toPrice, propose,
  beginAttempt, failAttempt, succeedAttempt, finishOrder, moveNext, locationState, availableQuestions, openWorkshop,
} from '../../src/core/campaign';
import { PARAMS, LOCATIONS, type Level } from '../../src/core/params';
import { buySkill, buyParts, nextCost, kitPrice } from '../../src/core/progress';
import { limitL, noticeChance, inspectorChance } from '../../src/core/rules';
import { ALL_ITEMS, BASE_QUESTIONS } from '../../src/core/content';
import type { Campaign } from '../../src/core/types';

type Strategy = (c: Campaign) => number;

function evRegular(P: number, m: number, kn: Level, mood: Level, bpost: number[], upost: number[]) {
  let ev = 0;
  for (let b = 0; b < 3; b++) for (let u = 0; u < 3; u++) {
    const w = bpost[b] * upost[u]; if (!w) continue;
    if (m <= 1) { ev += w * m; continue; }
    const L = limitL(1, b as Level, mood, u as Level);
    const det = noticeChance(m, kn);
    const inL = m <= L + 1e-9 ? 1 : 0;
    const acc = (1 - det) * inL + det * inL * (mood === 2 ? 0.3 : 0);
    const pHard = det * (1 - inL * (mood === 2 ? 0.3 : 0)) * PARAMS.hardDemandChance[kn];
    ev += w * (acc * m + pHard * PARAMS.hardDemandCap[kn] + (1 - acc - pHard) * 1.0);
  }
  return ev;
}

// Прежняя стратегия видит скрытые параметры клиента. Сохраняется только для сравнения с оракулом.
const oracle: Strategy = (c) => {
  const o = c.order!;
  const sus = o.items.some((i) => i.kind === 'suspicious');
  const Q = inspectorChance(c.callIndex - 1, c.rep, 0);
  const pi = Q * (o.formal ? 0.8 : 0.2) * (sus ? 0.85 : 0.15);
  const pr = (1 - Q) * (o.formal ? 0.2 : 0.8) * (sus ? 0.2 : 0.8);
  const p = pi + pr ? pi / (pi + pr) : 0;
  const bp = PARAMS.budgetByLocation[o.locIdx] as unknown as number[];
  let bpost = bp.slice();
  const ambSeen = o.noticed?.some((id) => id.startsWith('AMB')) && (o.sk?.attention ?? 0) >= 1;
  if (!sus && ambSeen) { bpost = o.client.budget === 2 ? [0, 0, 1] : [bp[0] / (bp[0] + bp[1]), bp[1] / (bp[0] + bp[1]), 0]; }
  const upost = [0.3, 0.4, 0.3];
  const pen = c.violations === 0 ? 0.6 : 30;
  const offer = c.offers.find((x) => x.id === o.offerId)!;
  const scandalRisk = offer.omen?.type === 'scandal' ? 1 : 0.03;
  let best = { ev: -9, m: 1 };
  for (let m = 1; m <= 2.0001; m += 0.05) {
    const ins = m <= 1.2 + 1e-9 ? m : 2 - m - pen;
    let r = evRegular(1, m, o.client.knowledge, o.mood, bpost, upost);
    if (m >= 1.3 - 1e-9) { const det = noticeChance(m, o.client.knowledge); r = (1 - scandalRisk * det) * r + scandalRisk * det * -0.3; }
    const ev = (1 - p) * r + p * ins;
    if (ev > best.ev) best = { ev, m };
  }
  return Math.round(best.m * 20) / 20;
};
const flat = (x: number): Strategy => () => x;

function play(seed: number, strat: Strategy, failRate: number) {
  const c = newCampaign(seed);
  let rnd = seed * 9301 + 49297;
  const rand = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
  for (let guard = 0; guard < 40 && (c.status === 'board' || c.status === 'mustMove'); guard++) {
    if (c.status === 'mustMove') { moveNext(c); continue; }
    const st = locationState(c);
    if (st.canMove) { moveNext(c); continue; }
    if (st.canWin) { openWorkshop(c); break; }
    const offer = c.offers.filter((o) => !o.taken).sort((a, b) => b.tier - a.tier)[0];
    takeOffer(c, offer.id);
    const o = c.order!;
    startInspection(c, 0);
    for (const it of o.items) { openItem(c, it.id, 1); closeCard(c, 1); }
    toDialogue(c);
    const qs = availableQuestions(o);
    const want = ['base_knowledge', qs.find((q) => q.id.startsWith('AMB') || q.id.startsWith('SUS'))?.id ?? 'base_urgency', 'base_urgency'];
    for (const q of want) { ask(c, q); continueDialogue(c); }
    toPrice(c);
    const m = strat(c);
    const r = propose(c, m);
    if (r.kind === 'soft' || r.kind === 'hard') {
      const m2 = r.kind === 'hard' ? PARAMS.hardDemandCap[o.client.knowledge] : 1.0;
      propose(c, Math.min(m2, r.m - 0.05));
    }
    if (o.stage === 'repair') {
      for (;;) { beginAttempt(c); if (rand() < failRate) failAttempt(c); else { succeedAttempt(c); break; } }
    }
    finishOrder(c);
  }
  return { status: c.status, ending: c.ending, loc: LOCATIONS[c.locIdx].id };
}

describe('баланс (симуляция на ядре)', () => {
  const N = 3000;
  const rate = (s: Strategy) => {
    let win = 0; const where: Record<string, number> = {};
    for (let i = 1; i <= N; i++) {
      const r = play(i, s, 0.12);
      if (r.status === 'victory') win++; else where[`${r.ending}@${r.loc}`] = (where[`${r.ending}@${r.loc}`] ?? 0) + 1;
    }
    return { win: win / N, where };
  };
  it('записывает исходы фиксированных стратегий и оракула', () => {
    const honest = rate(flat(1.0)), f110 = rate(flat(1.1)), greedy = rate(flat(1.4)), reference = rate(oracle);
    console.log('honest', honest, '\n×1.10', f110, '\n×1.40', greedy, '\noracle (видит скрытые данные)', reference);
    for (const result of [honest, f110, greedy, reference]) {
      expect(result.win * N + Object.values(result.where).reduce((a, b) => a + b, 0)).toBeCloseTo(N);
    }
  });
});

// Игрок использует только видимые заявки, открытые карточки и текст ответов.
// Это одна фиксированная эвристика, а не оценка верхней границы мастерства игрока.
function playObserved(seed: number, policy: 'clues' | 'fixed120' | 'fixed125' | 'fixed130' | 'fixed135' = 'clues', invest = true) {
  const c = newCampaign(seed);
  let rnd = seed * 9301 + 49297;
  const rand = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
  let skillPurchases = 0, partPurchases = 0, attempted = 0;
  const developedLocations = new Set<number>();
  for (let guard = 0; guard < 40 && (c.status === 'board' || c.status === 'mustMove'); guard++) {
    if (c.status === 'mustMove') { moveNext(c); continue; }
    const st = locationState(c);
    if (st.canWin) { openWorkshop(c); break; }
    if (st.canMove) { moveNext(c); continue; }
    // Первые уровни покупаются до переезда: игрок сознательно жертвует накоплениями.
    for (const branch of ['attention', 'mastery', 'charisma', 'reading'] as const) {
      const cost = nextCost(c, branch);
      if (invest && !developedLocations.has(c.locIdx) && (c.skills?.[branch] ?? 0) < 1 && cost !== null && cost <= c.money * 0.25 && c.money >= cost + 1000 && buySkill(c, branch)) {
        skillPurchases++; developedLocations.add(c.locIdx); break;
      }
    }
    if ((c.parts?.normal ?? 0) === 0 && c.money >= kitPrice(c.locIdx, 'normal') + 100 && buyParts(c, 'normal')) partPurchases++;
    if (locationState(c).canMove) { moveNext(c); continue; }
    const offer = c.offers.filter(o => !o.taken).sort((a, b) => b.tier - a.tier)[0];
    if (!offer) break;
    takeOffer(c, offer.id);
    const o = c.order!;
    startInspection(c, 0);
    for (const id of o.noticed ?? []) {
      if (openItem(c, id, 1)) closeCard(c, 1);
    }
    toDialogue(c);
    const available = availableQuestions(o);
    const itemQuestion = available.find(q => !q.id.startsWith('base_'));
    const questionIds = [itemQuestion?.id, 'base_knowledge', 'base_urgency'].filter((id): id is string => !!id);
    let knowledge: Level | undefined;
    let budget: Level | undefined = offer.omen?.type === 'budget' ? offer.omen.level : undefined;
    for (const id of questionIds) {
      const answer = ask(c, id);
      if (!answer) continue;
      if (id === 'base_knowledge') {
        const index = BASE_QUESTIONS.knowledge.a.findIndex(p => p.conv === answer || p.formal === answer);
        if (index >= 0) knowledge = index as Level;
      }
      const def = ALL_ITEMS[id];
      if (def?.kind === 'reliable' && def.category === 'budget') budget = def.level;
      continueDialogue(c);
    }
    toPrice(c);
    // Осторожнее при риске скандала или высокой осведомлённости; бюджет помогает выбрать цену.
    const m = policy === 'clues' ? (offer.omen?.type === 'scandal' ? 1.1 : knowledge === 2 ? 1.2 : budget === 0 ? 1.1 : budget === 2 ? 1.35 : 1.25) : Number(policy.slice(5)) / 100;
    const response = propose(c, m);
    if (response.kind === 'soft' || response.kind === 'hard') propose(c, Math.min(0.9, response.m - 0.05));
    if (o.stage === 'price') propose(c, Math.min(0.85, o.reactions[o.reactions.length - 1].m - 0.05));
    if (o.stage === 'repair') {
      attempted++;
      for (;;) { beginAttempt(c); if (rand() < 0.12) failAttempt(c); else { succeedAttempt(c); break; } }
    }
    finishOrder(c);
  }
  return { status: c.status, ending: c.ending, loc: LOCATIONS[c.locIdx].id, skillPurchases, partPurchases, attempted };
}

describe('баланс: игрок без доступа к скрытым характеристикам', () => {
  it('фиксирует исходы и инвестиции без требования заданного процента побед', () => {
    const n = 3000;
    const outcomes: Record<string, number> = {};
    let skills = 0, parts = 0, repairs = 0, investors = 0;
    for (let seed = 1; seed <= n; seed++) {
      const r = playObserved(seed);
      const key = r.status === 'victory' ? 'victory' : `${r.ending ?? r.status}@${r.loc}`;
      outcomes[key] = (outcomes[key] ?? 0) + 1;
      skills += r.skillPurchases; parts += r.partPurchases; repairs += r.attempted;
      if (r.skillPurchases) investors++;
    }
    console.log('observed', { n, outcomes, investors, skillPurchases: skills, partPurchases: parts, repairs });
    expect(Object.values(outcomes).reduce((a, b) => a + b, 0)).toBe(n);
    expect(investors).toBeGreaterThan(0);
    expect(Object.keys(outcomes).filter(key => key.startsWith('board@') || key.startsWith('mustMove@'))).toEqual([]);
  });

  it('сравнивает открытые стратегии с навыками и без них', () => {
    const n = 3000;
    for (const policy of ['clues', 'fixed120', 'fixed125', 'fixed130', 'fixed135'] as const) {
      for (const invest of [false, true]) {
        const outcomes: Record<string, number> = {};
        let skills = 0;
        for (let seed = 1; seed <= n; seed++) {
          const r = playObserved(seed, policy, invest);
          const key = r.status === 'victory' ? 'victory' : `${r.ending ?? r.status}@${r.loc}`;
          outcomes[key] = (outcomes[key] ?? 0) + 1;
          skills += r.skillPurchases;
        }
        console.log('policy', { policy, invest, outcomes, skills });
        expect(Object.values(outcomes).reduce((a, b) => a + b, 0)).toBe(n);
      }
    }
  });

});
