// Четыре миниигры ремонта на Canvas 2D (docs/10_repair_minigames.md).
// Каждая игра сообщает о результате через колбэки; таймер и лимит ошибок ведёт хост.
import { sfx } from '../audio/sfx';

export interface MiniCallbacks { onError: (msg: string) => void; onSuccess: () => void; onInfo?: (msg: string) => void }
export interface MiniParams { label: string; deviceName: string; part?: { kind: string; value: number; unit: string; prefix?: string; suffix?: string }; parts: number; wires: number; hits: number; zone: number; period: number; screws: number; dirt: number; seed: number }

const TOUCH = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
const C = { paper: '#e9ebe6', paper2: '#d4d8d1', graphite: '#2a2d33', ink: '#1e3c8c', stamp: '#a3294a', ok: '#2f7d4f', sticker: '#f1d04b', board: '#2f5d4a', boardDark: '#244a3a', copper: '#c99a4a' };

function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function screwHead(ctx: CanvasRenderingContext2D, x: number, y: number, r = 9, rot = 0.8) {
  ctx.fillStyle = '#b9bcc2'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6b6f76'; ctx.lineWidth = r * 0.28; ctx.beginPath(); ctx.moveTo(x - Math.cos(rot) * r * 0.6, y - Math.sin(rot) * r * 0.6); ctx.lineTo(x + Math.cos(rot) * r * 0.6, y + Math.sin(rot) * r * 0.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - Math.sin(rot) * r * 0.6, y + Math.cos(rot) * r * 0.6); ctx.lineTo(x + Math.sin(rot) * r * 0.6, y - Math.cos(rot) * r * 0.6); ctx.stroke();
}

function pcb(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  ctx.fillStyle = C.board; rr(ctx, x, y, w, h, 16); ctx.fill();
  const r = rng(seed); ctx.strokeStyle = 'rgba(201,154,74,.35)'; ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) { ctx.beginPath(); let px = x + r() * w, py = y + r() * h; ctx.moveTo(px, py); for (let k = 0; k < 3; k++) { if (r() < 0.5) px += (r() - 0.5) * 160; else py += (r() - 0.5) * 120; px = Math.max(x + 10, Math.min(x + w - 10, px)); py = Math.max(y + 10, Math.min(y + h - 10, py)); ctx.lineTo(px, py); } ctx.stroke(); }
  for (let i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(201,154,74,.55)'; ctx.beginPath(); ctx.arc(x + 14 + r() * (w - 28), y + 14 + r() * (h - 28), 3, 0, Math.PI * 2); ctx.fill(); }
}

abstract class Mini {
  protected ctx: CanvasRenderingContext2D;
  protected w: number; protected h: number;
  protected raf = 0; protected done = false; protected t0 = performance.now();
  protected mx = 0; protected my = 0; protected down = false;
  protected sparks: { x: number; y: number; t: number; ok: boolean }[] = [];
  protected top = 0;
  protected get tall() { return this.h > this.w; }
  private handlers: [string, EventListener][] = [];
  constructor(protected cv: HTMLCanvasElement, protected p: MiniParams, protected cb: MiniCallbacks) {
    this.ctx = cv.getContext('2d')!; this.w = cv.width; this.h = cv.height;
    const pos = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); this.mx = ((e.clientX - r.left) / r.width) * this.w; this.my = ((e.clientY - r.top) / r.height) * this.h; };
    this.on('pointerdown', (e) => { pos(e as PointerEvent); this.down = true; cv.setPointerCapture((e as PointerEvent).pointerId); if (!this.done) this.press(); });
    this.on('pointermove', (e) => { pos(e as PointerEvent); if (!this.done) this.move(); });
    this.on('pointerup', (e) => { pos(e as PointerEvent); this.down = false; if (!this.done) this.release(); });
    const loop = (now: number) => { this.raf = requestAnimationFrame(loop); this.draw(now); this.drawSparks(now); };
    this.raf = requestAnimationFrame(loop);
  }
  private on(ev: string, f: EventListener) { this.cv.addEventListener(ev, f); this.handlers.push([ev, f]); }
  destroy() { cancelAnimationFrame(this.raf); this.handlers.forEach(([e, f]) => this.cv.removeEventListener(e, f)); }
  stop() { this.done = true; }
  key(_k: string) { /* переопределяется */ }
  protected press() {} protected move() {} protected release() {}
  protected abstract draw(now: number): void;
  protected spark(x: number, y: number, ok = false) { this.sparks.push({ x, y, t: performance.now(), ok }); }
  protected win() { if (this.done) return; this.done = true; setTimeout(() => this.cb.onSuccess(), 650); }
  private drawSparks(now: number) {
    const ctx = this.ctx;
    this.sparks = this.sparks.filter((s) => now - s.t < 450);
    for (const s of this.sparks) {
      const k = (now - s.t) / 450;
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = s.ok ? C.ok : '#ffb02a'; ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(s.x + Math.cos(a) * 8, s.y + Math.sin(a) * 8); ctx.lineTo(s.x + Math.cos(a) * (14 + k * 30), s.y + Math.sin(a) * (14 + k * 30)); ctx.stroke(); }
      ctx.restore();
    }
  }
  protected frame(title: string, instr: string) {
    const ctx = this.ctx, w = this.w, h = this.h;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#2f343c'; rr(ctx, 0, 0, w, h, 18); ctx.fill();
    ctx.fillStyle = C.paper; rr(ctx, 16, 16, w - 32, h - 32, 22); ctx.fill();
    for (const [x, y] of [[36, 36], [w - 36, 36], [36, h - 36], [w - 36, h - 36]]) screwHead(ctx, x, y, 9);
    ctx.fillStyle = C.graphite; ctx.font = '800 24px Nunito, sans-serif'; ctx.fillText(title, 60, 62);
    // инструкция переносится на вторую строку, если не помещается
    ctx.fillStyle = C.ink; ctx.font = '21px Neucha, cursive';
    const maxW = w - 120, words = instr.split(' '); let line = '', y = 90; const lines: string[] = [];
    for (const wd of words) { const tst = line ? line + ' ' + wd : wd; if (ctx.measureText(tst).width > maxW && line) { lines.push(line); line = wd; } else line = tst; }
    lines.push(line);
    lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 60, y + i * 24));
    this.top = lines.length > 1 ? 24 : 0;
  }
}

/* ---------------- Замена детали ---------------- */

interface Part { label: string; ok: boolean; x: number; y: number; hx: number; hy: number }

export class SwapGame extends Mini {
  private parts: Part[] = [];
  private drag: Part | null = null; private dx = 0; private dy = 0;
  private slot = { x: 120, y: 190, w: 200, h: 120 };
  private need: string;
  private placed: Part | null = null;
  constructor(cv: HTMLCanvasElement, p: MiniParams, cb: MiniCallbacks) {
    super(cv, p, cb);
    const r = rng(p.seed); const part = p.part ?? { kind: 'Деталь', value: 10, unit: '' };
    const fmt = (v: number) => `${part.prefix ?? ''}${v}${part.unit}${part.suffix ?? ''}`;
    this.need = fmt(part.value);
    const used = new Set([part.value]); const vals = [part.value];
    const muls = [0.5, 0.8, 1.25, 1.5, 2, 0.6, 1.6];
    while (vals.length < p.parts) { const v = Math.round(part.value * muls[Math.floor(r() * muls.length)]); if (!used.has(v)) { used.add(v); vals.push(v); } }
    const order = vals.map((v) => ({ v, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.v);
    if (this.tall) {
      this.slot = { x: (this.w - 260) / 2, y: 175, w: 260, h: 150 };
      this.parts = order.map((v, i) => { const x = i % 2 ? this.w / 2 + 20 : this.w / 2 - 220, y = 430 + Math.floor(i / 2) * 64; return { label: fmt(v), ok: v === part.value, x, y, hx: x, hy: y }; });
    } else {
      const colX = this.w - 250, startY = 130, gap = Math.min(64, (this.h - 170) / p.parts);
      this.parts = order.map((v, i) => ({ label: fmt(v), ok: v === part.value, x: colX, y: startY + i * gap, hx: colX, hy: startY + i * gap }));
      this.slot = { x: 90, y: 150, w: 260, h: 150 };
    }
  }
  protected press() {
    for (let i = this.parts.length - 1; i >= 0; i--) { const pt = this.parts[i]; if (pt === this.placed) continue; if (this.mx > pt.x && this.mx < pt.x + 200 && this.my > pt.y && this.my < pt.y + 48) { this.drag = pt; this.dx = this.mx - pt.x; this.dy = this.my - pt.y; this.parts.splice(i, 1); this.parts.push(pt); return; } }
  }
  protected move() { if (this.drag) { this.drag.x = this.mx - this.dx; this.drag.y = this.my - this.dy; } }
  protected release() {
    const d = this.drag; if (!d) return; this.drag = null;
    const s = this.slot, cx = d.x + 100, cy = d.y + 24;
    if (cx > s.x && cx < s.x + s.w && cy > s.y && cy < s.y + s.h) {
      if (d.ok) { d.x = s.x + 30; d.y = s.y + s.h / 2 - 24; this.placed = d; sfx('hit'); this.spark(s.x + s.w / 2, s.y + s.h / 2, true); this.win(); return; }
      sfx('spark'); this.spark(cx, cy); this.cb.onError('Не та деталь — искра!');
    }
    d.x = d.hx; d.y = d.hy;
  }
  protected draw() {
    const ctx = this.ctx; this.frame('ЗАМЕНА ДЕТАЛИ', `найдите деталь с маркировкой «${this.need}» и вставьте в гнездо`);
    if (this.tall) pcb(ctx, 60, 140, this.w - 120, 250, this.p.seed); else pcb(ctx, 60, 120, this.w - 340, this.h - 160, this.p.seed);
    const s = this.slot;
    ctx.setLineDash([8, 6]); ctx.strokeStyle = C.sticker; ctx.lineWidth = 3; rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, s.x + 30, s.y + s.h / 2 - 24, 200, 48, 10); ctx.fill();
    ctx.fillStyle = '#f2f2ee'; ctx.font = '700 16px "PT Mono", monospace'; ctx.fillText(`${this.p.part?.kind ?? 'деталь'}: ${this.need}`, s.x + 8, s.y + s.h + 24);
    ctx.fillStyle = 'rgba(30,20,10,.6)'; ctx.beginPath(); ctx.ellipse(s.x + s.w - 40, s.y + 28, 26, 14, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.graphite; ctx.font = '700 15px Nunito'; if (this.tall) ctx.fillText('лоток с деталями', this.w / 2 - 220, 418); else ctx.fillText('лоток с деталями', this.w - 250, 118);
    for (const pt of this.parts) this.drawPart(pt);
  }
  private drawPart(pt: Part) {
    const ctx = this.ctx; const lifted = pt === this.drag;
    ctx.save(); if (lifted) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; }
    ctx.fillStyle = '#c9ccd0'; rr(ctx, pt.x - 14, pt.y + 20, 14, 8, 3); ctx.fill(); rr(ctx, pt.x + 200, pt.y + 20, 14, 8, 3); ctx.fill();
    ctx.fillStyle = pt === this.placed ? '#e6f2e9' : '#f4f1e6'; rr(ctx, pt.x, pt.y, 200, 48, 10); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#9aa1aa'; ctx.lineWidth = 1.5; rr(ctx, pt.x, pt.y, 200, 48, 10); ctx.stroke();
    ctx.fillStyle = C.graphite; ctx.font = '700 17px "PT Mono", monospace'; ctx.fillText(pt.label, pt.x + 14, pt.y + 30);
  }
}

/* ---------------- Прозвонка ---------------- */

interface Wire { a: number; b: number; broken: boolean; ctrl: [number, number, number, number]; checked: boolean; shade: string }

export class WiresGame extends Mini {
  private wires: Wire[] = [];
  private first: { side: 0 | 1; idx: number } | null = null;
  private meter = '—';
  private meterOk = false;
  private lx: number; private rx: number; private ys: number[] = [];
  constructor(cv: HTMLCanvasElement, p: MiniParams, cb: MiniCallbacks) {
    super(cv, p, cb);
    const r = rng(p.seed); const n = p.wires;
    this.lx = 110; this.rx = this.w - 260;
    const top = 140, bot = this.h - 60;
    this.ys = Array.from({ length: n }, (_, i) => top + (i + 0.5) * ((bot - top) / n));
    const perm = Array.from({ length: n }, (_, i) => i).map((i) => ({ i, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.i);
    const broken = Math.floor(r() * n);
    const shades = ['#7a2a2a', '#8a3030', '#6e2626', '#7f2c2c', '#742828', '#863232', '#702a2a'];
    this.wires = perm.map((b, a) => ({ a, b, broken: a === broken, checked: false, shade: shades[a % shades.length], ctrl: [this.lx + 80 + r() * 200, top + r() * (bot - top), this.rx - 80 - r() * 200, top + r() * (bot - top)] }));
  }
  private endAt(): { side: 0 | 1; idx: number } | null {
    for (let i = 0; i < this.ys.length; i++) {
      if (Math.hypot(this.mx - this.lx, this.my - this.ys[i]) < 22) return { side: 0, idx: i };
      if (Math.hypot(this.mx - this.rx, this.my - this.ys[i]) < 22) return { side: 1, idx: i };
    }
    return null;
  }
  protected press() {
    const e = this.endAt(); if (!e) return;
    sfx('click');
    if (!this.first || this.first.side === e.side) { this.first = e; this.meter = '…'; this.meterOk = false; return; }
    const left = e.side === 0 ? e.idx : this.first.idx, right = e.side === 1 ? e.idx : this.first.idx;
    this.first = null;
    const w = this.wires.find((x) => x.a === left)!;
    if (w.b !== right) { this.meter = 'OL'; this.meterOk = false; sfx('spark'); this.spark(this.mx, this.my); this.cb.onError('OL — щупы на разных проводах'); return; }
    if (w.broken) { this.meter = 'OL'; this.meterOk = true; w.checked = true; sfx('beep'); this.cb.onInfo?.('Обрыв найден!'); this.spark(this.mx, this.my, true); this.win(); return; }
    w.checked = true; this.meter = '0 Ω'; this.meterOk = true; sfx('beep'); this.cb.onInfo?.('0 Ом — провод целый');
  }
  protected draw() {
    const ctx = this.ctx; this.frame('ПРОЗВОНКА ЦЕПИ', 'поставьте щупы на оба конца одного провода и найдите обрыв');
    pcb(ctx, 60, 112, this.w - 290, this.h - 140, this.p.seed + 3);
    for (const wi of this.wires) {
      const ya = this.ys[wi.a], yb = this.ys[wi.b];
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(this.lx, ya + 3); ctx.bezierCurveTo(wi.ctrl[0], wi.ctrl[1] + 3, wi.ctrl[2], wi.ctrl[3] + 3, this.rx, yb + 3); ctx.stroke();
      ctx.strokeStyle = wi.checked ? (wi.broken ? C.stamp : '#3f8f5f') : wi.shade; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(this.lx, ya); ctx.bezierCurveTo(wi.ctrl[0], wi.ctrl[1], wi.ctrl[2], wi.ctrl[3], this.rx, yb); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.lx, ya - 2); ctx.bezierCurveTo(wi.ctrl[0], wi.ctrl[1] - 2, wi.ctrl[2], wi.ctrl[3] - 2, this.rx, yb - 2); ctx.stroke();
    }
    const hov = this.endAt();
    for (let i = 0; i < this.ys.length; i++) for (const [side, x] of [[0, this.lx], [1, this.rx]] as const) {
      const sel = this.first && this.first.side === side && this.first.idx === i; const h = hov && hov.side === side && hov.idx === i;
      ctx.fillStyle = C.copper; ctx.beginPath(); ctx.arc(x, this.ys[i], h || sel ? 15 : 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7a5a2a'; ctx.beginPath(); ctx.arc(x, this.ys[i], 5, 0, Math.PI * 2); ctx.fill();
      if (sel) { ctx.strokeStyle = C.sticker; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, this.ys[i], 20, 0, Math.PI * 2); ctx.stroke(); }
    }
    // мультиметр
    const mx = this.w - 200, my = 120;
    ctx.fillStyle = '#f1c232'; rr(ctx, mx, my, 150, this.h - 160, 20); ctx.fill();
    ctx.fillStyle = '#2a2d33'; rr(ctx, mx + 12, my + 12, 126, this.h - 184, 14); ctx.fill();
    ctx.fillStyle = '#9fb59a'; rr(ctx, mx + 22, my + 24, 106, 64, 8); ctx.fill();
    ctx.fillStyle = this.meterOk ? '#123a1e' : this.meter === 'OL' ? '#5a0d1d' : '#1b2a18'; ctx.font = '700 38px "PT Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText(this.meter, mx + 75, my + 70); ctx.textAlign = 'left';
    ctx.fillStyle = '#e6eaec'; ctx.beginPath(); ctx.arc(mx + 75, my + 150, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a2d33'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(mx + 75, my + 150); ctx.lineTo(mx + 96, my + 128); ctx.stroke();
    ctx.fillStyle = '#e6eaec'; ctx.font = '700 13px Nunito'; ctx.textAlign = 'center'; ctx.fillText('Ω  прозвонка', mx + 75, my + 205); ctx.textAlign = 'left';
    if (this.first) { ctx.strokeStyle = '#d64d3b'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(this.first.side ? this.rx : this.lx, this.ys[this.first.idx]); ctx.lineTo(this.mx, this.my); ctx.stroke(); ctx.setLineDash([]); }
  }
}

/* ---------------- Калибровка ---------------- */

export class CalibGame extends Mini {
  private zone = 0.6; private hits = 0; private stopped = 0; private speed: number; private phase = 0; private last = performance.now();
  private r: () => number;
  constructor(cv: HTMLCanvasElement, p: MiniParams, cb: MiniCallbacks) {
    super(cv, p, cb); this.r = rng(p.seed); this.speed = 1 / p.period; this.zone = 0.25 + this.r() * 0.5;
  }
  private value() { return 0.5 + 0.5 * Math.sin(this.phase * Math.PI * 2); }
  key(k: string) { if (k === ' ' || k === 'Enter') this.press(); }
  protected press() {
    if (this.done || this.stopped) return;
    const v = this.value(); this.stopped = v;
    const ok = Math.abs(v - this.zone) <= this.p.zone / 2;
    if (ok) { this.hits++; sfx('hit'); this.cb.onInfo?.(`Попадание ${this.hits} из ${this.p.hits}`); if (this.hits >= this.p.hits) { this.win(); return; } }
    else { sfx('spark'); this.cb.onError('Промах'); }
    setTimeout(() => { if (this.done) return; this.stopped = 0; if (ok) { this.zone = 0.18 + this.r() * 0.64; this.speed *= 1.12; } }, 550);
  }
  protected draw(now: number) {
    const dt = (now - this.last) / 1000; this.last = now; if (!this.stopped && !this.done) this.phase += dt * this.speed;
    const ctx = this.ctx, w = this.w, h = this.h;
    this.frame(this.p.label, `остановите стрелку в зелёной зоне ${this.p.hits} раза · ${TOUCH ? 'тап' : 'пробел или клик'}`);
    const cx = w / 2, cy = this.tall ? h * 0.78 : h * 0.92, R = Math.min(h * 0.52, w * 0.4), a0 = Math.PI * 1.12, a1 = Math.PI * 1.88;
    ctx.lineCap = 'butt'; ctx.lineWidth = 38; ctx.strokeStyle = '#cfd4cc'; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
    const za = a0 + (a1 - a0) * (this.zone - this.p.zone / 2), zb = a0 + (a1 - a0) * (this.zone + this.p.zone / 2);
    ctx.strokeStyle = C.ok; ctx.beginPath(); ctx.arc(cx, cy, R, za, zb); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = C.graphite;
    for (let i = 0; i <= 20; i++) { const a = a0 + (a1 - a0) * i / 20, r1 = R + 22, r2 = R + (i % 5 ? 30 : 40); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke(); }
    const v = this.stopped || this.value(), na = a0 + (a1 - a0) * v;
    ctx.strokeStyle = C.stamp; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(na) * (R + 16), cy + Math.sin(na) * (R + 16)); ctx.stroke();
    ctx.fillStyle = C.graphite; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < this.p.hits; i++) { ctx.fillStyle = i < this.hits ? C.ok : '#cfd4cc'; ctx.beginPath(); ctx.arc(w - 70 - i * 30, 62, 11, 0, Math.PI * 2); ctx.fill(); }
  }
}

/* ---------------- Разборка и чистка ---------------- */

interface Screw { x: number; y: number; n: number; out: boolean; spin: number }
interface Dirt { x: number; y: number; r: number; left: number; kind: number }

export class CleanGame extends Mini {
  private screws: Screw[] = []; private dirt: Dirt[] = []; private nextScrew = 1; private coverOff = 0; private wiping = false;
  private dirtCanvas: HTMLCanvasElement; private dctx: CanvasRenderingContext2D;
  constructor(cv: HTMLCanvasElement, p: MiniParams, cb: MiniCallbacks) {
    super(cv, p, cb);
    const r = rng(p.seed);
    const box = { x: 120, y: 130, w: this.w - 240, h: this.h - 180 };
    const spots = [[box.x + 24, box.y + 24], [box.x + box.w - 24, box.y + 24], [box.x + box.w - 24, box.y + box.h - 24], [box.x + 24, box.y + box.h - 24], [box.x + box.w / 2, box.y + 24], [box.x + box.w / 2, box.y + box.h - 24]];
    const order = spots.slice(0, Math.max(p.screws, 3)).map((s) => ({ s, k: r() })).sort((a, b) => a.k - b.k).slice(0, p.screws);
    this.screws = order.map((o, i) => ({ x: o.s[0], y: o.s[1], n: i + 1, out: false, spin: 0 }));
    for (let i = 0; i < p.dirt; i++) this.dirt.push({ x: box.x + 90 + r() * (box.w - 180), y: box.y + 70 + r() * (box.h - 140), r: 46 + r() * 24, left: 1, kind: Math.floor(r() * 3) });
    this.dirtCanvas = document.createElement('canvas'); this.dirtCanvas.width = this.w; this.dirtCanvas.height = this.h; this.dctx = this.dirtCanvas.getContext('2d')!;
    for (const d of this.dirt) this.paintDirt(d, r);
  }
  private paintDirt(d: Dirt, r: () => number) {
    const c = this.dctx;
    const col = ['rgba(120,110,95,', 'rgba(220,220,205,', 'rgba(60,45,35,'][d.kind];
    for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, rr2 = r() * d.r; c.fillStyle = col + (0.25 + r() * 0.5) + ')'; c.beginPath(); c.arc(d.x + Math.cos(a) * rr2, d.y + Math.sin(a) * rr2, 4 + r() * 10, 0, Math.PI * 2); c.fill(); }
    if (d.kind === 2) { c.strokeStyle = 'rgba(40,30,20,.7)'; c.lineWidth = 1.5; for (let i = 0; i < 18; i++) { c.beginPath(); const a = r() * Math.PI * 2; c.moveTo(d.x + Math.cos(a) * d.r * 0.2, d.y + Math.sin(a) * d.r * 0.2); c.quadraticCurveTo(d.x + (r() - 0.5) * d.r * 2, d.y + (r() - 0.5) * d.r * 2, d.x + Math.cos(a + 2) * d.r, d.y + Math.sin(a + 2) * d.r); c.stroke(); } }
  }
  protected press() {
    if (this.coverOff < 1) {
      const s = this.screws.find((x) => !x.out && Math.hypot(this.mx - x.x, this.my - x.y) < 24);
      if (!s) return;
      if (s.n !== this.nextScrew) { sfx('spark'); this.spark(s.x, s.y); this.cb.onError(`Не тот винт — сначала № ${this.nextScrew}`); return; }
      s.out = true; this.nextScrew++; sfx('screw');
      if (this.nextScrew > this.screws.length) { this.cb.onInfo?.('Крышка снята — сотрите грязь'); const t0 = performance.now(); const anim = () => { this.coverOff = Math.min(1, (performance.now() - t0) / 500); if (this.coverOff < 1) requestAnimationFrame(anim); }; anim(); }
      return;
    }
    this.wiping = true; this.wipe();
  }
  protected move() { if (this.down && this.coverOff >= 1) this.wipe(); }
  protected release() { this.wiping = false; }
  private wipe() {
    const c = this.dctx; c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(this.mx, this.my, 26, 0, Math.PI * 2); c.fill(); c.restore();
    let all = true;
    for (const d of this.dirt) {
      if (d.left <= 0) continue;
      if (Math.hypot(this.mx - d.x, this.my - d.y) < d.r + 20) { d.left -= 0.035; if (Math.random() < 0.3) sfx('paperClose'); }
      if (d.left > 0) all = false; else { c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(d.x, d.y, d.r + 18, 0, Math.PI * 2); c.fill(); c.restore(); this.spark(d.x, d.y, true); }
    }
    if (all) this.win();
  }
  protected draw() {
    const ctx = this.ctx; this.frame('РАЗБОРКА И ЧИСТКА', this.coverOff < 1 ? 'выкрутите винты по порядку номеров' : (TOUCH ? 'проведите пальцем по грязи и сотрите её' : 'зажмите кнопку мыши и сотрите грязь'));
    const box = { x: 120, y: 130, w: this.w - 240, h: this.h - 180 };
    pcb(ctx, box.x, box.y, box.w, box.h, this.p.seed + 9);
    ctx.fillStyle = '#3a3d44'; ctx.beginPath(); ctx.arc(box.x + box.w * 0.7, box.y + box.h * 0.5, 54, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + performance.now() / 800 * (this.done ? 1 : 0); ctx.fillStyle = '#5b616b'; ctx.beginPath(); ctx.ellipse(box.x + box.w * 0.7 + Math.cos(a) * 30, box.y + box.h * 0.5 + Math.sin(a) * 30, 22, 9, a, 0, Math.PI * 2); ctx.fill(); }
    ctx.drawImage(this.dirtCanvas, 0, 0);
    if (this.coverOff < 1) {
      ctx.save(); ctx.globalAlpha = 1 - this.coverOff; ctx.translate(0, -this.coverOff * 60);
      ctx.fillStyle = '#c9ccd0'; rr(ctx, box.x - 6, box.y - 6, box.w + 12, box.h + 12, 18); ctx.fill();
      ctx.fillStyle = '#b9bcc2'; for (let i = 0; i < 9; i++) rr(ctx, box.x + box.w * 0.3, box.y + 60 + i * 22, box.w * 0.4, 8, 4), ctx.fill();
      ctx.fillStyle = C.graphite; ctx.font = '800 22px Nunito'; ctx.fillText(this.p.deviceName.toUpperCase(), box.x + 30, box.y + box.h - 30);
      for (const s of this.screws) { if (s.out) continue; screwHead(ctx, s.x, s.y, 14, 0.6); ctx.fillStyle = C.stamp; ctx.font = '800 16px Nunito'; ctx.fillText(String(s.n), s.x + 16, s.y - 12); }
      ctx.restore();
    }
  }
}

export function createMini(type: 'swap' | 'wires' | 'calib' | 'clean', cv: HTMLCanvasElement, p: MiniParams, cb: MiniCallbacks): Mini {
  if (type === 'swap') return new SwapGame(cv, p, cb);
  if (type === 'wires') return new WiresGame(cv, p, cb);
  if (type === 'calib') return new CalibGame(cv, p, cb);
  return new CleanGame(cv, p, cb);
}
export type { Mini };
