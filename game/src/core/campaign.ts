// Кампания и жизненный цикл заказа. Все функции изменяют переданное состояние;
// все случайные броски выполняются здесь и записываются в состояние до показа результата.
import { PARAMS, LOCATIONS, type Level, type Tier } from './params';
import { makeRng, next, chance, weighted, shuffle } from './rng';
import {
  DEVICES, CLIENT_NAMES, RELIABLE, AMBIGUOUS, SUSPICIOUS, NEUTRALS, PRESETS, BASE_QUESTIONS, NEUTRAL_ANSWER, LINES, ALL_ITEMS, ASK_ABOUT,
  type Phrase, type Category,
} from './content';
import type { Campaign, Offer, Order, RoomItem, Reaction, ClientTraits } from './types';
import {
  firstReaction, secondAllowed, priceOf, repForOutcome, isViolation, fineFor, clampRep, inspectorChance, moodDown, roundStep,
} from './rules';

export const SUS_KINDS = ['SUS_RECORDER', 'SUS_PHONE', 'SUS_FOLDER'];

export function newCampaign(seed = Math.floor(Math.random() * 2 ** 31)): Campaign {
  const c: Campaign = {
    version: 1, seed, rng: makeRng(seed), locIdx: 0, money: PARAMS.startMoney, rep: PARAMS.startRep, violations: 0,
    callIndex: 0, callsUsed: 0, orderCounter: 0, offers: [], order: null, inspectorBonus: 0, status: 'board', ending: null,
    history: [], locationStartMoney: PARAMS.startMoney, tutorialSeen: false, tutorialStep: 0,
  };
  generateOffers(c);
  return c;
}

const lvl = (c: Campaign, w: readonly number[]) => weighted(c.rng, w) as Level;

export function generateOffers(c: Campaign): void {
  const loc = LOCATIONS[c.locIdx];
  const names = shuffle(c.rng, CLIENT_NAMES).slice(0, PARAMS.offersPerLocation);
  const tiers = shuffle(c.rng, PARAMS.offerTiers.slice() as Tier[]);
  c.offers = tiers.map((tier, i) => {
    const client: ClientTraits = {
      name: names[i],
      budget: lvl(c, PARAMS.budgetByLocation[c.locIdx]),
      knowledge: lvl(c, PARAMS.knowledgeByTier[tier]),
      urgency: lvl(c, PARAMS.urgencyDist),
      mood: lvl(c, PARAMS.moodDist),
      scandal: chance(c.rng, PARAMS.scandalChance[c.locIdx]),
    };
    const faultIdx = (chance(c.rng, 0.5) ? 0 : 1) as 0 | 1;
    const urgencyHint = chance(c.rng, PARAMS.urgencyHintChance);
    let omen: Offer['omen'] = null;
    if (client.scandal && chance(c.rng, PARAMS.scandalOmenChance)) omen = { type: 'scandal' };
    else if (chance(c.rng, PARAMS.omenChance)) {
      omen = chance(c.rng, 0.5) ? { type: 'budget', level: client.budget } : { type: 'knowledge', level: client.knowledge };
    }
    c.orderCounter++;
    return { id: `${loc.id}-${c.orderCounter}`, no: c.orderCounter, tier, deviceId: loc.devices[tier], faultIdx, client, urgencyHint, omen, taken: false };
  });
}

/* ---------------- выбор заказа ---------------- */

export function takeOffer(c: Campaign, offerId: string): Order {
  if (c.status !== 'board' || c.order) throw new Error('Сейчас нельзя взять заказ');
  const offer = c.offers.find((o) => o.id === offerId && !o.taken);
  if (!offer) throw new Error('Нет такого предложения');
  if (c.callsUsed >= PARAMS.callsPerLocation) throw new Error('Вызовы закончились');
  offer.taken = true;
  const isInsp = chance(c.rng, inspectorChance(c.callIndex, c.rep, c.inspectorBonus));
  c.inspectorBonus = 0;
  const role = isInsp ? 'inspector' : 'regular';
  const formal = chance(c.rng, isInsp ? PARAMS.inspectorFormalChance : PARAMS.regularFormalChance);
  const client = isInsp ? { ...offer.client, scandal: false } : { ...offer.client };
  c.callIndex++;
  c.callsUsed++;
  const order: Order = {
    offerId: offer.id, no: offer.no, locIdx: c.locIdx, deviceId: offer.deviceId, faultIdx: offer.faultIdx,
    P: DEVICES[offer.deviceId].price, client, role, formal,
    presetIdx: 0, items: [], stage: 'inspect',
    inspectEndsAt: null, inspected: [], openCard: null,
    asked: [], openAnswer: null,
    mood: client.mood, reactions: [], ceilingC: null, agreedM: null, agreedPrice: null, objected: false,
    attempts: 0, failures: 0, attemptActive: false, repaired: false,
    outcome: null, payment: 0, fine: 0, repDelta: 0, violation: false, applied: false,
  };
  buildRoom(c, order);
  c.order = order;
  c.status = 'order';
  return order;
}

function buildRoom(c: Campaign, o: Order): void {
  const loc = LOCATIONS[o.locIdx];
  o.presetIdx = chance(c.rng, 0.5) ? 0 : 1;
  const cats: Category[] = ['budget', 'knowledge', 'urgency'];
  const cat = cats[Math.floor(next(c.rng) * 3)];
  const reliable = RELIABLE.find((r) => r.category === cat && r.level === o.client[cat])!;
  const susChance = o.role === 'inspector' ? PARAMS.inspectorItemChance : PARAMS.regularItemChance;
  let second: string;
  if (chance(c.rng, susChance)) second = SUS_KINDS[weighted(c.rng, PARAMS.suspiciousKindByLocation[o.locIdx])];
  else second = AMBIGUOUS.find((a) => a.location === loc.id)!.id;
  const preset = PRESETS[loc.id][o.presetIdx];
  const ids = shuffle(c.rng, [reliable.id, second, preset.neutrals[0], preset.neutrals[1]]);
  o.items = ids.map((id, i) => ({
    id,
    kind: ALL_ITEMS[id]?.kind ?? 'neutral',
    slot: i as 0 | 1 | 2 | 3,
    formalVariant: (chance(c.rng, 0.5) ? 0 : 1) as 0 | 1,
  }));
}

/* ---------------- осмотр ---------------- */

export function startInspection(c: Campaign, now: number): void {
  const o = c.order!;
  if (o.stage !== 'inspect' || o.inspectEndsAt !== null) return;
  o.inspectEndsAt = now + PARAMS.inspectionSeconds * 1000;
}

export const inspectionLeft = (o: Order, now: number) =>
  o.inspectEndsAt === null ? PARAMS.inspectionSeconds : Math.max(0, (o.inspectEndsAt - now) / 1000);

export function openItem(c: Campaign, itemId: string, now: number): boolean {
  const o = c.order!;
  if (o.stage !== 'inspect' || o.openCard) return false;
  if (inspectionLeft(o, now) <= 0) return false;
  if (!o.items.some((i) => i.id === itemId)) return false;
  o.openCard = itemId;
  if (!o.inspected.includes(itemId)) o.inspected.push(itemId);
  return true;
}

export function closeCard(c: Campaign, now: number): void {
  const o = c.order!;
  o.openCard = null;
  if (inspectionLeft(o, now) <= 0) toDialogue(c);
}

/** Тик таймера или нажатие на клиента */
export function tickInspection(c: Campaign, now: number): void {
  const o = c.order;
  if (!o || o.stage !== 'inspect') return;
  if (inspectionLeft(o, now) <= 0 && !o.openCard) toDialogue(c);
}

export function toDialogue(c: Campaign): void {
  const o = c.order!;
  if (o.stage !== 'inspect') return;
  o.openCard = null;
  o.stage = 'dialogue';
}

/* ---------------- диалог ---------------- */

export interface QuestionView { id: string; text: string; label: string }

export function availableQuestions(o: Order): QuestionView[] {
  const list: QuestionView[] = [
    { id: 'base_urgency', text: BASE_QUESTIONS.urgency.q, label: 'Спросить про ' + ASK_ABOUT.base_urgency },
    { id: 'base_knowledge', text: BASE_QUESTIONS.knowledge.q, label: 'Спросить про ' + ASK_ABOUT.base_knowledge },
  ];
  for (const id of o.inspected) {
    const it = ALL_ITEMS[id];
    list.push({ id, text: it ? it.question : 'А это у вас что?', label: 'Спросить про ' + (ASK_ABOUT[id] ?? 'этот предмет') });
  }
  return list.filter((q) => !o.asked.includes(q.id));
}

const say = (o: Order, p: Phrase) => (o.formal ? p.formal : p.conv);

export function answerText(o: Order, qid: string): string {
  const c = o.client;
  if (qid === 'base_urgency') return say(o, BASE_QUESTIONS.urgency.a[c.urgency]);
  if (qid === 'base_knowledge') return say(o, BASE_QUESTIONS.knowledge.a[c.knowledge]);
  const def = ALL_ITEMS[qid];
  if (!def) return say(o, NEUTRAL_ANSWER(NEUTRALS[qid]));
  if (def.kind === 'reliable') return say(o, def.answer!);
  if (def.kind === 'ambiguous') {
    const high = def.ambKey === 'knowledge' ? c.knowledge === 2 : c.budget === 2;
    return say(o, high ? def.answerHigh! : def.answerOther!);
  }
  // suspicious: ответ зависит только от манеры речи
  const item = o.items.find((i) => i.id === qid)!;
  return o.formal ? def.susAnswers!.formal[item.formalVariant] : def.susAnswers!.conv;
}

export function ask(c: Campaign, qid: string): string | null {
  const o = c.order!;
  if (o.stage !== 'dialogue' || o.openAnswer || o.asked.length >= PARAMS.questionsToAsk) return null;
  if (!availableQuestions(o).some((q) => q.id === qid)) return null;
  o.asked.push(qid);
  o.openAnswer = qid;
  return answerText(o, qid);
}

export function continueDialogue(c: Campaign): void {
  const o = c.order!;
  if (o.stage !== 'dialogue') return;
  o.openAnswer = null;
  if (o.asked.length >= PARAMS.questionsToAsk) o.stage = 'diagnosis';
}

export function toPrice(c: Campaign): void {
  const o = c.order!;
  if (o.stage === 'diagnosis') o.stage = 'price';
}

/* ---------------- цена ---------------- */

export function propose(c: Campaign, mRaw: number): Reaction {
  const o = c.order!;
  if (o.stage !== 'price' || o.agreedM !== null || o.outcome) throw new Error('Предложение сейчас невозможно');
  const m = Math.min(PARAMS.slider.max, Math.max(PARAMS.slider.min, roundStep(mRaw)));
  const price = priceOf(o.P, m);
  const first = o.reactions.length === 0;
  let r: Reaction;
  if (first) {
    if (o.role === 'inspector') {
      r = { kind: 'accept', line: LINES.accept, m, price };
    } else {
      const rolls = { detect: next(c.rng), goodAccept: next(c.rng), hard: next(c.rng) };
      const out = firstReaction(o.P, m, o.client, o.mood, rolls);
      if (out.kind === 'accept') r = { kind: 'accept', line: LINES.accept, m, price, detected: out.detected };
      else if (out.kind === 'complaint') r = { kind: 'complaint', line: LINES.complaint, m, price, detected: true };
      else {
        o.ceilingC = out.C;
        o.objected = true;
        o.mood = moodDown(o.mood);
        r = { kind: out.kind, line: out.kind === 'hard' ? LINES.hard : LINES.soft, m, price, detected: out.kind === 'hard' ? true : out.detected };
      }
    }
  } else {
    const prev = o.reactions[o.reactions.length - 1];
    if (!secondAllowed(prev.m, m)) throw new Error('Второе предложение должно быть ниже первого');
    if (price <= (o.ceilingC ?? 0) + 1e-6) r = { kind: 'acceptSecond', line: LINES.acceptSecond, m, price };
    else { r = { kind: 'leave', line: LINES.leave, m, price }; o.mood = 0; }
  }
  o.reactions.push(r);
  if (r.kind === 'accept' || r.kind === 'acceptSecond') {
    o.agreedM = m;
    o.agreedPrice = price;
    o.stage = 'repair';
  } else if (r.kind === 'leave') {
    finishWithoutRepair(c, 'left');
  } else if (r.kind === 'complaint') {
    o.mood = 0;
    finishWithoutRepair(c, 'complaint');
  }
  return r;
}

function finishWithoutRepair(c: Campaign, outcome: 'left' | 'complaint'): void {
  const o = c.order!;
  o.outcome = outcome;
  o.repDelta = repForOutcome({ outcome, objected: o.objected, failures: 0, agreedM: null });
  o.stage = 'result';
  settle(c);
}

/* ---------------- ремонт ---------------- */

export function beginAttempt(c: Campaign): void {
  const o = c.order!;
  if (o.stage !== 'repair' || o.repaired || o.attemptActive) return;
  o.attempts++;
  o.attemptActive = true;
}

export function failAttempt(c: Campaign): void {
  const o = c.order!;
  if (o.stage !== 'repair' || !o.attemptActive) return;
  o.attemptActive = false;
  o.failures++;
}

export function succeedAttempt(c: Campaign): void {
  const o = c.order!;
  if (o.stage !== 'repair' || !o.attemptActive) return;
  o.attemptActive = false;
  o.repaired = true;
  o.outcome = 'paid';
  const factor = o.failures > 0 ? PARAMS.failedPaymentFactor : 1;
  o.payment = Math.round(o.agreedPrice! * factor);
  o.repDelta = repForOutcome({ outcome: 'paid', objected: o.objected, failures: o.failures, agreedM: o.agreedM });
  if (o.role === 'inspector' && isViolation(o.agreedM!)) {
    o.violation = true;
    o.fine = fineFor(o.P, o.agreedPrice!);
    o.repDelta += PARAMS.inspectorRepPenalty;
  }
  o.stage = 'result';
  settle(c);
}

/** Загрузка во время попытки ремонта: попытка засчитывается проваленной. */
export function onLoad(c: Campaign): void {
  const o = c.order;
  if (o && o.stage === 'repair' && o.attemptActive) failAttempt(c);
}

/* ---------------- итог ---------------- */

function settle(c: Campaign): void {
  const o = c.order!;
  if (o.applied) return;
  o.applied = true;
  c.money += o.payment - o.fine;
  c.rep = clampRep(c.rep + o.repDelta);
  if (o.violation) c.violations++;
  if (o.outcome === 'complaint') c.inspectorBonus = PARAMS.complaintInspectorBonus;
}

export interface LocationState {
  quota: number;
  canMove: boolean;
  canWin: boolean;
  callsLeft: number;
  isOffice: boolean;
}

export function locationState(c: Campaign): LocationState {
  const loc = LOCATIONS[c.locIdx];
  const isOffice = c.locIdx === LOCATIONS.length - 1;
  return {
    quota: loc.quota,
    canMove: !isOffice && c.money >= loc.quota,
    canWin: isOffice && c.money >= loc.quota && c.rep >= PARAMS.winRep,
    callsLeft: PARAMS.callsPerLocation - c.callsUsed,
    isOffice,
  };
}

/** Закрыть экран результата заказа и проверить условия кампании. */
export function finishOrder(c: Campaign): void {
  const o = c.order;
  if (!o || o.stage !== 'result') return;
  c.history.push({
    no: o.no, locIdx: o.locIdx, deviceId: o.deviceId, client: o.client.name, role: o.role, outcome: o.outcome!,
    P: o.P, agreedPrice: o.agreedPrice, payment: o.payment, fine: o.fine, repDelta: o.repDelta, violation: o.violation,
  });
  c.order = null;
  c.status = 'board';
  if (c.violations >= PARAMS.maxViolations) { c.status = 'gameover'; c.ending = 'arrest'; return; }
  const s = locationState(c);
  if (s.callsLeft <= 0) {
    if (s.isOffice) {
      if (s.canWin) { c.status = 'victory'; c.ending = 'win'; }
      else { c.status = 'gameover'; c.ending = c.money >= s.quota ? 'rep' : 'money'; }
    } else if (s.canMove) c.status = 'mustMove';
    else { c.status = 'gameover'; c.ending = 'money'; }
  }
}

export function moveNext(c: Campaign): void {
  if (c.order) return;
  const s = locationState(c);
  if (!s.canMove) return;
  c.money -= LOCATIONS[c.locIdx].moveCost;
  c.locIdx++;
  c.callsUsed = 0;
  c.locationStartMoney = c.money;
  c.status = 'board';
  generateOffers(c);
}

export function openWorkshop(c: Campaign): void {
  if (c.order) return;
  if (locationState(c).canWin) { c.status = 'victory'; c.ending = 'win'; }
}
