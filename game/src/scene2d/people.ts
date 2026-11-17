// Пиксельные персонажи: клиент (внешность из генератора) и мастер. Рост ~70 px (1 px ≈ 2,5 см).
import { block, rect, px, shade, circle, line, type Ctx } from './pix';
import type { Appearance } from '../scene/client';
import type { Level } from '../core/params';

export type Pose = 'idle' | 'talk' | 'nod' | 'cross' | 'happy' | 'shake' | 'walk' | 'crouch' | 'point';

export interface PersonState {
  pose: Pose;
  t: number;        // время позы, с
  clock: number;    // общее время, с
  mood: Level;
  facing: 1 | -1;   // 1 — смотрит вправо
  blink: boolean;
  talking: boolean;
}

const SKIN_SHADE = (s: string) => shade(s, -0.18);

/** Нарисовать человека: (x, y) — середина ступней. */
export function drawPerson(c: Ctx, x: number, y: number, a: Appearance, s: PersonState, master = false) {
  const scale = a.height / 1.78;
  const H = Math.round(70 * scale);
  const wide = [0, 1, 3][a.build];
  const bodyW = 14 + wide, legH = Math.round(H * 0.44), torsoH = Math.round(H * 0.31), headH = 14;
  const breathe = s.pose === 'walk' ? 0 : (Math.sin(s.clock * 2.4) > 0.6 ? 1 : 0);
  const crouch = s.pose === 'crouch' ? Math.round(legH * 0.35) : 0;
  const bob = s.pose === 'walk' ? (Math.floor(s.t * 8) % 2) : 0;
  const top = Math.round(y - legH - torsoH - headH + crouch - bob - breathe);
  const cx = Math.round(x);
  const f = s.facing;

  // тень на полу
  c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(cx - bodyW / 2 - 2, y, bodyW + 4, 2);

  // ноги
  const legW = Math.floor(bodyW / 2) - 1;
  const step = s.pose === 'walk' ? Math.sin(s.t * 12) : 0;
  const legTop = top + headH + torsoH;
  const legLen = legH - crouch + breathe + bob;
  for (const side of [-1, 1]) {
    const lx = cx + (side < 0 ? -legW - 0 : 1);
    const sw = Math.round(step * 3 * side);
    if (s.pose === 'crouch') { block(c, lx, legTop, legW, legLen, a.pants); block(c, lx + (side * 2), legTop + legLen - 2, legW + 2, 3, a.pants); }
    else block(c, lx + sw, legTop, legW, legLen, a.pants);
    // обувь
    const shoeX = lx + (s.pose === 'crouch' ? side * 2 : sw) + (f > 0 ? 0 : -2);
    if (a.slippers && !master) { block(c, shoeX - 1, y - 3, legW + 3, 3, '#3d6d8a'); rect(c, shoeX, y - 5, legW, 2, '#e6eaec'); }
    else block(c, shoeX - 1, y - 3, legW + 3, 3, a.shoes);
  }

  // туловище
  const tx = cx - Math.round(bodyW / 2), ty = top + headH;
  block(c, tx, ty, bodyW, torsoH + 1, a.top);
  if (a.build === 2) block(c, tx + 1 + (f > 0 ? 2 : 0), ty + torsoH - 6, bodyW - 3, 6, shade(a.top, -0.05), { outline: false });
  const ox = a.outfit;
  if (ox === 'hoodie') { rect(c, cx - 3, ty + 1, 1, 6, '#e6eaec'); rect(c, cx + 2, ty + 1, 1, 6, '#e6eaec'); rect(c, tx + 3, ty + torsoH - 6, bodyW - 6, 4, shade(a.top, -0.15)); }
  if (ox === 'tracksuit') { rect(c, tx + 1, ty + 1, 1, torsoH - 1, '#f2f2ee'); rect(c, tx + bodyW - 2, ty + 1, 1, torsoH - 1, '#f2f2ee'); rect(c, cx, ty + 1, 1, torsoH - 2, shade(a.top, -0.3)); }
  if (ox === 'cardigan') { rect(c, cx - 2, ty + 1, 4, torsoH - 1, '#e6eaec'); for (let i = 0; i < 3; i++) px(c, cx + 2, ty + 4 + i * 5, '#3a2c22'); }
  if (ox === 'flannel') { for (let i = 0; i < bodyW - 2; i += 3) rect(c, tx + 1 + i, ty + 1, 1, torsoH - 1, shade(a.top, -0.25)); for (let j = 3; j < torsoH; j += 4) rect(c, tx + 1, ty + j, bodyW - 2, 1, shade(a.top, -0.25)); }
  if (ox === 'turtleneck') rect(c, cx - 3, ty - 2, 6, 3, a.top);
  if (ox === 'blazer' || ox === 'shirt_tie') { rect(c, cx - 2, ty + 1, 4, 8, '#ffffff'); rect(c, cx - 1, ty + 2, 2, 9, a.accent === '#e6eaec' ? '#a3294a' : a.accent); }
  if (ox === 'polo') rect(c, cx - 2, ty, 4, 3, shade(a.top, 0.3));
  if (a.extra === 'lanyard') { line(c, cx - 3, ty + 1, cx, ty + 9, '#2f7dd6'); block(c, cx - 1, ty + 9, 4, 5, '#ffffff'); }
  if (master) { rect(c, tx + 2, ty + 2, bodyW - 4, torsoH - 3, '#2f5d8a'); rect(c, tx + 3, ty, 2, 4, '#2f5d8a'); rect(c, tx + bodyW - 5, ty, 2, 4, '#2f5d8a'); rect(c, cx - 2, ty + 7, 4, 3, '#24496c'); }

  // руки
  const armC = ox === 'shirt_tie' ? a.top : a.top;
  const handC = a.skin;
  const armLen = torsoH - 2;
  const pose = s.pose;
  const drawArm = (side: number) => {
    const ax = side < 0 ? tx - 3 : tx + bodyW - 1;
    let swing = pose === 'walk' ? Math.round(Math.sin(s.t * 12 + (side > 0 ? Math.PI : 0)) * 2) : 0;
    if (pose === 'cross') {
      // скрещённые руки на груди
      block(c, tx + 1, ty + 7, bodyW - 2, 4, shade(armC, -0.08));
      rect(c, tx + 2, ty + 8, 2, 2, handC); rect(c, tx + bodyW - 4, ty + 8, 2, 2, handC);
      return;
    }
    if ((pose === 'happy' && side === f) || (pose === 'point' && side === f)) {
      // поднятая рука
      const k = Math.min(1, s.t * 4);
      const hx = ax + side * Math.round(4 * k), hy = ty - Math.round(8 * k) + (pose === 'point' ? 10 : 0);
      block(c, Math.min(ax, hx), Math.min(ty, hy), 4, Math.abs(hy - ty) + 5, armC);
      rect(c, hx, hy - 2, 3, 3, handC);
      return;
    }
    if (pose === 'crouch' && side === f) {
      // работает инструментом
      const k = Math.sin(s.clock * 10);
      block(c, ax, ty + 2, 4, 8, armC); block(c, ax + side * 3, ty + 8, 6, 3, armC);
      rect(c, ax + side * 8, ty + 8 + Math.round(k), 3, 3, handC);
      rect(c, ax + side * 10, ty + 6 + Math.round(k), 1, 6, '#c9ccd0');
      return;
    }
    if (pose === 'talk' && side === f && Math.sin(s.clock * 2.5) > 0) {
      // Небольшой жест во время разговора, чтобы диалог читался и без текста.
      block(c, ax, ty + 1, 4, 8, armC);
      block(c, side > 0 ? ax + 2 : ax - 4, ty + 7, 7, 3, armC);
      rect(c, side > 0 ? ax + 8 : ax - 5, ty + 6, 3, 3, handC);
      return;
    }
    block(c, ax, ty + 1 + swing, 4, armLen, armC);
    rect(c, ax + 1, ty + armLen + swing, 3, 3, handC);
    if (a.extra === 'watch' && side < 0) rect(c, ax, ty + armLen - 2 + swing, 4, 1, '#c9a24a');
  };
  drawArm(-f); drawArm(f);

  // голова
  const nod = pose === 'nod' && s.t < 1.2 ? (Math.floor(s.t * 8) % 2) : 0;
  const shakeX = pose === 'shake' && s.t < 1.2 ? (Math.floor(s.t * 10) % 2 ? 1 : -1) : 0;
  const hx = cx - 7 + shakeX, hy = top + nod;
  rect(c, cx - 2, hy + headH - 2, 4, 3, SKIN_SHADE(a.skin)); // шея
  block(c, hx, hy, 14, headH, a.skin, { light: 0.15 });
  // ухо
  rect(c, f > 0 ? hx : hx + 13, hy + 6, 1, 3, SKIN_SHADE(a.skin));
  // лицо (смотрит в сторону facing; глаза смещены)
  const fx = hx + (f > 0 ? 7 : 2);
  const ey = hy + 6;
  const eye = '#1b1d22';
  if (s.blink) { rect(c, fx, ey + 1, 2, 1, eye); rect(c, fx + 4, ey + 1, 2, 1, eye); }
  else if (s.mood === 2) { rect(c, fx, ey + 1, 2, 1, eye); px(c, fx, ey, eye); px(c, fx + 1, ey, eye); rect(c, fx + 4, ey + 1, 2, 1, eye); px(c, fx + 4, ey, eye); px(c, fx + 5, ey, eye); }
  else { rect(c, fx, ey, 1, s.mood === 0 ? 1 : 2, eye); rect(c, fx + 4, ey, 1, s.mood === 0 ? 1 : 2, eye); px(c, fx + 1, ey, '#ffffff'); px(c, fx + 5, ey, '#ffffff'); }
  // брови
  const brow = a.hairStyle === 'bald' ? '#5b4a3e' : shade(a.hair, -0.1);
  if (s.mood === 0) { px(c, fx, ey - 2, brow); px(c, fx + 1, ey - 1, brow); px(c, fx + 5, ey - 2, brow); px(c, fx + 4, ey - 1, brow); }
  else { rect(c, fx, ey - 2, 2, 1, brow); rect(c, fx + 4, ey - 2, 2, 1, brow); }
  // очки
  if (a.glasses !== 'none') { const gc = '#2a2d33'; rect(c, fx - 1, ey - 1, 4, 1, gc); rect(c, fx + 3, ey - 1, 4, 1, gc); rect(c, fx - 1, ey + 2, 4, 1, gc); rect(c, fx + 3, ey + 2, 4, 1, gc); px(c, fx - 1, ey, gc); px(c, fx + 6, ey, gc); }
  // нос и рот
  px(c, fx + (f > 0 ? 3 : 2), ey + 3, SKIN_SHADE(a.skin));
  const my = ey + 6;
  const mouth = '#7a3b34';
  if (a.facial === 'beard') block(c, hx + 2, hy + 9, 11, 6, a.hair, { outline: false });
  if (a.facial === 'mustache' || a.facial === 'beard') rect(c, fx, my - 1, 6, 1, shade(a.hair, -0.1));
  if (a.facial === 'stubble') { c.fillStyle = 'rgba(60,40,30,.25)'; c.fillRect(hx + 3, hy + 10, 9, 3); }
  const open = s.talking && Math.floor(s.clock * 9) % 2 === 0;
  if (open) rect(c, fx + 1, my, 3, 2, '#3a1a18');
  else if (s.mood === 2) { rect(c, fx + 1, my + 1, 3, 1, mouth); px(c, fx, my, mouth); px(c, fx + 4, my, mouth); }
  else if (s.mood === 0) { rect(c, fx + 1, my, 3, 1, mouth); px(c, fx, my + 1, mouth); px(c, fx + 4, my + 1, mouth); }
  else rect(c, fx + 1, my, 3, 1, mouth);
  // румянец у довольного
  if (s.mood === 2) { c.fillStyle = 'rgba(232,120,110,.45)'; c.fillRect(fx - 1, ey + 3, 2, 1); c.fillRect(fx + 5, ey + 3, 2, 1); }

  // волосы
  drawHair(c, hx, hy, a, f);
  if (master || a.extra === 'cap') {
    const cap = master ? '#f1d04b' : a.accent;
    block(c, hx - 1, hy - 2, 16, 5, cap);
    rect(c, f > 0 ? hx + 10 : hx - 4, hy + 2, 8, 2, shade(cap, -0.2));
  }
  if (a.extra === 'headphones' && !master) { rect(c, hx - 1, hy - 1, 16, 2, '#1b1d22'); block(c, f > 0 ? hx - 2 : hx + 12, hy + 5, 4, 6, '#1b1d22'); }
}

function drawHair(c: Ctx, hx: number, hy: number, a: Appearance, f: number) {
  const h = a.hair, d = shade(h, -0.25);
  switch (a.hairStyle) {
    case 'bald': rect(c, f > 0 ? hx + 1 : hx + 9, hy + 4, 4, 4, h); break;
    case 'buzz': rect(c, hx + 1, hy, 12, 3, h); break;
    case 'short': block(c, hx, hy - 1, 14, 5, h, { outline: false }); rect(c, f > 0 ? hx : hx + 11, hy + 3, 3, 4, h); break;
    case 'side': block(c, hx, hy - 2, 14, 5, h, { outline: false }); rect(c, f > 0 ? hx + 8 : hx + 1, hy + 2, 5, 2, h); rect(c, f > 0 ? hx : hx + 12, hy + 3, 2, 5, d); break;
    case 'slick': block(c, hx, hy - 2, 14, 5, h, { outline: false }); rect(c, hx + 2, hy - 1, 10, 1, shade(h, 0.3)); break;
    case 'curly': for (let i = 0; i < 6; i++) circle(c, hx + 1 + i * 2.4, hy - 1 + (i % 2), 2, i % 2 ? h : d); rect(c, f > 0 ? hx - 1 : hx + 12, hy + 2, 3, 6, h); break;
    case 'long': block(c, hx - 1, hy - 2, 16, 5, h, { outline: false }); rect(c, f > 0 ? hx - 1 : hx + 11, hy + 2, 4, 12, h); break;
  }
}

/** Ящик с инструментами у ног мастера. */
export function drawToolbox(c: Ctx, x: number, y: number) {
  block(c, x, y - 8, 14, 8, '#a3294a');
  rect(c, x + 4, y - 11, 6, 1, '#2a2d33'); rect(c, x + 4, y - 11, 1, 3, '#2a2d33'); rect(c, x + 9, y - 11, 1, 3, '#2a2d33');
  rect(c, x + 1, y - 5, 12, 1, shade('#a3294a', -0.3));
  px(c, x + 7, y - 6, '#c9ccd0');
}

export const MASTER_LOOK: Appearance = {
  height: 1.8, build: 1, age: 1, skin: '#e9b48f', hair: '#4a3326', hairStyle: 'short', facial: 'stubble', glasses: 'none',
  outfit: 'tshirt', top: '#e6eaec', accent: '#f1d04b', pants: '#2f5d8a', shoes: '#2a2622', slippers: false, extra: 'none',
};

/** Крупный пиксельный портрет для разговора. */
export function drawPixelPortrait(cv: HTMLCanvasElement, a: Appearance, mood: Level, wallLow: string, wallHigh: string, talking = false, clock = 0) {
  const c = cv.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  const W = 30, H = 40;
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const o = off.getContext('2d')!;
  o.fillStyle = wallHigh; o.fillRect(0, 0, W, H);
  o.fillStyle = wallLow; o.fillRect(0, 28, W, 12);
  drawPerson(o, 15, 66, a, { pose: talking ? 'talk' : 'idle', t: 0, clock, mood, facing: -1, blink: false, talking }, false);
  c.clearRect(0, 0, cv.width, cv.height);
  c.drawImage(off, 0, 0, W, H, 0, 0, cv.width, cv.height);
}
