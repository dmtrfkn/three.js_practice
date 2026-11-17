// 2D-сцена в пиксельном стиле: дом в разрезе, комната клиента, мастер и клиент.
// Повторяет API старой 3D-сцены, поэтому интерфейс игры не меняется.
import { rect, outlineOf, rnd, type Ctx } from './pix';
import { itemSprite, deviceSprite } from './sprites';
import { drawPerson, drawToolbox, MASTER_LOOK, type Pose, type PersonState } from './people';
import { LOOKS, FLOOR, ANCHORS, drawExterior, drawBuilding, drawRoomShell, drawWindow, sunbeam, presetProps, ceilingLights, drawSurface, drawDeviceTable, drawDoor, type Prop } from './rooms';
import { appearanceFor, type Appearance } from '../scene/client';
import { LOCATIONS, type Level } from '../core/params';
import { PRESETS } from '../core/content';
import type { Order } from '../core/types';

export interface SceneEvents {
  onItemClick?: (id: string) => void;
  onClientClick?: () => void;
  onHover?: (id: string | null) => void;
}
export const MOBILE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

const VH = 180;                 // высота кадра в игровых пикселях
const MIN_W = 172;              // минимум видимой ширины (телефон в портрете)

interface Hit { id: string; x: number; y: number; w: number; h: number; cv: HTMLCanvasElement; on: boolean }
type ReactKind = 'nod' | 'cross' | 'shake' | 'leave' | 'happy';

class Actor {
  x: number; tx: number; pose: Pose = 'idle'; poseT = 0; until = 0; facing: 1 | -1;
  mood: Level = 1; talking = false; alpha = 1; gone = false;
  constructor(x: number, facing: 1 | -1, public look: Appearance) { this.x = this.tx = x; this.facing = facing; }
  react(kind: ReactKind, now: number) {
    if (kind === 'leave') { this.tx = this.x + 160; this.facing = 1; this.gone = true; return; }
    this.pose = kind; this.poseT = 0; this.until = now + (kind === 'happy' ? 2.2 : 1.6);
  }
  update(dt: number, now: number, idle: Pose) {
    this.poseT += dt;
    const d = this.tx - this.x;
    if (Math.abs(d) > 0.5) { this.x += Math.sign(d) * Math.min(Math.abs(d), dt * 34); this.facing = d > 0 ? 1 : -1; if (this.pose !== 'walk') { this.pose = 'walk'; this.poseT = 0; } return; }
    if (this.pose === 'walk' || (this.until && now > this.until)) { this.pose = idle; this.until = 0; this.poseT = 0; }
    if (!this.until && this.pose !== idle) { this.pose = idle; this.poseT = 0; }
    if (this.gone) this.alpha = Math.max(0, this.alpha - dt);
  }
  state(now: number, blinkSeed: number): PersonState {
    const blink = (now + blinkSeed) % 3.7 < 0.12;
    return { pose: this.pose, t: this.poseT, clock: now, mood: this.mood, facing: this.facing, blink, talking: this.talking };
  }
}

/** Пылинки в луче света и прочие частицы. */
interface Mote { x: number; y: number; v: number; ph: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number }

export class RoomScene {
  private c: Ctx;
  private buf = document.createElement('canvas');
  private b: Ctx;
  private raf = 0; private last = performance.now(); private now = 0;
  private order: Order | null = null;
  private props: Prop[] = []; private lights: Prop[] = [];
  private hits: Hit[] = [];
  private device: { cv: HTMLCanvasElement; x: number; y: number } | null = null;
  private master: Actor | null = null;
  client: { react: (k: ReactKind) => void } | null = null;
  private cl: Actor | null = null;
  appearance: Appearance | null = null;
  private camX = 0; private tCamX = 0; private viewW = 320; private scale = 1; private vh = VH;
  private get viewTop() { const h = this.order ? this.look.h : 104; return this.vh > VH + 4 ? Math.round(FLOOR - h / 2 - this.vh / 2 + 4) : FLOOR + 14 - this.vh; }
  private dragging = false; private moved = 0; private lx = 0; private mx = -1; private my = -1;
  private hovered: string | null = null;
  private motes: Mote[] = [];
  private sparks: Spark[] = [];
  private resizeObserver: ResizeObserver;
  private door = 1; private mode: 'inspect' | 'client' | 'device' = 'inspect';
  interactive = false;
  sensitivity = 1;
  events: SceneEvents = {};
  locId = 'dorm';

  constructor(private canvas: HTMLCanvasElement) {
    this.c = canvas.getContext('2d')!;
    this.b = this.buf.getContext('2d')!;
    canvas.style.imageRendering = 'pixelated';
    this.bindInput();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    const loop = (ts: number) => { this.raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (ts - this.last) / 1000); this.last = ts; this.now += dt; this.frame(dt); };
    this.raf = requestAnimationFrame(loop);
  }

  dispose() { cancelAnimationFrame(this.raf); this.resizeObserver.disconnect(); }

  private get look() { return LOOKS[this.locId]; }
  private get W() { return this.look.w; }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    this.canvas.width = w; this.canvas.height = h;
    this.scale = Math.min(h / VH, w / MIN_W);
    this.viewW = Math.ceil(w / this.scale); this.vh = Math.ceil(h / this.scale);
    this.buf.width = this.viewW; this.buf.height = this.vh;
    this.b.imageSmoothingEnabled = false;
    this.clampCam(true);
  }

  private clampCam(snap = false) {
    const pad = 14, lo = -pad, hi = this.W + pad;
    const half = this.viewW / 2;
    const clamp = (v: number) => (hi - lo <= this.viewW ? (lo + hi) / 2 : Math.max(lo + half, Math.min(hi - half, v)));
    this.tCamX = clamp(this.tCamX);
    if (snap) this.camX = this.tCamX; else this.camX = clamp(this.camX);
  }

  /* ---------------- сборка комнаты ---------------- */

  build(o: Order) {
    this.order = o;
    const loc = LOCATIONS[o.locIdx];
    this.locId = loc.id;
    const L = this.look, W = L.w;
    const preset = PRESETS[loc.id][o.presetIdx];
    this.props = presetProps(preset.id, W, L.h);
    this.lights = ceilingLights(loc.id, W, L.h);
    this.hits = [];

    // устройство
    const dev = deviceSprite(o.deviceId);
    const dx = Math.round(W * ANCHORS.device);
    const dy = dev.wall ? FLOOR - L.h + 26 : dev.floor ? FLOOR : FLOOR - 30;
    this.device = { cv: dev.cv, x: dx - Math.floor(dev.cv.width / 2), y: dy - (dev.wall ? 0 : dev.cv.height) };

    // предметы по точкам
    const noticed = new Set(o.noticed ?? o.items.map((i) => i.id));
    const bySlot = new Map<number, typeof o.items>();
    for (const it of o.items) { const a = bySlot.get(it.slot) ?? []; a.push(it); bySlot.set(it.slot, a); }
    for (const [slot, list] of bySlot) {
      const sx = Math.round(W * ANCHORS.slots[slot]);
      const sprites = list.map((it) => itemSprite(it.id));
      const total = sprites.reduce((s, cv) => s + cv.width, 0) + (sprites.length - 1) * 2;
      let x = sx - Math.floor(total / 2);
      list.forEach((it, i) => {
        const cv = sprites[i];
        this.hits.push({ id: it.id, x, y: FLOOR - 44 - cv.height, w: cv.width, h: cv.height, cv, on: noticed.has(it.id) });
        x += cv.width + 2;
      });
    }

    // люди
    this.appearance = appearanceFor(o.client.name + ':' + o.no, loc.id);
    const cl = new Actor(Math.round(W * ANCHORS.client), -1, this.appearance);
    cl.mood = o.mood;
    this.cl = cl;
    this.client = { react: (k) => cl.react(k, this.now) };
    this.master = new Actor(Math.round(W * ANCHORS.door) + 8, 1, MASTER_LOOK);
    this.master.tx = Math.round(W * ANCHORS.master) + 6;
    this.door = 1;
    this.mode = 'inspect';

    // пылинки
    const r = rnd(o.no * 31 + 7);
    this.motes = Array.from({ length: MOBILE ? 14 : 26 }, () => ({ x: r() * W, y: FLOOR - L.h + r() * L.h, v: 1 + r() * 2, ph: r() * 6 }));
    this.sparks = [];
    this.hovered = null;
    this.tCamX = W * 0.42; this.clampCam(true);
  }

  setCamera(_yaw: number, _pitch: number) { this.tCamX = this.W * 0.42; this.clampCam(true); }
  get cameraAngles() { return { yaw: 0, pitch: 0 }; }
  setMood(m: Level) { if (this.cl) this.cl.mood = m; }

  focusClient(on: boolean) {
    if (!this.cl || !this.master) return;
    if (on) {
      this.mode = 'client';
      this.tCamX = this.cl.x - this.viewW * 0.2;
      this.master.tx = this.cl.x - 34;
      this.cl.talking = true;
    } else { this.mode = 'inspect'; this.cl.talking = false; }
    this.clampCam();
  }
  focusDevice() {
    if (!this.device || !this.master || !this.cl) return;
    this.mode = 'device'; this.cl.talking = false;
    this.master.tx = this.device.x - 10;
    this.tCamX = this.device.x + this.device.cv.width / 2; this.clampCam();
  }

  /* ---------------- ввод ---------------- */

  private toWorld(cx: number, cy: number) {
    const r = this.canvas.getBoundingClientRect();
    const k = r.height / this.vh;
    return { x: (cx - r.left) / k + this.camX - this.viewW / 2, y: (cy - r.top) / k + this.viewTop };
  }

  private bindInput() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => { if (!this.interactive) return; this.dragging = true; this.moved = 0; this.lx = e.clientX; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', (e) => {
      this.mx = e.clientX; this.my = e.clientY;
      if (this.dragging) {
        const dx = e.clientX - this.lx; this.moved += Math.abs(dx); this.lx = e.clientX;
        const k = c.getBoundingClientRect().height / this.vh;
        this.tCamX -= (dx / k) * this.sensitivity; this.camX = this.tCamX; this.clampCam();
        if (this.moved > 4) c.classList.add('drag');
      } else this.pick();
    });
    c.addEventListener('pointerup', (e) => {
      c.classList.remove('drag');
      this.mx = e.clientX; this.my = e.clientY;
      if (this.dragging && this.moved < (MOBILE ? 14 : 6) && this.interactive) {
        const hit = this.pick();
        if (hit) {
          const p = this.toWorld(e.clientX, e.clientY);
          this.sparks = Array.from({ length: 6 }, (_, i) => {
            const a = i * Math.PI / 3;
            return { x: p.x, y: p.y, vx: Math.cos(a) * 13, vy: Math.sin(a) * 13, life: 0.35, max: 0.35 };
          });
        }
        if (hit === '__client') this.events.onClientClick?.();
        else if (hit) this.events.onItemClick?.(hit);
      }
      this.dragging = false;
    });
    c.addEventListener('pointerleave', () => { if (!this.dragging) this.setHover(null); });
  }

  private pick(): string | null {
    if (!this.interactive || !this.order) { this.setHover(null); return null; }
    const p = this.toWorld(this.mx, this.my);
    const slack = MOBILE ? 5 : 2;
    let id: string | null = null;
    for (const h of this.hits) if (h.on && p.x >= h.x - slack && p.x <= h.x + h.w + slack && p.y >= h.y - slack && p.y <= h.y + h.h + slack) id = h.id;
    if (!id && this.cl && Math.abs(p.x - this.cl.x) < 11 && p.y > FLOOR - 74 && p.y < FLOOR) id = '__client';
    this.setHover(id);
    return id;
  }

  private setHover(id: string | null) {
    if (this.hovered === id) return;
    this.hovered = id;
    this.canvas.classList.toggle('hover', !!id);
    this.events.onHover?.(id);
  }

  highlight(id: string | null) { this.setHover(id); }
  lookAtItem(id: string) {
    const h = this.hits.find((x) => x.id === id); if (!h) return;
    this.tCamX = h.x + h.w / 2; this.clampCam();
  }

  screenPos(id: string): { x: number; y: number } | null {
    let wx: number, wy: number;
    if (id === '__client') { if (!this.cl) return null; wx = this.cl.x; wy = FLOOR - 40; }
    else { const h = this.hits.find((x) => x.id === id); if (!h) return null; wx = h.x + h.w / 2; wy = h.y + h.h / 2; }
    const r = this.canvas.getBoundingClientRect(), k = r.height / this.vh;
    return { x: r.left + (wx - (this.camX - this.viewW / 2)) * k, y: r.top + (wy - this.viewTop) * k };
  }

  /* ---------------- кадр ---------------- */

  private frame(dt: number) {
    const b = this.b, t = this.now;
    this.camX += (this.tCamX - this.camX) * Math.min(1, dt * 7);
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.fillStyle = '#0e1013'; b.fillRect(0, 0, this.viewW, this.vh);
    if (!this.order) { this.blit(); return; }
    const L = this.look, W = L.w, top = FLOOR - L.h;
    const ox = Math.round(this.viewW / 2 - this.camX);
    const vt = this.viewTop;
    b.setTransform(1, 0, 0, 1, ox, -vt);

    // экстерьер и дом в разрезе
    drawExterior(b, L, -ox, vt, this.viewW, this.vh, t);
    drawBuilding(b, L, 0, vt, this.vh, t, this.locId);
    drawRoomShell(b, L, 0, t, this.locId);

    // окно (между точками A и B — на стене)
    const ww = Math.round(Math.min(64, W * 0.2)), wh = Math.round(Math.min(46, L.h * 0.42));
    const wx = Math.round(W * 0.27 - ww / 2), wy = top + Math.round(L.h * 0.16);
    drawWindow(b, L, wx, wy, ww, wh, t, this.locId, this.locId !== 'office');
    if (L.time !== 'night') sunbeam(b, wx, wy + wh, ww, wh, L.time === 'evening' ? '#ffb070' : '#fff4d6', L.time === 'evening' ? 0.16 : 0.1);

    // дверь
    this.door = Math.max(0, this.door - dt * 0.6);
    drawDoor(b, Math.round(W * ANCHORS.door) - 4, this.master && this.master.x < W * ANCHORS.master ? 1 : this.door);

    // мебель
    for (const p of this.lights) p.draw(b, p.x, t);
    for (const p of this.props) p.draw(b, p.x, t);

    // поверхности и предметы
    ANCHORS.slots.forEach((f, i) => drawSurface(b, L, Math.round(W * f), [0, 1, 2, 1][i]));
    for (const h of this.hits) {
      b.drawImage(h.cv, h.x, h.y);
      if (h.on && this.interactive) {
        // «заметил» — лёгкое мерцание, чтобы найти взглядом
        if (Math.sin(t * 3 + h.x) > 0.96) { b.fillStyle = 'rgba(255,246,201,.9)'; b.fillRect(h.x + h.w - 1, h.y - 1, 1, 1); }
        const inspected = this.order.inspected.includes(h.id);
        if (inspected) { b.fillStyle = '#4cff9a'; b.fillRect(h.x + Math.floor(h.w / 2), h.y - 4, 1, 2); }
      }
      if (this.hovered === h.id) {
        b.drawImage(outlineOf(h.cv), h.x - 1, h.y - 1);
        // Четыре уголка делают выбранный предмет заметным даже на светлом фоне.
        const gap = 3 + (Math.sin(t * 5) > 0.3 ? 1 : 0);
        const left = h.x - gap, right = h.x + h.w + gap - 1;
        const upper = h.y - gap, lower = h.y + h.h + gap - 1;
        b.fillStyle = '#fff1a8';
        for (const x of [left, right]) for (const y of [upper, lower]) {
          b.fillRect(x, y, 1, 3); b.fillRect(x === left ? x : x - 2, y, 3, 1);
        }
      }
    }

    // устройство
    const d = this.device!;
    const dev = deviceSprite(this.order.deviceId);
    if (!dev.wall && !dev.floor) drawDeviceTable(b, d.x + d.cv.width / 2, Math.max(30, d.cv.width + 10));
    const shake = this.mode === 'device' && this.order.stage === 'repair' ? Math.round(Math.sin(t * 40)) * (Math.sin(t * 3) > 0.7 ? 1 : 0) : 0;
    b.drawImage(d.cv, d.x + shake, d.y);
    if (!this.order.repaired && Math.floor(t * 1.6) % 2) rect(b, d.x + d.cv.width - 2, d.y + 1, 1, 1, '#ff3b30');
    if (this.order.repaired) { const k = (t * 1.5) % 1; b.fillStyle = `rgba(76,255,154,${1 - k})`; b.fillRect(d.x + d.cv.width / 2, d.y - 3 - k * 8, 1, 1); }
    if (this.order.stage === 'repair') for (let i = 0; i < 3; i++) { const k = (t * 2 + i / 3) % 1; b.fillStyle = `rgba(255,214,120,${1 - k})`; b.fillRect(d.x + 2 + ((i * 7 + Math.floor(t * 9)) % d.cv.width), d.y + d.cv.height / 2 - k * 6, 1, 1); }

    // люди
    const m = this.master!, cl = this.cl!;
    m.update(dt, t, this.mode === 'device' ? 'crouch' : this.mode === 'client' ? 'idle' : 'idle');
    if (this.mode === 'inspect' && m.pose === 'idle' && this.hovered && this.hovered !== '__client') {
      const h = this.hits.find((x) => x.id === this.hovered); if (h) m.facing = h.x > m.x ? 1 : -1;
    }
    if (this.mode === 'client') m.facing = 1;
    cl.update(dt, t, cl.talking ? (Math.sin(t * 0.9) > 0.3 ? 'talk' : 'idle') : 'idle');
    if (!cl.gone && cl.pose === 'idle') cl.facing = m.x < cl.x ? -1 : 1;
    // На ходу мастер несёт ящик; остановившись, ставит его рядом с ногой.
    const carrying = m.pose === 'walk';
    drawToolbox(b, Math.round(m.x) - (m.facing > 0 ? 18 : -6), carrying ? FLOOR - 15 + Math.floor(m.poseT * 8) % 2 : FLOOR);
    drawPerson(b, m.x, FLOOR, m.look, m.state(t, 1.3), true);
    if (cl.alpha > 0) {
      b.globalAlpha = cl.alpha;
      drawPerson(b, cl.x, FLOOR, cl.look, cl.state(t, 0));
      b.globalAlpha = 1;
      if (this.hovered === '__client') { b.fillStyle = '#fff6c9'; b.fillRect(Math.round(cl.x) - 1, FLOOR - 80 - Math.round(Math.sin(t * 4)), 3, 3); }
      if (cl.talking && cl.pose === 'talk') for (let i = 0; i < 3; i++) if (Math.floor(t * 3) % 3 >= i) rect(b, cl.x - 10 + i * 3, FLOOR - 82, 2, 2, '#fbfaf4');
    }

    // пылинки в свете
    for (const mo of this.motes) {
      mo.y -= dt * mo.v * 0.6; mo.x += Math.sin(t * 0.7 + mo.ph) * dt * 2;
      if (mo.y < top + 4) mo.y = FLOOR - 2;
      b.fillStyle = 'rgba(255,248,220,.35)'; b.fillRect(Math.round(mo.x), Math.round(mo.y), 1, 1);
    }

    // Короткий пиксельный отклик на выбор: он не закрывает карточку предмета.
    for (const s of this.sparks) {
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
      b.globalAlpha = Math.max(0, s.life / s.max);
      rect(b, Math.round(s.x), Math.round(s.y), 2, 2, '#ffe6a0');
    }
    b.globalAlpha = 1;
    this.sparks = this.sparks.filter((s) => s.life > 0);

    // свет: лампы, общая окраска, тени углов
    for (const p of this.lights) p.glow?.(b, p.x, t);
    for (const p of this.props) p.glow?.(b, p.x, t);
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.globalCompositeOperation = 'soft-light';
    b.fillStyle = L.tint; b.globalAlpha = L.tintA * 2; b.fillRect(0, 0, this.viewW, this.vh);
    b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
    const g = b.createRadialGradient(this.viewW / 2, this.vh * 0.55, this.vh * 0.4, this.viewW / 2, this.vh * 0.55, Math.max(this.viewW, this.vh) * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
    b.fillStyle = g; b.fillRect(0, 0, this.viewW, this.vh);
    this.blit();
  }

  private blit() {
    const c = this.c;
    c.imageSmoothingEnabled = false;
    c.drawImage(this.buf, 0, 0, this.viewW, this.vh, 0, 0, this.viewW * this.scale, this.vh * this.scale);
  }
}
