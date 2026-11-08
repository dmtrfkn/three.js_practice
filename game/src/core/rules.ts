// Чистые формулы ГДД: предел согласия, обнаружение наценки, шанс инспектора, репутация.
import { PARAMS, type Level } from './params';
import type { ClientTraits } from './types';

const EPS = 1e-9;

export const roundStep = (m: number) => Math.round(m / PARAMS.slider.step) * PARAMS.slider.step;
export const priceOf = (P: number, m: number) => Math.round(P * m);
export const clampRep = (r: number) => Math.max(PARAMS.repMin, Math.min(PARAMS.repMax, r));

/** L = P × (b + δн + δс) — в рублях */
export function limitL(P: number, budget: Level, mood: Level, urgency: Level): number {
  return P * (PARAMS.budgetBase[budget] + PARAMS.moodDelta[mood] + (urgency === 2 ? PARAMS.urgencyHighDelta : 0));
}

/** Шанс заметить наценку, 0..1 */
export function noticeChance(m: number, knowledge: Level): number {
  if (m <= PARAMS.noticeFreeUpTo + EPS) return 0;
  return Math.min(PARAMS.noticeCap, PARAMS.noticeK[knowledge] + PARAMS.noticeSlope * (m - PARAMS.noticeFreeUpTo)) / 100;
}

/** Шанс, что выбранный клиент — инспектор, 0..1 */
export function inspectorChance(callIndex: number, rep: number, bonus: number): number {
  if (callIndex === 0) return 0;
  const base = Math.min(PARAMS.inspectorMax, Math.max(PARAMS.inspectorMin, PARAMS.inspectorBase - rep));
  return Math.min(PARAMS.inspectorMax, base + bonus) / 100;
}

export const moodDown = (m: Level): Level => (m > 0 ? ((m - 1) as Level) : 0);

export interface FirstRolls { detect: number; goodAccept: number; hard: number }

export type FirstOutcome =
  | { kind: 'accept'; detected: boolean }
  | { kind: 'complaint' }
  | { kind: 'soft'; detected: boolean; C: number }
  | { kind: 'hard'; C: number };

/** Реакция обычного клиента на первое предложение (rolls — заранее сохранённые броски 0..1). */
export function firstReaction(P: number, m: number, c: ClientTraits, mood: Level, rolls: FirstRolls): FirstOutcome {
  const price = priceOf(P, m);
  if (m <= 1 + EPS) return { kind: 'accept', detected: false };
  const L = limitL(P, c.budget, mood, c.urgency);
  const detected = rolls.detect < noticeChance(m, c.knowledge);
  if (detected && c.scandal && m >= PARAMS.scandalTriggerMult - EPS) return { kind: 'complaint' };
  const withinL = price <= L + EPS;
  if (!detected && withinL) return { kind: 'accept', detected: false };
  if (detected && withinL && mood === 2 && rolls.goodAccept < PARAMS.goodMoodAcceptChance) return { kind: 'accept', detected: true };
  // отказ
  const newMood = moodDown(mood);
  if (detected && rolls.hard < PARAMS.hardDemandChance[c.knowledge]) {
    return { kind: 'hard', C: PARAMS.hardDemandCap[c.knowledge] * P };
  }
  const Lnew = limitL(P, c.budget, newMood, c.urgency);
  const C = Math.min(Lnew, price - PARAMS.slider.step * P);
  return { kind: 'soft', detected, C };
}

/** Можно ли предложить второй раз этот множитель */
export const secondAllowed = (prevM: number, m: number) => m <= prevM - PARAMS.slider.step + EPS;

/** Изменение репутации за заказ (без нарушения). */
export function repForOutcome(o: { outcome: 'paid' | 'left' | 'complaint'; objected: boolean; failures: number; agreedM: number | null }): number {
  const R = PARAMS.rep;
  if (o.outcome === 'left') return R.left;
  if (o.outcome === 'complaint') return R.complaint;
  if (o.failures > 0) return R.retry;
  if (o.objected) return R.objectedFirst;
  if (o.agreedM !== null && o.agreedM <= PARAMS.discountMult + EPS) return R.discountFirst;
  return R.cleanFirst;
}

export const isViolation = (agreedM: number) => agreedM > PARAMS.inspectorSafeMult + EPS;
export const fineFor = (P: number, agreedPrice: number) => PARAMS.inspectorFineFactor * (agreedPrice - P);
