// Пиксельные инструменты: всё рисуется прямоугольниками на маленьком холсте,
// который потом растягивается без сглаживания. Стиль: тёмный контур, светлая грань сверху, тень снизу.

export type Ctx = CanvasRenderingContext2D;

const hexCache = new Map<string, [number, number, number]>();
export function rgb(hex: string): [number, number, number] {
  const h = hexCache.get(hex);
  if (h) return h;
  const v = hex.replace('#', '');
  const n = parseInt(v.length === 3 ? v.split('').map((x) => x + x).join('') : v, 16);
  const r: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  hexCache.set(hex, r);
  return r;
}
/** Осветлить (k > 0) или затемнить (k < 0) цвет. */
export function shade(hex: string, k: number): string {
  const [r, g, b] = rgb(hex);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
export function mix(a: string, b: string, t: number): string {
  const A = rgb(a), B = rgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}

export function rect(c: Ctx, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export const px = (c: Ctx, x: number, y: number, col: string) => rect(c, x, y, 1, 1, col);

/** Объёмный блок: контур, блик сверху и слева, тень снизу и справа. */
export function block(c: Ctx, x: number, y: number, w: number, h: number, base: string, o: { outline?: boolean; light?: number; dark?: number } = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (w <= 0 || h <= 0) return;
  const out = o.outline !== false;
  if (out) rect(c, x, y, w, h, shade(base, -0.55));
  const ix = out ? x + 1 : x, iy = out ? y + 1 : y, iw = out ? w - 2 : w, ih = out ? h - 2 : h;
  if (iw <= 0 || ih <= 0) return;
  rect(c, ix, iy, iw, ih, base);
  rect(c, ix, iy, iw, 1, shade(base, o.light ?? 0.28));
  if (ih > 2) rect(c, ix, iy, 1, ih, shade(base, (o.light ?? 0.28) * 0.5));
  if (ih > 2) rect(c, ix, iy + ih - 1, iw, 1, shade(base, -(o.dark ?? 0.25)));
  if (iw > 2) rect(c, ix + iw - 1, iy + 1, 1, ih - 1, shade(base, -(o.dark ?? 0.25) * 0.7));
}

/** Шахматное сглаживание (дизеринг) между двумя цветами — для неба, теней, тканей. */
export function dither(c: Ctx, x: number, y: number, w: number, h: number, a: string, b: string, density = 0.5, seed = 0) {
  rect(c, x, y, w, h, a);
  c.fillStyle = b;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const t = ((i + seed) * 7 + (j + seed) * 13) % 4;
    const m = density >= 0.75 ? t !== 3 : density >= 0.5 ? (i + j) % 2 === 0 : density >= 0.25 ? t === 0 : false;
    if (m) c.fillRect(x + i, y + j, 1, 1);
  }
}

/** Вертикальный градиент полосами (как в пиксель-арте: ступеньки + дизеринг на стыках). */
export function bands(c: Ctx, x: number, y: number, w: number, h: number, top: string, bottom: string, steps = 6) {
  const sh = h / steps;
  for (let s = 0; s < steps; s++) {
    const col = mix(top, bottom, s / (steps - 1));
    rect(c, x, y + Math.floor(s * sh), w, Math.ceil(sh), col);
    if (s > 0) { c.fillStyle = mix(top, bottom, (s - 1) / (steps - 1)); for (let i = 0; i < w; i += 2) c.fillRect(x + i + ((s % 2) ? 1 : 0), y + Math.floor(s * sh), 1, 1); }
  }
}

export function line(c: Ctx, x0: number, y0: number, x1: number, y1: number, col: string) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  c.fillStyle = col;
  for (;;) { c.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

export function circle(c: Ctx, cx: number, cy: number, r: number, col: string) {
  c.fillStyle = col;
  for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
}

/** Мягкое световое пятно (рисуется в режиме 'lighter'). */
export function glow(c: Ctx, x: number, y: number, r: number, col: string, a = 0.35) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  const [R, G, B] = rgb(col);
  g.addColorStop(0, `rgba(${R},${G},${B},${a})`);
  g.addColorStop(1, `rgba(${R},${G},${B},0)`);
  const prev = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  c.globalCompositeOperation = prev;
}

/** Крошечный пиксельный шрифт 3×5 для надписей в сцене (цифры, заглавные кириллица/латиница по нужде). */
const FONT: Record<string, string> = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  ':': '000010000010000', '.': '000000000000010', '-': '000000111000000', '%': '101001010100101', '!': '010010010000010',
  'А': '010101111101101', 'Б': '111100111101111', 'В': '110101110101110', 'Г': '111100100100100', 'Д': '011101101111101', 'Е': '111100110100111',
  'Ж': '101101010101101', 'З': '110001010001110', 'И': '101101111111101', 'К': '101110100110101', 'Л': '011101101101101', 'М': '101111111101101',
  'Н': '101101111101101', 'О': '111101101101111', 'П': '111101101101101', 'Р': '111101111100100', 'С': '111100100100111', 'Т': '111010010010010',
  'У': '101101111001111', 'Ф': '111111111010010', 'Х': '101101010101101', 'Ц': '101101101111001', 'Ч': '101101111001001', 'Ш': '101101111111111',
  'Ы': '101101111111111', 'Ь': '100100111101111', 'Э': '110001011001110', 'Ю': '101111111111101', 'Я': '111101111011101', ' ': '000000000000000',
  'A': '010101111101101', 'B': '110101110101110', 'C': '111100100100111', 'E': '111100110100111', 'G': '111100101101111', 'K': '101110100110101',
  'L': '100100100100111', 'M': '101111111101101', 'N': '111101101101101', 'O': '111101101101111', 'P': '111101111100100', 'R': '110101110101101',
  'S': '111100111001111', 'T': '111010010010010', 'V': '101101101101010', 'X': '101101010101101', '°': '010101010000000', '+': '000010111010000',
};
export function text(c: Ctx, s: string, x: number, y: number, col: string) {
  c.fillStyle = col;
  let cx = Math.round(x);
  for (const ch of s.toUpperCase()) {
    const g = FONT[ch] ?? FONT[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') c.fillRect(cx + (i % 3), Math.round(y) + Math.floor(i / 3), 1, 1);
    cx += 4;
  }
}
export const textW = (s: string) => s.length * 4 - 1;

/** Кэш спрайтов: рисуем один раз в отдельный холст. */
const cache = new Map<string, HTMLCanvasElement>();
export function sprite(key: string, w: number, h: number, draw: (c: Ctx) => void): HTMLCanvasElement {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!; c.imageSmoothingEnabled = false;
  draw(c);
  cache.set(key, cv);
  return cv;
}

/** Контур спрайта (для подсветки при наведении): белая обводка по непрозрачным пикселям. */
const outlineCache = new Map<HTMLCanvasElement, HTMLCanvasElement>();
export function outlineOf(src: HTMLCanvasElement, col = '#fff6c9'): HTMLCanvasElement {
  const hit = outlineCache.get(src);
  if (hit) return hit;
  const w = src.width + 2, h = src.height + 2;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!;
  const d = src.getContext('2d')!.getImageData(0, 0, src.width, src.height).data;
  c.fillStyle = col;
  const op = (x: number, y: number) => x >= 0 && y >= 0 && x < src.width && y < src.height && d[(y * src.width + x) * 4 + 3] > 40;
  for (let y = -1; y <= src.height; y++) for (let x = -1; x <= src.width; x++) {
    if (op(x, y)) continue;
    if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1)) c.fillRect(x + 1, y + 1, 1, 1);
  }
  outlineCache.set(src, cv);
  return cv;
}

/** Детерминированный ГПСЧ для декора. */
export function rnd(seed: number) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
