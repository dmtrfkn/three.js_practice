// Комнаты в разрезе дома: стены, пол, окно с пейзажем, мебель и анимированные детали.
// Масштаб 1 px ≈ 2,5 см. Пол — FLOOR; потолок — FLOOR − высота комнаты.
import { block, rect, px, shade, mix, dither, bands, line, circle, glow, text, rnd, type Ctx } from './pix';

export const FLOOR = 164;

export interface RoomLook {
  w: number; h: number;                 // размеры комнаты, px
  wall: string; wallLow: string; split: number; pattern: 'paint' | 'flowers' | 'plain' | 'stone' | 'office';
  floor: string; floorKind: 'plank' | 'parquet' | 'laminate' | 'dark' | 'carpet';
  ceil: string; base: string;
  sky: [string, string]; time: 'evening' | 'day' | 'morning' | 'night';
  tint: string; tintA: number;          // общая окраска света
  lamp: string; brick: string;
  surface: string; surfaceLeg: string;
}

export const LOOKS: Record<string, RoomLook> = {
  dorm:   { w: 184, h: 104, wall: '#d9d5c6', wallLow: '#5e8c6a', split: 50, pattern: 'paint', floor: '#b98756', floorKind: 'plank', ceil: '#e9e7df', base: '#6b4b32', sky: ['#7d6aa1', '#f0a868'], time: 'evening', tint: '#ffb070', tintA: 0.12, lamp: '#ffd9a0', brick: '#8a5a44', surface: '#a7825a', surfaceLeg: '#6e5238' },
  khr:    { w: 208, h: 100, wall: '#d8c39c', wallLow: '#8b6a4f', split: 38, pattern: 'flowers', floor: '#7a4e2f', floorKind: 'parquet', ceil: '#efe6d6', base: '#4a2f1e', sky: ['#9cc2e8', '#f7e2b0'], time: 'day', tint: '#ffcf8a', tintA: 0.10, lamp: '#ffcf8a', brick: '#a8a090', surface: '#7a4e2f', surfaceLeg: '#4a2f1e' },
  new:    { w: 260, h: 112, wall: '#eef0ef', wallLow: '#e4e6e5', split: 0, pattern: 'plain', floor: '#d0b48d', floorKind: 'laminate', ceil: '#f5f6f5', base: '#f1f1ec', sky: ['#9cc2e8', '#e8f2fb'], time: 'morning', tint: '#ffffff', tintA: 0.04, lamp: '#fff1d6', brick: '#c7cfd8', surface: '#d7c3a2', surfaceLeg: '#b9a27e' },
  elite:  { w: 368, h: 148, wall: '#56645d', wallLow: '#4a5a52', split: 0, pattern: 'stone', floor: '#3a2c22', floorKind: 'dark', ceil: '#4a504c', base: '#c9a24a', sky: ['#0d1428', '#3a2a50'], time: 'night', tint: '#ff9a52', tintA: 0.10, lamp: '#ffb067', brick: '#2a3038', surface: '#2a2522', surfaceLeg: '#c9a24a' },
  office: { w: 400, h: 128, wall: '#dfe5ea', wallLow: '#9aa7b4', split: 40, pattern: 'office', floor: '#4f5d6e', floorKind: 'carpet', ceil: '#f0f3f6', base: '#5b6672', sky: ['#9fb6d1', '#d6e6f6'], time: 'day', tint: '#dfefff', tintA: 0.06, lamp: '#eaf3ff', brick: '#8aa2bf', surface: '#c9ced4', surfaceLeg: '#8a939d' },
};

/** Расстановка игровых точек вдоль комнаты (доли ширины). */
export const ANCHORS = { door: 0.03, master: 0.09, slots: [0.19, 0.35, 0.66, 0.81], device: 0.5, client: 0.93 };

/* ---------------- здание и окружение ---------------- */

export function drawExterior(c: Ctx, look: RoomLook, x0: number, y0: number, viewW: number, viewH: number, t: number) {
  bands(c, x0, y0, viewW, viewH, look.sky[0], look.sky[1], 7);
  if (look.time === 'night') { const r = rnd(5); for (let i = 0; i < 70; i++) px(c, x0 + r() * viewW, y0 + r() * viewH * 0.6, r() < 0.3 ? '#ffffff' : '#9fb0d0'); }
}

export function drawBuilding(c: Ctx, look: RoomLook, rx: number, y0: number, viewH: number, t: number, locId: string) {
  const top = FLOOR - look.h, W = look.w;
  const wallT = 8;
  // стены дома слева/справа (кирпич) и перекрытия
  const brick = (x: number, y: number, w: number, h: number) => {
    rect(c, x, y, w, h, look.brick);
    for (let j = 0; j < h; j += 4) for (let i = (j / 4) % 2 ? 0 : 4; i < w; i += 8) rect(c, x + i, y + j, 7, 3, shade(look.brick, 0.08));
  };
  brick(rx - wallT, y0 - 8, wallT, viewH + 16);
  brick(rx + W, y0 - 8, wallT, viewH + 16);
  // перекрытие сверху и сосед сверху
  block(c, rx - wallT, top - 8, W + wallT * 2, 8, '#8a8d92', { light: 0.15 });
  rect(c, rx, Math.min(top - 60, y0), W, top - 8 - Math.min(top - 60, y0), shade(look.wall, -0.45));
  for (let fy = top - 8 - 100; fy > y0 - 8; fy -= 100) block(c, rx - wallT, fy, W + wallT * 2, 8, '#8a8d92', { light: 0.15 });
  rect(c, rx, top - 14, W, 6, shade(look.floor, -0.4));
  const r = rnd(locId.length * 13);
  for (let i = 0; i < 3; i++) { const sx = rx + 20 + r() * (W - 60); rect(c, sx, top - 40, 22, 26, shade(look.wall, -0.55)); if ((Math.floor(t / 4) + i) % 3) rect(c, sx + 2, top - 38, 18, 20, mix('#ffd27a', look.wall, 0.4)); }
  // перекрытие снизу и сосед снизу
  block(c, rx - wallT, FLOOR, W + wallT * 2, 8, '#8a8d92', { light: 0.15 });
  rect(c, rx, FLOOR + 8, W, Math.max(60, y0 + viewH - FLOOR), shade(look.wall, -0.5));
  rect(c, rx + W * 0.3, FLOOR + 14, 30, 22, shade(look.wall, -0.6));
  if (Math.sin(t * 0.7) > -0.3) glow(c, rx + W * 0.3 + 15, FLOOR + 25, 26, '#ffd27a', 0.18);
}

/* ---------------- стены, пол, окно ---------------- */

export function drawRoomShell(c: Ctx, look: RoomLook, rx: number, t: number, locId: string) {
  const top = FLOOR - look.h, W = look.w;
  // стена
  rect(c, rx, top, W, look.h, look.wall);
  if (look.pattern === 'flowers') { for (let y = top + 4; y < FLOOR - look.split; y += 10) for (let x = rx + ((y / 10) % 2 ? 2 : 7); x < rx + W; x += 10) { px(c, x, y, '#b0503c'); px(c, x - 1, y + 1, '#b0503c'); px(c, x + 1, y + 1, '#b0503c'); px(c, x, y + 2, '#b0503c'); px(c, x + 1, y + 3, '#6e8a50'); } for (let x = rx; x < rx + W; x += 5) rect(c, x, top, 1, look.h - look.split, shade(look.wall, -0.04)); }
  if (look.pattern === 'stone') { const r = rnd(9); for (let i = 0; i < 26; i++) { const x = rx + r() * W, y = top + r() * look.h; line(c, x, y, x + 14 + r() * 20, y + (r() - 0.5) * 10, shade(look.wall, 0.12)); } for (let x = rx + 46; x < rx + W; x += 46) rect(c, x, top, 1, look.h, shade(look.wall, -0.25)); }
  if (look.pattern === 'paint') { const r = rnd(3); for (let i = 0; i < 6; i++) dither(c, rx + r() * (W - 20), top + 6 + r() * 30, 10 + r() * 14, 6 + r() * 8, look.wall, shade(look.wall, -0.07), 0.25); }
  // нижняя панель стены
  if (look.split > 0) { rect(c, rx, FLOOR - look.split, W, look.split, look.wallLow); rect(c, rx, FLOOR - look.split, W, 2, shade(look.wallLow, -0.3)); if (look.pattern === 'flowers') for (let x = rx; x < rx + W; x += 6) rect(c, x, FLOOR - look.split + 2, 1, look.split - 2, shade(look.wallLow, -0.12)); }
  // потолок
  rect(c, rx, top, W, 3, look.ceil); rect(c, rx, top + 3, W, 1, shade(look.ceil, -0.2));
  // плинтус
  rect(c, rx, FLOOR - 3, W, 3, look.base);
  // пол (видимая толщина — 6 px)
  const fl = look.floor;
  rect(c, rx, FLOOR, W, 6, fl);
  if (look.floorKind === 'plank' || look.floorKind === 'laminate' || look.floorKind === 'dark') for (let x = rx; x < rx + W; x += 16) { rect(c, x, FLOOR, 1, 6, shade(fl, -0.25)); rect(c, x + 8, FLOOR + 3, 1, 3, shade(fl, -0.25)); }
  if (look.floorKind === 'parquet') for (let x = rx; x < rx + W; x += 6) rect(c, x, FLOOR + ((x / 6) % 2 ? 0 : 3), 6, 1, shade(fl, -0.2));
  if (look.floorKind === 'carpet') dither(c, rx, FLOOR, W, 6, fl, shade(fl, 0.1), 0.25);
  rect(c, rx, FLOOR, W, 1, shade(fl, 0.25));
}

/** Окно с пейзажем: x — левый край, ширина/высота в px. */
export function drawWindow(c: Ctx, look: RoomLook, x: number, y: number, w: number, h: number, t: number, locId: string, curtains = true) {
  // вид
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  bands(c, x, y, w, h, look.sky[0], look.sky[1], 6);
  const r = rnd(locId.length * 7);
  if (look.time === 'night') {
    for (let i = 0; i < 40; i++) px(c, x + r() * w, y + r() * h * 0.5, '#ffffff');
    for (let i = 0; i < 18; i++) { const bw = 6 + r() * 12, bh = 20 + r() * (h * 0.7), bx = x + i * (w / 16) - 4; rect(c, bx, y + h - bh, bw, bh, '#141a2b'); for (let k = 0; k < 8; k++) if (r() < 0.5) px(c, bx + 1 + r() * (bw - 2), y + h - bh + r() * bh, '#ffcf7a'); }
    // машины внизу
    const cx = x + ((t * 30) % (w + 40)) - 20; rect(c, cx, y + h - 3, 3, 1, '#ff3b30'); rect(c, x + w - ((t * 22) % (w + 40)) + 20, y + h - 2, 3, 1, '#fff6c9');
  } else {
    // облака
    for (let i = 0; i < 3; i++) { const cx = x + ((t * (3 + i) + i * 60) % (w + 40)) - 20, cy = y + 6 + i * 7; rect(c, cx, cy, 14, 3, '#ffffff'); rect(c, cx + 3, cy - 2, 7, 2, '#ffffff'); }
    // дом напротив / стройка / бизнес-центр
    if (locId === 'dorm' || locId === 'khr') { rect(c, x + 4, y + h * 0.35, w - 8, h, '#c9b8a6'); for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) rect(c, x + 7 + i * ((w - 12) / 5), y + h * 0.4 + j * 8, 4, 5, (i + j + Math.floor(t / 7)) % 3 ? '#5b5f70' : '#ffd27a'); circle(c, x + 6, y + h - 4, 6, '#3f4a3a'); }
    if (locId === 'new') { for (let i = 0; i < 4; i++) rect(c, x + 4 + i * (w / 4), y + h * 0.45 - (i % 2) * 6, w / 5, h, '#c7cfd8'); line(c, x + w * 0.75, y + 2, x + w * 0.75, y + h, '#e3a33a'); line(c, x + w * 0.5, y + 4, x + w - 2, y + 4, '#e3a33a'); const hook = y + 6 + Math.sin(t) * 3; line(c, x + w * 0.62, y + 4, x + w * 0.62, hook, '#2a2d33'); rect(c, x + w * 0.62 - 1, hook, 3, 2, '#e3a33a'); }
    if (locId === 'office') { for (let i = 0; i < 5; i++) { rect(c, x + i * (w / 5), y + h * 0.3 + (i % 2) * 8, w / 6, h, '#8aa2bf'); for (let j = 0; j < 8; j++) rect(c, x + i * (w / 5) + 2, y + h * 0.33 + (i % 2) * 8 + j * 5, w / 6 - 4, 2, '#cfe0f2'); } }
    // птицы
    const bx = x + ((t * 14) % (w + 30)) - 15, by = y + 10 + Math.sin(t * 2) * 2; const wing = Math.floor(t * 6) % 2;
    px(c, bx, by + wing, '#2a2d33'); px(c, bx + 1, by + 1 - wing, '#2a2d33'); px(c, bx + 2, by + wing, '#2a2d33');
  }
  c.restore();
  // рама
  const frame = locId === 'elite' ? '#1b1d22' : '#f1f1ec';
  block(c, x - 2, y - 2, w + 4, 3, frame); block(c, x - 2, y + h - 1, w + 4, 3, frame);
  block(c, x - 2, y, 3, h, frame); block(c, x + w - 1, y, 3, h, frame); rect(c, x + Math.floor(w / 2), y, 1, h, frame);
  if (locId !== 'elite') block(c, x - 4, y + h + 1, w + 8, 3, '#e6e2d6');
  // шторы с колыханием
  if (curtains) {
    const cc = locId === 'khr' ? '#c98a5a' : locId === 'dorm' ? '#8fa7b8' : '#e8e6dd';
    const sway = Math.round(Math.sin(t * 1.3) * 1);
    for (const side of [0, 1]) { const cx = side ? x + w - 2 + sway : x - 8 + sway; block(c, cx, y - 6, 10, h + 10, cc, { light: 0.15 }); for (let i = 2; i < 9; i += 3) rect(c, cx + i, y - 5, 1, h + 8, shade(cc, -0.15)); }
    rect(c, x - 10, y - 7, w + 20, 2, '#8a8d92');
  }
}

/** Солнечный луч из окна (в режиме 'lighter'). */
export function sunbeam(c: Ctx, x: number, y: number, w: number, h: number, col: string, a = 0.12) {
  const prev = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(x, y, x + w * 1.6, FLOOR);
  const [R, G, B] = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  g.addColorStop(0, `rgba(${R},${G},${B},${a})`); g.addColorStop(1, `rgba(${R},${G},${B},0)`);
  c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w + 60, FLOOR); c.lineTo(x + 40, FLOOR); c.closePath(); c.fill();
  c.globalCompositeOperation = prev;
}

/* ---------------- мебель и детали ---------------- */

export interface Prop { x: number; draw: (c: Ctx, x: number, t: number) => void; glow?: (c: Ctx, x: number, t: number) => void }

const clock = (c: Ctx, x: number, y: number, t: number, col: string) => {
  circle(c, x, y, 6, shade(col, -0.4)); circle(c, x, y, 5, col); circle(c, x, y, 4, '#fbfaf4');
  for (let i = 0; i < 12; i += 3) { const a = (i / 12) * Math.PI * 2; px(c, x + Math.round(Math.sin(a) * 3), y - Math.round(Math.cos(a) * 3), '#2a2d33'); }
  const am = t * 0.3, ah = t * 0.025;
  line(c, x, y, x + Math.round(Math.sin(am) * 3), y - Math.round(Math.cos(am) * 3), '#2a2d33');
  line(c, x, y, x + Math.round(Math.sin(ah) * 2), y - Math.round(Math.cos(ah) * 2), '#a3294a');
};
const poster = (c: Ctx, x: number, y: number, w: number, h: number, bg: string, fg: string, label = '') => { block(c, x, y, w, h, bg, { light: 0.1 }); circle(c, x + w / 2, y + h * 0.4, Math.min(w, h) * 0.25, fg); if (label) text(c, label, x + 2, y + h - 7, '#fbfaf4'); px(c, x + w / 2, y - 1, '#a3294a'); };
const shelfBooks = (c: Ctx, x: number, y: number, n: number) => { const cols = ['#a3294a', '#1e3c8c', '#2f7d4f', '#d9b52e', '#5b616b', '#8a3b3b']; for (let i = 0; i < n; i++) block(c, x + i * 3, y - 9 - (i % 3), 3, 9 + (i % 3), cols[i % cols.length], { outline: false }); };
const steam = (c: Ctx, x: number, y: number, t: number) => { for (let i = 0; i < 4; i++) { const k = (t * 0.8 + i * 0.25) % 1; c.fillStyle = `rgba(255,255,255,${0.45 * (1 - k)})`; c.fillRect(Math.round(x + Math.sin(k * 6 + i) * 2), Math.round(y - k * 14), 2, 2); } };
const tube = (c: Ctx, x: number, y: number, w: number, t: number, on: boolean) => { block(c, x, y, w, 3, '#f2f2ee'); rect(c, x + 2, y + 2, w - 4, 1, on ? '#ffffff' : '#9aa1aa'); };
export const flicker = (t: number) => !(Math.sin(t * 37) > 0.995 || t % 7 < 0.08 || (t % 11 > 5 && t % 11 < 5.06));

/** Мебель заготовки. rw — ширина комнаты. */
export function presetProps(presetId: string, rw: number, h: number): Prop[] {
  const top = FLOOR - h;
  const P: Prop[] = [];
  const add = (fx: number, draw: Prop['draw'], g?: Prop['glow']) => P.push({ x: Math.round(rw * fx), draw, glow: g });
  switch (presetId) {
    case 'dorm_kitchen':
      add(0.13, (c, x) => { // окно
      });
      add(0.40, (c, x, t) => { // шкафчики, плита, раковина
        block(c, x - 30, FLOOR - 34, 60, 34, '#c8a273'); rect(c, x - 30, FLOOR - 35, 60, 3, '#d8d4c8'); rect(c, x, FLOOR - 33, 1, 30, shade('#c8a273', -0.4));
        for (const dx of [-16, 14]) rect(c, x + dx, FLOOR - 22, 4, 1, '#c9ccd0');
        block(c, x - 28, FLOOR - 40, 22, 5, '#e9e6dc'); circle(c, x - 22, FLOOR - 40, 2, '#2c2f35'); circle(c, x - 13, FLOOR - 40, 2, '#2c2f35'); px(c, x - 22, FLOOR - 40, '#ff4a1c');
        block(c, x - 25, FLOOR - 48, 9, 8, '#4f6f8f'); steam(c, x - 21, FLOOR - 49, t);
        block(c, x + 8, FLOOR - 37, 16, 3, '#c9ccd0'); rect(c, x + 15, FLOOR - 45, 1, 8, '#c9ccd0'); rect(c, x + 15, FLOOR - 45, 4, 1, '#c9ccd0');
        if (Math.floor(t * 0.5) % 9 === 0) px(c, x + 18, FLOOR - 43 + Math.floor((t * 8) % 6), '#7fb6d6');
        block(c, x - 2, top + 14, 32, 22, '#c8a273'); rect(c, x + 14, top + 16, 1, 18, shade('#c8a273', -0.4));
        dither(c, x - 2, FLOOR - 64, 32, 26, '#dfe7e3', '#c9d4ce', 0.25);
      });
      add(0.62, (c, x) => { // график дежурств
        block(c, x - 9, top + 22, 18, 24, '#f6f4ec', { light: 0.05 }); text(c, 'ГРАФИК', x - 8, top + 24, '#2a2d33');
        for (let i = 0; i < 5; i++) { rect(c, x - 7, top + 31 + i * 3, 14, 1, '#9aa1aa'); px(c, x - 6, top + 32 + i * 3, i === 1 ? '#a3294a' : '#1e3c8c'); }
        line(c, x - 3, top + 34, x + 5, top + 34, '#a3294a');
      });
      add(0.53, (c, x, t) => clock(c, x, top + 14, t, '#a3294a'));
      add(0.86, (c, x) => { // холодильник с магнитами
        block(c, x - 10, FLOOR - 58, 20, 58, '#eceae2'); rect(c, x - 9, FLOOR - 40, 18, 1, '#b9b6ac'); rect(c, x - 8, FLOOR - 52, 1, 8, '#c9ccd0'); rect(c, x - 8, FLOOR - 34, 1, 10, '#c9ccd0');
        for (const [dx, dy, cl] of [[2, -48, '#a3294a'], [5, -44, '#f1d04b'], [-2, -30, '#1e3c8c']] as const) rect(c, x + dx, FLOOR + dy, 3, 2, cl);
        block(c, x - 1, FLOOR - 28, 8, 9, '#f6f4ec', { light: 0.03 }); rect(c, x, FLOOR - 26, 5, 1, '#1e3c8c'); rect(c, x, FLOOR - 24, 6, 1, '#1e3c8c');
      });
      add(0.28, (c, x) => { // табуретка
        block(c, x - 6, FLOOR - 19, 12, 3, '#b33a2e'); rect(c, x - 5, FLOOR - 16, 1, 16, '#c9ccd0'); rect(c, x + 4, FLOOR - 16, 1, 16, '#c9ccd0');
      });
      add(0.72, (c, x) => { block(c, x - 5, FLOOR - 14, 10, 14, '#4d7c8a'); rect(c, x - 5, FLOOR - 15, 10, 2, '#202226'); });
      break;
    case 'dorm_room':
      add(0.78, (c, x) => { // двухъярусная кровать
        const bw = 70, bx = x - 35;
        for (const dx of [0, bw - 3]) block(c, bx + dx, FLOOR - 80, 3, 80, '#5d7a8f');
        for (const y of [FLOOR - 20, FLOOR - 58]) { block(c, bx, y, bw, 7, '#d9d5c6'); block(c, bx + 18, y - 2, bw - 22, 5, y > FLOOR - 30 ? '#8a3b3b' : '#3b5a8a'); block(c, bx + 3, y - 4, 12, 5, '#f2f0e8'); }
        for (let i = 0; i < 5; i++) rect(c, bx + bw - 3, FLOOR - 75 + i * 8, 6, 1, '#5d7a8f');
        // носки на перекладине
        rect(c, bx + 30, FLOOR - 52, 3, 5, '#e6eaec'); rect(c, bx + 34, FLOOR - 52, 3, 4, '#f1d04b');
      });
      add(0.40, (c, x) => { // письменный стол с монитором и книгами
        block(c, x - 22, FLOOR - 30, 44, 3, '#a7825a'); rect(c, x - 20, FLOOR - 27, 2, 27, '#6e5238'); rect(c, x + 18, FLOOR - 27, 2, 27, '#6e5238');
        block(c, x - 8, FLOOR - 46, 18, 13, '#1b1d22'); rect(c, x - 7, FLOOR - 45, 16, 10, '#2a3a6a'); rect(c, x + 1, FLOOR - 33, 2, 3, '#2a2d33');
        shelfBooks(c, x - 20, FLOOR - 30, 4);
      });
      add(0.40, (c, x) => poster(c, x - 9, top + 14, 18, 24, '#2f4f8f', '#f1d04b', 'СЕС'));
      add(0.6, (c, x, t) => clock(c, x, top + 14, t, '#2f7d4f'));
      add(0.22, (c, x, t) => { // сушилка с бельём
        line(c, x - 12, FLOOR, x - 6, FLOOR - 30, '#d7d9d8'); line(c, x + 12, FLOOR, x + 6, FLOOR - 30, '#d7d9d8'); rect(c, x - 10, FLOOR - 30, 20, 1, '#d7d9d8');
        const s = Math.round(Math.sin(t * 1.5));
        block(c, x - 8 + s, FLOOR - 29, 6, 10, '#d64d3b'); block(c, x + 1, FLOOR - 29, 7, 12, '#f2f0e8');
      });
      break;
    case 'khr_kitchen':
      add(0.40, (c, x, t) => { // гарнитур, газовая плита, сервант
        block(c, x - 34, FLOOR - 34, 44, 34, '#e8e2d2'); rect(c, x - 34, FLOOR - 35, 44, 3, '#a7825a');
        block(c, x + 10, FLOOR - 34, 22, 34, '#f2f0e8'); block(c, x + 12, FLOOR - 30, 18, 14, '#2a2d33'); for (const dx of [14, 22]) circle(c, x + dx, FLOOR - 36, 2, '#2c2f35');
        // синее пламя
        if (Math.floor(t * 10) % 2) { px(c, x + 14, FLOOR - 38, '#5ab0ff'); px(c, x + 22, FLOOR - 38, '#5ab0ff'); }
        block(c, x + 13, FLOOR - 46, 9, 8, '#c94a3a'); steam(c, x + 17, FLOOR - 47, t);
        block(c, x + 2, top + 16, 30, 24, '#e8e2d2'); rect(c, x + 17, top + 18, 1, 20, '#b9b6ac');
      });
      add(0.62, (c, x) => { // календарь с котиками
        block(c, x - 7, top + 20, 14, 20, '#fbfaf4'); rect(c, x - 6, top + 21, 12, 9, '#c94a3a'); circle(c, x, top + 25, 2, '#f1d04b'); for (let i = 0; i < 3; i++) rect(c, x - 5, top + 32 + i * 2, 10, 1, '#9aa1aa');
      });
      add(0.53, (c, x, t) => clock(c, x, top + 12, t, '#6a4127'));
      add(0.87, (c, x, t) => { // кухонный уголок + кот
        block(c, x - 14, FLOOR - 18, 28, 18, '#8a5a3c'); block(c, x + 10, FLOOR - 34, 4, 18, '#8a5a3c');
        // кот
        block(c, x - 8, FLOOR - 24, 12, 6, '#d9883a'); block(c, x - 11, FLOOR - 27, 6, 6, '#d9883a'); px(c, x - 11, FLOOR - 28, '#d9883a'); px(c, x - 7, FLOOR - 28, '#d9883a');
        const tail = Math.round(Math.sin(t * 2) * 2); line(c, x + 4, FLOOR - 20, x + 8, FLOOR - 22 + tail, '#d9883a');
        rect(c, x - 10, FLOOR - 25, 1, 1, '#2a2d33'); rect(c, x - 7, FLOOR - 25, 1, 1, '#2a2d33');
        if (Math.floor(t * 0.3) % 2) text(c, 'Z', x - 14, FLOOR - 36 - ((t * 4) % 6), '#6a5a8a');
      });
      add(0.24, (c, x) => { // сервант с хрусталём
        block(c, x - 14, FLOOR - 66, 28, 66, '#6a4127'); block(c, x - 12, FLOOR - 62, 24, 26, '#cfe0e8', { light: 0.4 });
        for (let i = 0; i < 4; i++) { rect(c, x - 10 + i * 6, FLOOR - 50, 3, 6, '#ffffff'); px(c, x - 9 + i * 6, FLOOR - 52, '#ffffff'); }
        rect(c, x - 12, FLOOR - 32, 24, 1, '#4a2f1e');
      });
      break;
    case 'khr_room':
      add(0.42, (c, x) => { // ковёр на стене + диван
        const cw = 64, ch = 40, cx = x - 32, cy = top + 14;
        block(c, cx, cy, cw, ch, '#7a1f2b'); rect(c, cx + 3, cy + 3, cw - 6, ch - 6, '#d9b44a'); rect(c, cx + 5, cy + 5, cw - 10, ch - 10, '#7a1f2b');
        for (let i = 0; i < 3; i++) { const dx = cx + 14 + i * 18; for (let k = 0; k < 6; k++) { rect(c, dx - k, cy + 14 + k, 2 * k + 1, 1, ['#d9b44a', '#1f3c6e', '#f2e6cf'][i]); rect(c, dx - k, cy + 26 - k, 2 * k + 1, 1, ['#d9b44a', '#1f3c6e', '#f2e6cf'][i]); } }
        for (let i = cx + 2; i < cx + cw - 2; i += 3) { px(c, i, cy + ch, '#d9b44a'); }
        block(c, x - 34, FLOOR - 22, 68, 22, '#6b5a43'); block(c, x - 34, FLOOR - 32, 68, 12, shade('#6b5a43', 0.08)); block(c, x - 38, FLOOR - 26, 6, 26, '#5b4a33'); block(c, x + 32, FLOOR - 26, 6, 26, '#5b4a33');
        block(c, x - 20, FLOOR - 28, 12, 7, '#c98a5a');
      });
      add(0.86, (c, x, t) => { // стенка с телевизором
        block(c, x - 18, FLOOR - 92, 36, 92, '#5a3a22');
        block(c, x - 12, FLOOR - 62, 24, 18, '#2a2d33');
        const n = Math.floor(t * 12); for (let i = 0; i < 12; i++) rect(c, x - 10 + (i * 7 + n * 3) % 20, FLOOR - 60 + (i * 5 + n) % 14, 2, 1, i % 2 ? '#5a6a7a' : '#8a9aaa');
        shelfBooks(c, x - 16, FLOOR - 70, 8);
        for (let i = 0; i < 3; i++) block(c, x - 16 + i * 12, FLOOR - 38, 10, 36, '#6a4127');
      });
      add(0.6, (c, x, t) => clock(c, x, top + 12, t, '#c9a24a'));
      add(0.18, (c, x, t) => { // торшер
        rect(c, x, FLOOR - 62, 1, 62, '#c9a24a'); block(c, x - 3, FLOOR - 3, 7, 3, '#c9a24a');
        block(c, x - 7, FLOOR - 72, 15, 10, '#f2d9a8', { light: 0.3 });
      }, (c, x) => glow(c, x, FLOOR - 66, 34, '#ffb067', 0.32));
      break;
    case 'new_kitchen':
      add(0.40, (c, x) => { // кухня в плёнке, стремянка, коробки
        block(c, x - 36, FLOOR - 34, 72, 34, '#f4f5f3'); rect(c, x - 36, FLOOR - 35, 72, 3, '#d7c3a2');
        c.fillStyle = 'rgba(220,235,245,.35)'; c.fillRect(x - 37, FLOOR - 36, 74, 36);
        for (let i = 0; i < 3; i++) rect(c, x - 30 + i * 24, FLOOR - 20, 6, 1, '#c9ccd0');
      });
      add(0.64, (c, x) => { // план квартиры на стене
        block(c, x - 12, top + 22, 24, 22, '#fbfaf4', { light: 0.03 }); rect(c, x - 9, top + 26, 18, 14, '#1e3c8c'); rect(c, x - 8, top + 27, 16, 12, '#fbfaf4'); rect(c, x, top + 27, 1, 8, '#1e3c8c'); rect(c, x, top + 34, 8, 1, '#1e3c8c');
      });
      add(0.23, (c, x) => { // стремянка
        line(c, x - 8, FLOOR, x - 2, FLOOR - 50, '#c9ccd0'); line(c, x + 6, FLOOR, x, FLOOR - 50, '#c9ccd0'); for (let i = 1; i < 5; i++) rect(c, x - 7 + i, FLOOR - i * 10, 12 - i * 2, 2, '#e9c437');
      });
      add(0.88, (c, x) => { for (let i = 0; i < 3; i++) { block(c, x - 12 + (i % 2) * 3, FLOOR - 14 - i * 13, 22 - i * 3, 14, '#c9a77a'); rect(c, x - 8, FLOOR - 9 - i * 13, 8, 4, '#f6f4ec'); } });
      add(0.5, (c, x, t) => { rect(c, x, top + 3, 1, 22, '#2a2d33'); circle(c, x, top + 27, 3, '#fffbe8'); }, (c, x) => glow(c, x, top + 27, 60, '#fff1d6', 0.28));
      break;
    case 'new_work':
      add(0.40, (c, x) => { // стол с двумя мониторами и кресло
        block(c, x - 34, FLOOR - 30, 68, 3, '#f4f5f3'); rect(c, x - 32, FLOOR - 27, 2, 27, '#2a2d33'); rect(c, x + 30, FLOOR - 27, 2, 27, '#2a2d33');
        for (const dx of [-24, 4]) { block(c, x + dx, FLOOR - 48, 22, 15, '#1b1d22'); rect(c, x + dx + 1, FLOOR - 47, 20, 12, '#20304a'); rect(c, x + dx + 3, FLOOR - 45, 10, 1, '#5ab0ff'); rect(c, x + dx + 10, FLOOR - 33, 2, 3, '#2a2d33'); }
        block(c, x - 10, FLOOR - 40, 14, 26, '#2a2d33'); rect(c, x - 3, FLOOR - 14, 1, 10, '#c9ccd0'); rect(c, x - 9, FLOOR - 4, 13, 1, '#2a2d33');
      });
      add(0.86, (c, x) => { for (let i = 0; i < 2; i++) block(c, x - 12, FLOOR - 14 - i * 14, 22, 14, '#c9a77a'); });
      add(0.18, (c, x, t) => { block(c, x - 6, FLOOR - 14, 12, 14, '#e6e2d6'); for (let i = 0; i < 6; i++) { const a = i - 2.5; line(c, x, FLOOR - 14, x + a * 3 + Math.sin(t + i) * 1, FLOOR - 32 - (i % 3) * 3, '#3f6b3a'); } });
      add(0.62, (c, x) => { block(c, x - 20, top + 30, 40, 3, '#d7c3a2'); block(c, x - 16, top + 22, 8, 8, '#2f7dd6'); block(c, x - 4, top + 24, 6, 6, '#f1d04b'); block(c, x + 6, top + 22, 9, 8, '#e6eaec'); });
      break;
    case 'elite_living':
      add(0.42, (c, x, t) => { // мраморный остров, подвесные лампы
        block(c, x - 46, FLOOR - 36, 92, 36, '#ecebe6', { light: 0.1 }); for (let i = 0; i < 6; i++) line(c, x - 40 + i * 14, FLOOR - 34, x - 34 + i * 14, FLOOR - 4, '#c9c9c9');
        for (let i = 0; i < 3; i++) { const lx = x - 30 + i * 30; rect(c, lx, FLOOR - 140, 1, 60, '#2a2d33'); block(c, lx - 5, FLOOR - 82, 11, 6, '#c9a24a'); }
        for (let i = 0; i < 3; i++) { const sx = x - 30 + i * 30; rect(c, sx, FLOOR - 24, 1, 24, '#c9a24a'); block(c, sx - 5, FLOOR - 26, 11, 3, '#2a2522'); }
      }, (c, x) => { for (let i = 0; i < 3; i++) glow(c, x - 30 + i * 30, FLOOR - 76, 30, '#ffb067', 0.3); });
      add(0.67, (c, x) => { // картина и стеллаж
        block(c, x - 20, FLOOR - 120, 40, 28, '#c9a24a'); rect(c, x - 18, FLOOR - 118, 36, 24, '#e8e2d6'); circle(c, x - 6, FLOOR - 106, 7, '#c94a3a'); rect(c, x + 3, FLOOR - 116, 12, 18, '#1f2a3a');
      });
      add(0.88, (c, x) => { // диван и растение
        block(c, x - 30, FLOOR - 20, 60, 20, '#1f2a3a'); block(c, x - 30, FLOOR - 32, 60, 14, shade('#1f2a3a', 0.08)); block(c, x - 20, FLOOR - 26, 12, 7, '#c9a24a');
      });
      add(0.17, (c, x, t) => { block(c, x - 8, FLOOR - 20, 16, 20, '#e6e2d6'); for (let i = 0; i < 8; i++) line(c, x, FLOOR - 20, x + (i - 3.5) * 4 + Math.sin(t * 0.8 + i) * 1.5, FLOOR - 50 - (i % 3) * 8, '#3f6b3a'); });
      break;
    case 'elite_sport':
      add(0.40, (c, x, t) => { // беговая дорожка с бегущей лентой
        block(c, x - 40, FLOOR - 10, 80, 10, '#1b1d22'); const off = Math.floor(t * 20) % 6; for (let i = 0; i < 13; i++) rect(c, x - 38 + ((i * 6 + off) % 76), FLOOR - 9, 2, 1, '#3a3d44');
        line(c, x + 34, FLOOR - 10, x + 30, FLOOR - 48, '#1b1d22'); block(c, x + 22, FLOOR - 56, 16, 8, '#1b1d22'); rect(c, x + 24, FLOOR - 54, 8, 3, '#4cff9a');
      });
      add(0.67, (c, x) => { // зеркало и полка кубков
        block(c, x - 22, FLOOR - 110, 44, 70, '#c9d6e0', { light: 0.5 }); line(c, x - 14, FLOOR - 106, x - 4, FLOOR - 96, '#ffffff');
        block(c, x - 22, FLOOR - 124, 44, 3, '#c9a24a'); for (let i = 0; i < 3; i++) { block(c, x - 16 + i * 14, FLOOR - 132, 6, 6, '#d9b44a'); rect(c, x - 14 + i * 14, FLOOR - 126, 2, 2, '#b8932a'); }
      });
      add(0.88, (c, x) => { for (let i = 0; i < 3; i++) { const rx = x - 12 + i * 10; circle(c, rx, FLOOR - 34, 5, ['#2f7dd6', '#d64d3b', '#1b1d22'][i]); circle(c, rx, FLOOR - 34, 3, '#c9d6e0'); rect(c, rx, FLOOR - 28, 1, 14, '#2a2d33'); } for (let i = 0; i < 6; i++) circle(c, x - 18 + i * 5, FLOOR - 2, 2, '#d7f05a'); });
      add(0.17, (c, x) => { for (let i = 0; i < 4; i++) { rect(c, x - 10 + i * 6, FLOOR - 4, 4, 2, '#c9ccd0'); block(c, x - 11 + i * 6, FLOOR - 7, 2, 7, '#2a2d33'); block(c, x - 6 + i * 6, FLOOR - 7, 2, 7, '#2a2d33'); } });
      break;
    case 'office_reception':
      add(0.40, (c, x, t) => { // стойка ресепшн с логотипом
        block(c, x - 50, FLOOR - 40, 100, 40, '#e8eaec'); rect(c, x - 50, FLOOR - 26, 100, 10, '#ef7d2c');
        block(c, x - 36, FLOOR - 112, 72, 24, '#dfe5ea', { outline: false }); circle(c, x - 26, FLOOR - 100, 7, '#ef7d2c'); text(c, 'МЕРИДИАН', x - 16, FLOOR - 103, '#2a3038');
        block(c, x + 20, FLOOR - 52, 16, 12, '#1b1d22'); rect(c, x + 21, FLOOR - 51, 14, 9, '#3a5a8a');
      });
      add(0.65, (c, x, t) => { // кулер с пузырями
        block(c, x - 7, FLOOR - 40, 14, 40, '#f4f5f3'); block(c, x - 8, FLOOR - 62, 16, 22, '#9fd0ef', { light: 0.5 });
        const k = (t * 1.2) % 1; px(c, x - 2, FLOOR - 44 - k * 16, '#ffffff'); px(c, x + 3, FLOOR - 44 - ((k + 0.5) % 1) * 16, '#ffffff');
      });
      add(0.88, (c, x) => { block(c, x - 28, FLOOR - 20, 56, 20, '#3e4a5a'); block(c, x - 28, FLOOR - 32, 56, 14, shade('#3e4a5a', 0.08)); });
      add(0.17, (c, x, t) => { block(c, x - 8, FLOOR - 20, 16, 20, '#e6e2d6'); for (let i = 0; i < 8; i++) line(c, x, FLOOR - 20, x + (i - 3.5) * 4 + Math.sin(t * 0.8 + i) * 1.5, FLOOR - 50 - (i % 3) * 8, '#3f6b3a'); });
      break;
    case 'office_open':
      add(0.40, (c, x, t) => { // столы с перегородками и коллеги-силуэты
        for (let i = 0; i < 2; i++) { const dx = x - 50 + i * 54; block(c, dx, FLOOR - 30, 46, 3, '#e8eaec'); block(c, dx, FLOOR - 50, 46, 20, '#5b6672'); block(c, dx + 14, FLOOR - 46, 18, 13, '#1b1d22'); rect(c, dx + 15, FLOOR - 45, 16, 10, '#3a5a8a');
          const type = Math.floor(t * 6 + i) % 2; rect(c, dx + 18, FLOOR - 42 + type, 6, 1, '#cfe0ff');
          for (const [k, cl] of [[0, '#f1d04b'], [4, '#f3b0bd']] as const) rect(c, dx + 4 + k, FLOOR - 48, 3, 3, cl);
          block(c, dx + 18, FLOOR - 22, 10, 22, '#ef7d2c'); }
      });
      add(0.65, (c, x) => { // доска с графиком
        block(c, x - 24, FLOOR - 104, 48, 30, '#fbfbfb', { light: 0.02 }); line(c, x - 20, FLOOR - 78, x - 8, FLOOR - 86, '#1e3c8c'); line(c, x - 8, FLOOR - 86, x + 2, FLOOR - 82, '#1e3c8c'); line(c, x + 2, FLOOR - 82, x + 18, FLOOR - 98, '#1e3c8c'); text(c, '+15%', x - 20, FLOOR - 100, '#a3294a');
      });
      add(0.88, (c, x, t) => { // напольный вентилятор
        rect(c, x, FLOOR - 40, 1, 40, '#5b6672'); block(c, x - 6, FLOOR - 2, 13, 2, '#5b6672'); circle(c, x, FLOOR - 44, 8, '#dfe5ea'); const a = t * 12; for (let k = 0; k < 3; k++) { const b = a + k * 2.1; line(c, x, FLOOR - 44, x + Math.round(Math.cos(b) * 6), FLOOR - 44 + Math.round(Math.sin(b) * 6), '#8a939d'); }
      });
      add(0.17, (c, x, t) => { block(c, x - 12, FLOOR - 40, 24, 40, '#e8eaec'); rect(c, x - 8, FLOOR - 34, 16, 3, '#2a2d33'); px(c, x + 7, FLOOR - 37, Math.floor(t * 2) % 2 ? '#4cff9a' : '#2f7d4f'); });
      break;
  }
  return P;
}

/** Потолочный свет, окно и общий свет для локации. */
export function ceilingLights(locId: string, rw: number, h: number): Prop[] {
  const top = FLOOR - h;
  if (locId === 'dorm') return [{ x: Math.round(rw * 0.5), draw: (c, x, t) => tube(c, x - 16, top + 4, 32, t, flicker(t)), glow: (c, x, t) => { if (flicker(t)) glow(c, x, top + 12, 70, '#dff1ff', 0.18); } }];
  if (locId === 'khr') return [{ x: Math.round(rw * 0.5), draw: (c, x) => { rect(c, x, top + 3, 1, 10, '#c9a24a'); for (let i = -2; i <= 2; i++) block(c, x + i * 6 - 2, top + 13 + Math.abs(i), 5, 4, '#f7e7c4'); }, glow: (c, x) => glow(c, x, top + 18, 64, '#ffcf8a', 0.22) }];
  if (locId === 'office') return [0.2, 0.45, 0.7, 0.92].map((f) => ({ x: Math.round(rw * f), draw: (c: Ctx, x: number) => block(c, x - 12, top + 3, 24, 3, '#ffffff', { light: 0 }), glow: (c: Ctx, x: number) => glow(c, x, top + 10, 50, '#eaf3ff', 0.16) }));
  if (locId === 'elite') return [{ x: Math.round(rw * 0.5), draw: (c, x) => { rect(c, x - rw / 2 + 4, top + 6, rw - 8, 1, '#ffb066'); }, glow: (c, x) => glow(c, x, top + 8, rw * 0.6, '#ffb066', 0.1) }];
  return [];
}

/** Поверхность для предмета (тумба, стол, полка), ширина 26 px, высота 1,1 м = 44 px. */
export function drawSurface(c: Ctx, look: RoomLook, x: number, kind: number) {
  const top = FLOOR - 44, W = 26, x0 = Math.round(x - W / 2);
  if (kind === 0) { block(c, x0 + 1, top + 3, W - 2, 41, look.surface); rect(c, x0 + 4, top + 10, W - 8, 1, shade(look.surface, -0.35)); px(c, x0 + W / 2, top + 14, '#c9ccd0'); block(c, x0, top, W, 4, shade(look.surface, -0.1)); }
  else if (kind === 1) { block(c, x0, top, W, 4, look.surface); rect(c, x0 + 2, top + 4, 2, 40, look.surfaceLeg); rect(c, x0 + W - 4, top + 4, 2, 40, look.surfaceLeg); rect(c, x0 + 3, top + 26, W - 6, 2, shade(look.surface, -0.1)); }
  else { block(c, x0, top, W, 3, look.surface); block(c, x0, top + 18, W, 3, look.surface); rect(c, x0, top, 2, 44, look.surfaceLeg); rect(c, x0 + W - 2, top, 2, 44, look.surfaceLeg); const cols = ['#a3294a', '#1e3c8c', '#2f7d4f', '#d9b52e']; for (let i = 0; i < 6; i++) block(c, x0 + 3 + i * 3, top + 21 + 9 - 9, 3, 9, cols[i % 4], { outline: false }); }
}

/** Стол под устройство (высота 0,76 м = 30 px). */
export function drawDeviceTable(c: Ctx, x: number, w: number) {
  const x0 = Math.round(x - w / 2);
  block(c, x0, FLOOR - 30, w, 3, '#e8e2d2'); rect(c, x0 + 2, FLOOR - 27, 1, 27, '#c9ccd0'); rect(c, x0 + w - 3, FLOOR - 27, 1, 27, '#c9ccd0');
  for (let i = 0; i < w; i += 4) px(c, x0 + i, FLOOR - 28, '#a3294a');
}

/** Дверь в левой стене комнаты. */
export function drawDoor(c: Ctx, x: number, open: number) {
  block(c, x - 2, FLOOR - 82, 26, 82, '#6b4b32');
  rect(c, x, FLOOR - 80, 22, 80, '#1a1410');
  const w = Math.round(22 * (1 - open * 0.8));
  block(c, x, FLOOR - 80, w, 80, '#8a6a4a'); if (w > 6) { rect(c, x + w - 4, FLOOR - 40, 2, 2, '#d9b44a'); rect(c, x + 3, FLOOR - 74, w - 6, 26, shade('#8a6a4a', -0.1)); rect(c, x + 3, FLOOR - 42, w - 6, 34, shade('#8a6a4a', -0.1)); }
}
