// Сидируемый генератор (mulberry32). Состояние хранится в сохранении,
// поэтому загрузка продолжает ту же последовательность бросков.

export interface RngState { s: number }

export function makeRng(seed: number): RngState {
  return { s: seed >>> 0 };
}

export function next(r: RngState): number {
  r.s = (r.s + 0x6d2b79f5) >>> 0;
  let t = r.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** true с вероятностью p (0..1) */
export function chance(r: RngState, p: number): boolean {
  return next(r) < p;
}

/** индекс по весам */
export function weighted(r: RngState, weights: readonly number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let x = next(r) * total;
  for (let i = 0; i < weights.length; i++) {
    x -= weights[i];
    if (x < 0) return i;
  }
  return weights.length - 1;
}

export function pick<T>(r: RngState, arr: readonly T[]): T {
  return arr[Math.floor(next(r) * arr.length)];
}

export function shuffle<T>(r: RngState, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next(r) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
