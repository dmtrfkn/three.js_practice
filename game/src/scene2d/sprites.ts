// Пиксельные спрайты предметов осмотра и устройств. Масштаб: 1 пиксель ≈ 2,5 см.
import { block, rect, px, shade, line, circle, sprite, text, dither, type Ctx } from './pix';

const INK = '#1e3c8c', STAMP = '#a3294a', STICK = '#f1d04b', PAPER = '#f2efe4', GRAPH = '#2a2d33', METAL = '#b9bcc2';

type Draw = (c: Ctx) => void;
interface Def { w: number; h: number; d: Draw }

const paperSheet = (c: Ctx, x: number, y: number, w: number, h: number, lines = 3, col = PAPER) => {
  block(c, x, y, w, h, col, { light: 0.1 });
  for (let i = 0; i < lines; i++) rect(c, x + 2, y + 2 + i * 2, w - 4 - (i % 2) * 2, 1, '#9aa1aa');
};

const ITEMS: Record<string, Def> = {
  /* достоверные */
  B_LOW: { w: 16, h: 9, d: (c) => { block(c, 1, 3, 14, 6, '#e3d3ae'); line(c, 2, 4, 8, 7, '#b9a87e'); line(c, 14, 4, 8, 7, '#b9a87e'); rect(c, 3, 1, 5, 3, '#d64d3b'); rect(c, 8, 0, 5, 3, '#2f7d4f'); px(c, 4, 2, '#fff'); px(c, 10, 1, '#fff'); } },
  B_MID: { w: 16, h: 6, d: (c) => { block(c, 0, 1, 16, 5, '#4a7c9a'); paperSheet(c, 3, 0, 10, 5, 2); px(c, 4, 2, INK); px(c, 4, 4, INK); } },
  B_HIGH: { w: 16, h: 12, d: (c) => { block(c, 1, 4, 14, 8, GRAPH); text(c, 'PRO', 3, 6, '#8fa8d8'); block(c, 9, 0, 5, 8, '#f7f7f2', { light: 0.05 }); for (let i = 0; i < 3; i++) rect(c, 10, 2 + i * 2, 3, 1, '#9aa1aa'); } },
  K_LOW: { w: 14, h: 8, d: (c) => { paperSheet(c, 0, 2, 11, 6, 2); paperSheet(c, 3, 0, 11, 7, 2); circle(c, 10, 4, 2, STAMP); circle(c, 10, 4, 1, PAPER); } },
  K_MID: { w: 14, h: 7, d: (c) => { block(c, 0, 2, 13, 5, INK); rect(c, 2, 3, 6, 1, '#fff'); rect(c, 13, 2, 1, 2, STICK); rect(c, 13, 4, 1, 1, STAMP); rect(c, 4, 0, 1, 3, '#2f7d4f'); } },
  K_HIGH: { w: 14, h: 10, d: (c) => { block(c, 2, 0, 7, 10, '#f1c232'); rect(c, 3, 1, 5, 3, '#9fb59a'); px(c, 4, 2, GRAPH); px(c, 6, 2, GRAPH); circle(c, 5, 6, 1, GRAPH); line(c, 8, 8, 13, 5, '#d64d3b'); line(c, 8, 9, 13, 9, GRAPH); } },
  U_LOW: { w: 12, h: 8, d: (c) => { block(c, 0, 4, 12, 4, INK); block(c, 2, 0, 8, 6, STICK, { light: 0.15 }); rect(c, 3, 2, 5, 1, INK); rect(c, 3, 4, 4, 1, INK); } },
  U_MID: { w: 12, h: 10, d: (c) => { block(c, 1, 0, 10, 10, '#fbfaf4', { light: 0.05 }); rect(c, 2, 1, 8, 2, STAMP); for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) px(c, 2 + j * 2, 4 + i * 2, GRAPH); rect(c, 2, 6, 7, 1, INK); } },
  U_HIGH: { w: 12, h: 8, d: (c) => { block(c, 0, 4, 12, 4, '#2f7d4f'); block(c, 2, 0, 8, 6, STICK, { light: 0.15 }); rect(c, 3, 2, 5, 1, INK); rect(c, 3, 4, 5, 1, STAMP); } },
  /* неоднозначные */
  AMB_LAPTOP: { w: 18, h: 12, d: (c) => { block(c, 3, 0, 12, 9, '#c9ccd0'); rect(c, 4, 1, 10, 6, '#3a5a9a'); rect(c, 5, 2, 6, 1, '#cfe0ff'); rect(c, 5, 4, 8, 1, '#8fa8d8'); block(c, 0, 9, 18, 3, METAL); } },
  AMB_TVBOX: { w: 22, h: 15, d: (c) => { block(c, 0, 0, 22, 15, '#d8c7a3'); rect(c, 3, 3, 16, 8, '#1b1d22'); rect(c, 4, 4, 14, 6, '#2f7dd6'); rect(c, 4, 7, 14, 3, '#e1834a'); text(c, '65', 9, 11, GRAPH); } },
  AMB_LAMP: { w: 14, h: 18, d: (c) => { circle(c, 4, 4, 3, '#fff1c9'); px(c, 3, 3, '#fff'); line(c, 6, 5, 9, 4, '#c9a24a'); line(c, 9, 4, 9, 16, '#c9a24a'); block(c, 5, 16, 9, 2, '#e6e2d6'); } },
  AMB_CUP: { w: 12, h: 14, d: (c) => { block(c, 3, 0, 6, 6, '#d9b44a'); px(c, 1, 2, '#d9b44a'); px(c, 10, 2, '#d9b44a'); px(c, 2, 1, '#d9b44a'); px(c, 9, 1, '#d9b44a'); rect(c, 5, 6, 2, 3, '#b8932a'); block(c, 2, 9, 8, 5, '#3a2c22'); rect(c, 4, 11, 4, 1, '#d9b44a'); } },
  AMB_AWARD: { w: 10, h: 14, d: (c) => { block(c, 1, 0, 8, 11, '#bfe1f2', { light: 0.4 }); rect(c, 3, 3, 4, 1, INK); circle(c, 5, 7, 1, '#c9a24a'); block(c, 0, 11, 10, 3, GRAPH); } },
  /* подозрительные */
  SUS_RECORDER: { w: 12, h: 6, d: (c) => { block(c, 0, 4, 12, 2, PAPER); block(c, 3, 0, 5, 5, '#3a3d44'); rect(c, 4, 1, 3, 1, '#9fd3b5'); px(c, 7, 3, '#ff2a2a'); } },
  SUS_PHONE: { w: 10, h: 16, d: (c) => { block(c, 2, 0, 6, 11, '#15171b'); rect(c, 3, 1, 4, 8, '#6d7f8f'); px(c, 5, 8, '#ff3b30'); line(c, 5, 11, 2, 15, GRAPH); line(c, 5, 11, 8, 15, GRAPH); line(c, 5, 11, 5, 15, GRAPH); } },
  SUS_FOLDER: { w: 14, h: 7, d: (c) => { block(c, 0, 1, 14, 6, '#5b616b'); paperSheet(c, 2, 0, 9, 6, 2); line(c, 9, 5, 13, 2, GRAPH); } },
  /* нейтральные */
  mug: { w: 8, h: 7, d: (c) => { block(c, 0, 0, 6, 7, '#e6eaec'); rect(c, 1, 3, 4, 2, STAMP); rect(c, 6, 2, 2, 1, '#c3cbd0'); rect(c, 7, 2, 1, 3, '#c3cbd0'); rect(c, 6, 4, 2, 1, '#c3cbd0'); rect(c, 1, 1, 4, 1, '#6b3a1e'); } },
  spoon: { w: 12, h: 3, d: (c) => { block(c, 0, 1, 12, 2, '#f2f0e8'); line(c, 2, 1, 9, 1, METAL); px(c, 10, 0, METAL); px(c, 10, 1, METAL); } },
  notebook: { w: 11, h: 4, d: (c) => { block(c, 0, 0, 11, 4, '#2f7d4f'); rect(c, 3, 1, 5, 1, PAPER); } },
  pillow: { w: 16, h: 7, d: (c) => { block(c, 0, 1, 16, 6, '#9fb8d6'); for (let i = 2; i < 15; i += 3) rect(c, i, 2, 1, 4, shade('#9fb8d6', 0.25)); } },
  plant: { w: 10, h: 14, d: (c) => { block(c, 2, 9, 6, 5, '#b5532f'); for (const [x, y] of [[4, 0], [1, 3], [7, 2], [3, 5], [6, 6], [0, 7], [8, 6]]) block(c, x, y, 3, 4, '#4f7d3b', { outline: false }); } },
  napkins: { w: 10, h: 7, d: (c) => { block(c, 0, 4, 10, 3, '#8e6a45'); block(c, 2, 0, 6, 5, '#fbfaf4', { light: 0.05 }); } },
  newspaper: { w: 14, h: 4, d: (c) => { block(c, 0, 0, 14, 4, '#ece7da', { light: 0.05 }); rect(c, 2, 1, 6, 1, GRAPH); rect(c, 9, 1, 3, 2, '#9aa1aa'); } },
  deskclock: { w: 9, h: 8, d: (c) => { block(c, 0, 0, 9, 8, '#7a4e2f'); circle(c, 4, 4, 2, '#fbfaf4'); px(c, 4, 3, GRAPH); px(c, 5, 4, GRAPH); } },
  movebox: { w: 16, h: 12, d: (c) => { block(c, 0, 0, 16, 12, '#c9a77a'); rect(c, 1, 1, 14, 2, '#b8955f'); rect(c, 4, 6, 8, 3, PAPER); text(c, 'КУ', 5, 6, GRAPH); } },
  towel_k: { w: 12, h: 4, d: (c) => { block(c, 0, 0, 12, 4, '#d64d3b'); for (let i = 1; i < 11; i += 3) rect(c, i, 1, 1, 2, PAPER); } },
  plaid: { w: 15, h: 5, d: (c) => { block(c, 0, 0, 15, 5, '#8a5a3c'); for (let i = 2; i < 14; i += 4) rect(c, i, 1, 1, 3, '#c98a5a'); rect(c, 1, 2, 13, 1, '#6a4127'); } },
  mousepad: { w: 14, h: 4, d: (c) => { block(c, 0, 2, 14, 2, '#2f4f8f'); block(c, 8, 0, 4, 3, GRAPH); } },
  vase: { w: 8, h: 15, d: (c) => { block(c, 1, 6, 6, 9, '#2f5d55'); rect(c, 3, 3, 2, 4, '#5a6b3c'); circle(c, 2, 2, 1, '#e8e2d6'); circle(c, 5, 1, 1, '#e8e2d6'); } },
  cushion: { w: 12, h: 8, d: (c) => { block(c, 0, 0, 12, 8, '#c9a24a'); px(c, 6, 4, shade('#c9a24a', -0.4)); } },
  magazine: { w: 12, h: 4, d: (c) => { block(c, 0, 0, 12, 4, '#2f7dd6'); rect(c, 2, 1, 5, 1, STICK); circle(c, 9, 2, 1, '#d7f05a'); } },
  towel: { w: 13, h: 5, d: (c) => { block(c, 0, 0, 13, 5, '#f2f0e8', { light: 0.1 }); rect(c, 1, 3, 11, 1, '#9fb8d6'); } },
  pens: { w: 8, h: 11, d: (c) => { block(c, 1, 5, 6, 6, '#3e4a5a'); rect(c, 2, 0, 1, 6, INK); rect(c, 4, 1, 1, 5, STAMP); rect(c, 5, 2, 1, 4, STICK); } },
  water: { w: 6, h: 13, d: (c) => { block(c, 0, 3, 6, 10, '#bfe1f2', { light: 0.4 }); rect(c, 2, 0, 2, 3, '#2f7dd6'); rect(c, 1, 7, 4, 2, '#fff'); } },
  deptfolder: { w: 6, h: 14, d: (c) => { block(c, 0, 0, 6, 14, STAMP); rect(c, 2, 3, 2, 8, PAPER); } },
  paperbin: { w: 10, h: 12, d: (c) => { block(c, 0, 3, 10, 9, '#3e4a5a'); for (let i = 1; i < 9; i += 2) rect(c, i, 4, 1, 7, shade('#3e4a5a', -0.3)); circle(c, 3, 2, 2, PAPER); circle(c, 7, 2, 2, '#e6e2d6'); } },
};

export function itemSprite(id: string): HTMLCanvasElement {
  const d = ITEMS[id] ?? ITEMS.mug;
  return sprite('item:' + id, d.w, d.h, d.d);
}

/* ---------------- устройства ---------------- */

const DEVICES: Record<string, Def & { floor?: boolean; wall?: boolean }> = {
  kettle: { w: 14, h: 14, d: (c) => { block(c, 2, 2, 9, 10, '#c9d4dc', { light: 0.4 }); rect(c, 3, 0, 7, 3, shade('#c9d4dc', -0.2)); rect(c, 11, 4, 2, 5, GRAPH); rect(c, 0, 4, 2, 2, '#c9d4dc'); block(c, 1, 12, 12, 2, GRAPH); rect(c, 4, 5, 1, 5, '#7fb6d6'); px(c, 2, 12, '#4cff9a'); } },
  microwave: { w: 26, h: 15, d: (c) => { block(c, 0, 0, 26, 15, '#f0efe9'); block(c, 2, 2, 16, 11, '#222428'); rect(c, 3, 3, 6, 1, '#5a5d66'); block(c, 19, 2, 5, 11, '#d7d6cf'); rect(c, 20, 3, 3, 2, '#0d1a12'); px(c, 21, 3, '#4cff9a'); px(c, 21, 7, GRAPH); px(c, 21, 9, GRAPH); px(c, 21, 11, GRAPH); } },
  laptop: { w: 20, h: 13, d: (c) => { block(c, 3, 0, 14, 10, '#1b1d22'); rect(c, 4, 1, 12, 7, '#0a1a3a'); rect(c, 5, 2, 7, 1, '#ffffff'); rect(c, 5, 4, 9, 1, '#ff3b6b'); block(c, 0, 10, 20, 3, '#2a2d33'); rect(c, 2, 11, 16, 1, '#5ab0ff'); } },
  tv: { w: 34, h: 24, d: (c) => { block(c, 0, 0, 34, 20, '#1b1d22'); rect(c, 2, 2, 30, 16, '#0c0d10'); rect(c, 4, 3, 8, 1, '#2a2f38'); rect(c, 15, 20, 4, 2, GRAPH); block(c, 9, 22, 16, 2, GRAPH); px(c, 31, 18, '#ff3b30'); } },
  washer: { floor: true, w: 24, h: 30, d: (c) => { block(c, 0, 0, 24, 30, '#eef0ef'); rect(c, 1, 1, 22, 5, '#d7d9d8'); block(c, 2, 2, 7, 3, '#eef0ef'); circle(c, 18, 3, 1, METAL); circle(c, 12, 17, 8, '#b9bcc2'); circle(c, 12, 17, 6, '#2a3a48'); rect(c, 9, 14, 3, 1, '#5a7a98'); } },
  fridge: { floor: true, w: 22, h: 54, d: (c) => { block(c, 0, 0, 22, 54, '#eceae2'); rect(c, 1, 18, 20, 1, '#b9b6ac'); rect(c, 2, 6, 1, 8, METAL); rect(c, 2, 24, 1, 10, METAL); rect(c, 12, 3, 7, 2, '#c9ccd0'); text(c, 'ПОЛ', 12, 5, GRAPH); } },
  speaker: { w: 9, h: 13, d: (c) => { block(c, 0, 1, 9, 12, '#3e4148'); dither(c, 1, 3, 7, 9, '#3e4148', '#565a62', 0.5); rect(c, 1, 0, 7, 2, '#5ab0ff'); } },
  dishwasher: { floor: true, w: 24, h: 30, d: (c) => { block(c, 0, 0, 24, 30, '#d7dadc', { light: 0.35 }); rect(c, 1, 1, 22, 5, '#1b1d22'); text(c, '50°', 3, 1, '#5ab0ff'); rect(c, 6, 8, 12, 1, METAL); } },
  aircon: { wall: true, w: 34, h: 12, d: (c) => { block(c, 0, 0, 34, 12, '#f4f5f3', { light: 0.1 }); rect(c, 2, 9, 30, 1, '#c9ccd0'); rect(c, 25, 3, 5, 3, '#e6eaec'); text(c, '18', 26, 3, '#2f7dd6'); } },
  vr: { w: 14, h: 14, d: (c) => { circle(c, 7, 4, 4, '#e6e2d6'); block(c, 2, 4, 10, 5, '#f2f2f2'); rect(c, 3, 6, 8, 2, '#15171b'); rect(c, 6, 9, 2, 3, '#e6e2d6'); block(c, 3, 12, 8, 2, GRAPH); } },
  coffee: { w: 16, h: 20, d: (c) => { block(c, 0, 0, 16, 20, '#1b1d22'); rect(c, 2, 2, 12, 3, '#ffb067'); block(c, 5, 8, 6, 3, '#c9ccd0'); block(c, 6, 13, 4, 4, '#f2f0e8'); rect(c, 2, 17, 12, 2, '#8a8d92'); } },
  tennis: { floor: true, w: 28, h: 30, d: (c) => { block(c, 3, 0, 22, 10, '#1b1d22'); for (let i = 0; i < 4; i++) circle(c, 8 + i * 4, 4, 2, '#d7f05a'); block(c, 2, 10, 24, 14, '#2f6b4a'); circle(c, 14, 17, 3, '#1b1d22'); circle(c, 6, 26, 3, GRAPH); circle(c, 22, 26, 3, GRAPH); } },
  robovac: { floor: true, w: 20, h: 6, d: (c) => { block(c, 0, 1, 20, 5, '#2a2d33'); rect(c, 7, 0, 6, 2, '#c9ccd0'); px(c, 15, 2, '#4cff9a'); } },
  printer: { w: 24, h: 16, d: (c) => { block(c, 0, 4, 24, 12, '#e8eaec'); block(c, 4, 0, 16, 5, '#fff', { light: 0.05 }); rect(c, 15, 6, 6, 3, '#1b2a4a'); px(c, 16, 7, '#ffb067'); rect(c, 4, 13, 16, 2, '#2a2d33'); } },
  projector: { w: 18, h: 9, d: (c) => { block(c, 0, 1, 18, 8, '#f2f2f0'); circle(c, 5, 5, 3, '#1b1d22'); circle(c, 5, 5, 1, '#2a4a6a'); for (let i = 0; i < 3; i++) rect(c, 11, 3 + i * 2, 5, 1, '#9aa1aa'); } },
};

export function deviceSprite(id: string): { cv: HTMLCanvasElement; floor: boolean; wall: boolean } {
  const d = DEVICES[id] ?? DEVICES.microwave;
  return { cv: sprite('dev:' + id, d.w, d.h, d.d), floor: !!d.floor, wall: !!d.wall };
}
export { INK, STAMP, STICK, PAPER, GRAPH, METAL };
