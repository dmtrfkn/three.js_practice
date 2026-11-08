import { describe, it, expect } from 'vitest';
import { limitL, noticeChance, inspectorChance, firstReaction, repForOutcome, isViolation, fineFor, secondAllowed } from '../../src/core/rules';
import {
  newCampaign, takeOffer, startInspection, openItem, closeCard, tickInspection, availableQuestions, ask, continueDialogue,
  toPrice, propose, beginAttempt, failAttempt, succeedAttempt, finishOrder, moveNext, locationState, onLoad,
} from '../../src/core/campaign';
import type { ClientTraits } from '../../src/core/types';

const client = (o: Partial<ClientTraits> = {}): ClientTraits => ({ name: 'Кирилл', budget: 1, knowledge: 1, urgency: 1, mood: 1, scandal: false, ...o });
const noRoll = { detect: 0.999, goodAccept: 0.999, hard: 0.999 };
const yesRoll = { detect: 0, goodAccept: 0, hard: 0 };

describe('формулы реестра', () => {
  it('предел согласия L', () => {
    expect(limitL(1000, 0, 1, 1)).toBeCloseTo(1100);
    expect(limitL(1000, 1, 0, 2)).toBeCloseTo(1350);
    expect(limitL(1000, 2, 2, 2)).toBeCloseTo(1850);
  });
  it('обнаружение наценки', () => {
    expect(noticeChance(1.2, 2)).toBe(0);
    expect(noticeChance(1.3, 0)).toBeCloseTo(0.15);
    expect(noticeChance(1.5, 1)).toBeCloseTo(0.5);
    expect(noticeChance(2.0, 2)).toBeCloseTo(0.95);
  });
  it('шанс инспектора', () => {
    expect(inspectorChance(0, 0, 0)).toBe(0);
    expect(inspectorChance(1, 0, 0)).toBeCloseTo(0.2);
    expect(inspectorChance(1, 20, 0)).toBeCloseTo(0.05);
    expect(inspectorChance(1, -20, 0)).toBeCloseTo(0.4);
    expect(inspectorChance(1, 0, 10)).toBeCloseTo(0.3);
    expect(inspectorChance(1, -15, 10)).toBeCloseTo(0.4);
  });
  it('цена не выше рыночной всегда принимается', () => {
    expect(firstReaction(2500, 1.0, client({ budget: 0 }), 0, yesRoll).kind).toBe('accept');
    expect(firstReaction(2500, 0.75, client(), 0, yesRoll).kind).toBe('accept');
  });
  it('не замечена и в пределе — согласие', () => {
    expect(firstReaction(2500, 1.2, client({ budget: 1 }), 1, yesRoll).kind).toBe('accept');
  });
  it('не замечена, но выше L — мягкое требование; C = min(Lнов, Pпред − 0,05P)', () => {
    const r = firstReaction(2500, 1.2, client({ budget: 0, mood: 1 }), 1, noRoll);
    expect(r.kind).toBe('soft');
    if (r.kind === 'soft') expect(r.C).toBeCloseTo(2500 * 1.0); // настроение упало до плохого: 1,10 − 0,10
  });
  it('замечена при высоком знании — требование скидки 0,90P', () => {
    const r = firstReaction(2500, 1.5, client({ knowledge: 2 }), 1, yesRoll);
    expect(r).toEqual({ kind: 'hard', C: 2250 });
  });
  it('низкое знание никогда не требует скидку от рынка', () => {
    const r = firstReaction(2500, 1.9, client({ knowledge: 0 }), 1, yesRoll);
    expect(r.kind).toBe('soft');
  });
  it('хорошее настроение: 30 % согласиться после обнаружения', () => {
    expect(firstReaction(2500, 1.3, client({ budget: 1 }), 2, { detect: 0, goodAccept: 0.1, hard: 0.9 }).kind).toBe('accept');
    expect(firstReaction(2500, 1.3, client({ budget: 1 }), 2, { detect: 0, goodAccept: 0.5, hard: 0.9 }).kind).toBe('soft');
  });
  it('скандальный клиент жалуется при обнаружении от ×1,30', () => {
    expect(firstReaction(2500, 1.3, client({ scandal: true }), 1, yesRoll).kind).toBe('complaint');
    expect(firstReaction(2500, 1.25, client({ scandal: true }), 1, yesRoll).kind).not.toBe('complaint');
    expect(firstReaction(2500, 1.5, client({ scandal: true }), 1, noRoll).kind).not.toBe('complaint');
  });
  it('второе предложение строго ниже на шаг', () => {
    expect(secondAllowed(1.3, 1.25)).toBe(true);
    expect(secondAllowed(1.3, 1.3)).toBe(false);
  });
  it('репутация по исходу', () => {
    expect(repForOutcome({ outcome: 'paid', objected: false, failures: 0, agreedM: 1.2 })).toBe(2);
    expect(repForOutcome({ outcome: 'paid', objected: false, failures: 0, agreedM: 0.9 })).toBe(3);
    expect(repForOutcome({ outcome: 'paid', objected: true, failures: 0, agreedM: 1.0 })).toBe(1);
    expect(repForOutcome({ outcome: 'paid', objected: true, failures: 2, agreedM: 1.0 })).toBe(0);
    expect(repForOutcome({ outcome: 'left', objected: true, failures: 0, agreedM: null })).toBe(-4);
    expect(repForOutcome({ outcome: 'complaint', objected: false, failures: 0, agreedM: null })).toBe(-6);
  });
  it('нарушение и штраф', () => {
    expect(isViolation(1.2)).toBe(false);
    expect(isViolation(1.25)).toBe(true);
    expect(fineFor(2500, 4000)).toBe(3000);
  });
});

describe('жизненный цикл заказа', () => {
  it('создаёт 5 предложений: 2/2/1, имена без повторов', () => {
    const c = newCampaign(42);
    expect(c.offers).toHaveLength(5);
    const tiers = c.offers.map((o) => o.tier).sort();
    expect(tiers).toEqual([0, 0, 1, 1, 2]);
    expect(new Set(c.offers.map((o) => o.client.name)).size).toBe(5);
  });

  it('первый вызов — никогда не инспектор; комната из 4 разных предметов', () => {
    for (let s = 1; s < 200; s++) {
      const c = newCampaign(s);
      const o = takeOffer(c, c.offers[0].id);
      expect(o.role).toBe('regular');
      expect(new Set(o.items.map((i) => i.id)).size).toBe(4);
      expect(o.items.map((i) => i.slot).sort()).toEqual([0, 1, 2, 3]);
      expect(o.items.filter((i) => i.kind === 'reliable')).toHaveLength(1);
      expect(o.items.filter((i) => i.kind === 'neutral')).toHaveLength(2);
    }
  });

  it('полный проход заказа: осмотр → диалог → цена → ремонт → оплата один раз', () => {
    const c = newCampaign(7);
    const o = takeOffer(c, c.offers[0].id);
    const t0 = 1_000_000;
    startInspection(c, t0);
    expect(openItem(c, o.items[0].id, t0 + 1000)).toBe(true);
    closeCard(c, t0 + 2000);
    tickInspection(c, t0 + 31_000);
    expect(o.stage).toBe('dialogue');
    const qs = availableQuestions(o);
    expect(qs).toHaveLength(3);
    expect(ask(c, qs[0].id)).toBeTruthy();
    continueDialogue(c);
    expect(ask(c, availableQuestions(o)[0].id)).toBeTruthy();
    continueDialogue(c);
    expect(o.stage).toBe('diagnosis');
    toPrice(c);
    const r = propose(c, 1.0);
    expect(r.kind).toBe('accept');
    beginAttempt(c); failAttempt(c);
    beginAttempt(c); succeedAttempt(c);
    expect(o.payment).toBe(Math.round(o.P * 0.8));
    expect(o.repDelta).toBe(0);
    const money = c.money;
    finishOrder(c);
    expect(c.money).toBe(money);
    expect(c.callsUsed).toBe(1);
    expect(c.status).toBe('board');
  });

  it('загрузка во время попытки засчитывает провал', () => {
    const c = newCampaign(9);
    takeOffer(c, c.offers[0].id);
    const o = c.order!;
    o.stage = 'price'; propose(c, 1.0);
    beginAttempt(c);
    const restored = JSON.parse(JSON.stringify(c));
    onLoad(restored);
    expect(restored.order.failures).toBe(1);
    expect(restored.order.attemptActive).toBe(false);
  });

  it('переезд списывает стоимость и создаёт новые предложения', () => {
    const c = newCampaign(11);
    c.money = 9000;
    expect(locationState(c).canMove).toBe(true);
    moveNext(c);
    expect(c.locIdx).toBe(1);
    expect(c.money).toBe(8000);
    expect(c.offers[0].deviceId).toMatch(/tv|washer|fridge/);
  });

  it('инспектор: наценка выше 1,20 → штраф и нарушение; второе — арест', () => {
    const c = newCampaign(5);
    for (let k = 0; k < 2; k++) {
      takeOffer(c, c.offers.find((x) => !x.taken)!.id);
      const o = c.order!;
      o.role = 'inspector';
      o.stage = 'price';
      propose(c, 1.6);
      beginAttempt(c); succeedAttempt(c);
      expect(o.violation).toBe(true);
      expect(o.fine).toBe(2 * (o.agreedPrice! - o.P));
      finishOrder(c);
    }
    expect(c.status).toBe('gameover');
    expect(c.ending).toBe('arrest');
  });
});
