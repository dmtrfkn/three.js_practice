// Клиент: стилизованная фигура с выражением лица на текстуре.
// Внешность определяется сидом (имя + номер заказа) и локацией: телосложение, рост, возраст,
// причёска, растительность на лице, очки и одежда по социальному слою.
import * as THREE from 'three';
import { mat, umat, rbox, cyl, sphere } from './kit';
import type { Level } from '../core/params';

export interface Appearance {
  height: number;        // м
  build: 0 | 1 | 2;      // худой / обычный / плотный
  age: 0 | 1 | 2;        // молодой / средний / пожилой
  skin: string;
  hair: string;
  hairStyle: 'short' | 'buzz' | 'side' | 'curly' | 'bald' | 'long' | 'slick';
  facial: 'none' | 'stubble' | 'mustache' | 'beard';
  glasses: 'none' | 'round' | 'rect';
  outfit: 'hoodie' | 'tracksuit' | 'cardigan' | 'flannel' | 'tshirt' | 'turtleneck' | 'blazer' | 'shirt_tie' | 'polo';
  top: string; accent: string; pants: string; shoes: string;
  slippers: boolean;
  extra: 'none' | 'cap' | 'lanyard' | 'watch' | 'headphones';
}

function hash(str: string): number { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rnd(seed: number) { let s = seed || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pickR = <T,>(r: () => number, a: readonly T[]) => a[Math.floor(r() * a.length)];

const OUTFITS: Record<string, Appearance['outfit'][]> = {
  dorm: ['hoodie', 'hoodie', 'tshirt', 'tracksuit'],
  khr: ['cardigan', 'tracksuit', 'flannel', 'cardigan'],
  new: ['flannel', 'tshirt', 'hoodie', 'polo'],
  elite: ['turtleneck', 'blazer', 'polo', 'blazer'],
  office: ['shirt_tie', 'shirt_tie', 'blazer', 'polo'],
};
const PALETTES: Record<string, string[]> = {
  dorm: ['#3f5f8a', '#7a3b34', '#2f6b4a', '#5b616b', '#c9a24a'],
  khr: ['#7a5a3a', '#4a5a6a', '#6b3a4a', '#2f4f8f', '#8a7a5a'],
  new: ['#2f7dd6', '#d64d3b', '#4f7d3b', '#e6e2d6', '#2a2d33'],
  elite: ['#1b1d22', '#e8e2d6', '#2f3b36', '#3a2c22', '#1f2a3a'],
  office: ['#e6eaec', '#cfe0f2', '#f4f5f3', '#d9dde3', '#3e4a5a'],
};

export function appearanceFor(seedStr: string, locId: string): Appearance {
  const r = rnd(hash(seedStr));
  const age = pickR(r, [0, 0, 1, 1, 2] as const);
  const build = pickR(r, [0, 1, 1, 2] as const);
  const skin = pickR(r, ['#f0c4a2', '#e9b48f', '#d9a07a', '#c88b66', '#f3cdb0']);
  const hairPool = age === 2 ? ['#b9b6ac', '#d9d6cc', '#8a8580'] : ['#2a1f18', '#4a3326', '#6b4a2f', '#b9884e', '#8a3b1f'];
  const styles: Appearance['hairStyle'][] = age === 2 ? ['bald', 'short', 'slick', 'bald'] : locId === 'dorm' ? ['curly', 'long', 'buzz', 'side', 'short'] : locId === 'elite' || locId === 'office' ? ['slick', 'side', 'short', 'buzz'] : ['short', 'side', 'buzz', 'curly'];
  const outfit = pickR(r, OUTFITS[locId]);
  const pal = PALETTES[locId];
  return {
    height: 1.66 + r() * 0.22,
    build, age, skin,
    hair: pickR(r, hairPool),
    hairStyle: pickR(r, styles),
    facial: pickR(r, age === 0 ? ['none', 'none', 'stubble'] : ['none', 'stubble', 'mustache', 'beard']) as Appearance['facial'],
    glasses: pickR(r, ['none', 'none', 'round', 'rect']) as Appearance['glasses'],
    outfit,
    top: pickR(r, pal), accent: pickR(r, ['#a3294a', '#f1d04b', '#e6eaec', '#2f7dd6', '#1b1d22']),
    pants: pickR(r, locId === 'office' || locId === 'elite' ? ['#2a2d33', '#3e4a5a', '#4a4036'] : ['#36414f', '#2a2d33', '#4a5a6a', '#3a3a32']),
    shoes: pickR(r, locId === 'elite' ? ['#3a2418', '#1b1d22'] : ['#2a2622', '#e6eaec', '#5b616b']),
    slippers: (locId === 'dorm' || locId === 'khr') && r() < 0.6,
    extra: locId === 'office' ? 'lanyard' : locId === 'elite' ? 'watch' : locId === 'dorm' ? pickR(r, ['headphones', 'none', 'cap'] as const) : pickR(r, ['none', 'none', 'cap'] as const),
  };
}

/* ---------------- лицо ---------------- */

export function drawFace(ctx: CanvasRenderingContext2D, w: number, h: number, mood: Level, a: Appearance, opts: { blink?: boolean; clear?: boolean } = {}) {
  if (opts.clear) ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.52, s = Math.min(w, h);
  const dark = a.hairStyle === 'bald' ? '#5b4a3e' : a.hair;
  // румянец
  ctx.fillStyle = mood === 2 ? 'rgba(232,120,110,.45)' : 'rgba(220,130,110,.2)';
  for (const dx of [-0.22, 0.22]) { ctx.beginPath(); ctx.ellipse(cx + dx * s, cy + s * 0.1, s * 0.075, s * 0.05, 0, 0, Math.PI * 2); ctx.fill(); }
  // морщины
  if (a.age === 2) { ctx.strokeStyle = 'rgba(120,70,50,.35)'; ctx.lineWidth = s * 0.012; for (const dy of [0, 0.03]) { ctx.beginPath(); ctx.moveTo(cx - s * 0.14, cy - s * 0.27 + dy * s); ctx.quadraticCurveTo(cx, cy - s * 0.3 + dy * s, cx + s * 0.14, cy - s * 0.27 + dy * s); ctx.stroke(); } }
  // брови
  ctx.strokeStyle = dark; ctx.lineCap = 'round'; ctx.lineWidth = s * (a.age === 2 ? 0.045 : 0.035);
  const by = cy - s * 0.15;
  ctx.beginPath();
  if (mood === 0) { ctx.moveTo(cx - s * 0.24, by - s * 0.03); ctx.lineTo(cx - s * 0.08, by + s * 0.03); ctx.moveTo(cx + s * 0.24, by - s * 0.03); ctx.lineTo(cx + s * 0.08, by + s * 0.03); }
  else if (mood === 2) { ctx.moveTo(cx - s * 0.24, by + s * 0.01); ctx.quadraticCurveTo(cx - s * 0.16, by - s * 0.05, cx - s * 0.08, by); ctx.moveTo(cx + s * 0.24, by + s * 0.01); ctx.quadraticCurveTo(cx + s * 0.16, by - s * 0.05, cx + s * 0.08, by); }
  else { ctx.moveTo(cx - s * 0.24, by); ctx.lineTo(cx - s * 0.08, by); ctx.moveTo(cx + s * 0.24, by); ctx.lineTo(cx + s * 0.08, by); }
  ctx.stroke();
  // глаза
  const ey = cy - s * 0.05;
  ctx.fillStyle = '#2a2d33'; ctx.strokeStyle = '#2a2d33';
  for (const dx of [-0.16, 0.16]) {
    ctx.beginPath();
    if (opts.blink) { ctx.lineWidth = s * 0.02; ctx.moveTo(cx + dx * s - s * 0.035, ey); ctx.lineTo(cx + dx * s + s * 0.035, ey); ctx.stroke(); continue; }
    if (mood === 2) { ctx.lineWidth = s * 0.03; ctx.arc(cx + dx * s, ey + s * 0.015, s * 0.045, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    else { const ry = mood === 0 ? s * 0.026 : s * 0.042; ctx.ellipse(cx + dx * s, ey, s * 0.036, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + dx * s + s * 0.012, ey - s * 0.012, s * 0.01, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2a2d33'; }
  }
  // очки
  if (a.glasses !== 'none') {
    ctx.strokeStyle = '#2a2d33'; ctx.lineWidth = s * 0.022;
    for (const dx of [-0.16, 0.16]) { ctx.beginPath(); if (a.glasses === 'round') ctx.arc(cx + dx * s, ey, s * 0.075, 0, Math.PI * 2); else ctx.rect(cx + dx * s - s * 0.085, ey - s * 0.06, s * 0.17, s * 0.12); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - s * 0.085, ey); ctx.lineTo(cx + s * 0.085, ey); ctx.stroke();
  }
  // нос
  ctx.strokeStyle = 'rgba(150,90,60,.6)'; ctx.lineWidth = s * 0.028;
  ctx.beginPath(); ctx.moveTo(cx + s * 0.01, cy - s * 0.02); ctx.quadraticCurveTo(cx + s * 0.05, cy + s * 0.07, cx - s * 0.01, cy + s * 0.08); ctx.stroke();
  // борода / усы / щетина
  const my = cy + s * 0.2;
  if (a.facial === 'beard') { ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(cx - s * 0.3, cy + s * 0.02); ctx.quadraticCurveTo(cx - s * 0.28, cy + s * 0.42, cx, cy + s * 0.44); ctx.quadraticCurveTo(cx + s * 0.28, cy + s * 0.42, cx + s * 0.3, cy + s * 0.02); ctx.quadraticCurveTo(cx + s * 0.2, cy + s * 0.2, cx, cy + s * 0.16); ctx.quadraticCurveTo(cx - s * 0.2, cy + s * 0.2, cx - s * 0.3, cy + s * 0.02); ctx.fill(); }
  if (a.facial === 'stubble') { ctx.fillStyle = 'rgba(60,40,30,.13)'; ctx.beginPath(); ctx.ellipse(cx, my + s * 0.06, s * 0.24, s * 0.13, 0, 0, Math.PI); ctx.fill(); }
  if (a.facial === 'mustache' || a.facial === 'beard') { ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx - s * 0.06, my - s * 0.045, s * 0.07, s * 0.025, -0.2, 0, Math.PI * 2); ctx.ellipse(cx + s * 0.06, my - s * 0.045, s * 0.07, s * 0.025, 0.2, 0, Math.PI * 2); ctx.fill(); }
  // рот
  ctx.strokeStyle = a.facial === 'beard' ? '#f0d0c0' : '#7a3b34'; ctx.lineWidth = s * 0.03;
  ctx.beginPath();
  if (mood === 0) { ctx.moveTo(cx - s * 0.09, my + s * 0.02); ctx.quadraticCurveTo(cx, my - s * 0.03, cx + s * 0.09, my + s * 0.02); }
  else if (mood === 2) { ctx.moveTo(cx - s * 0.12, my - s * 0.02); ctx.quadraticCurveTo(cx, my + s * 0.09, cx + s * 0.12, my - s * 0.02); }
  else { ctx.moveTo(cx - s * 0.08, my); ctx.lineTo(cx + s * 0.08, my); }
  ctx.stroke();
}

/* ---------------- модель ---------------- */

export class ClientActor {
  group = new THREE.Group();
  private torso: THREE.Object3D;
  private head = new THREE.Group();
  private armL = new THREE.Group();
  private armR = new THREE.Group();
  private faceCanvas = document.createElement('canvas');
  private faceTex: THREE.CanvasTexture;
  private mood: Level = 1;
  private anim: { kind: 'none' | 'nod' | 'cross' | 'shake' | 'leave' | 'happy'; t: number } = { kind: 'none', t: 0 };
  private blinkUntil = 0;
  private nextBlink = 2;
  private headY: number;
  private leaving = false;
  readonly a: Appearance;

  constructor(a: Appearance) {
    this.a = a;
    const sc = a.height / 1.82;
    const wide = [0.86, 1, 1.18][a.build];
    const g = this.group;
    const topM = umat(a.top, a.outfit === 'blazer' || a.outfit === 'turtleneck' ? 0.7 : 0.88);
    const pantsM = mat(a.pants, 0.8), skinM = mat(a.skin, 0.7), hairM = mat(a.hair, 0.9);

    const body = new THREE.Group(); body.scale.set(wide, sc, wide); g.add(body);
    const torso = rbox(0.46, 0.6, 0.28, 0.12, topM); torso.position.y = 1.18; body.add(torso); this.torso = torso;
    if (a.build === 2) { const belly = sphere(0.21, topM, 14, 10); belly.scale.set(1.05, 0.85, 0.66); belly.position.set(0, 1.0, 0.04); body.add(belly); }
    // детали одежды
    if (a.outfit === 'hoodie') { const hood = rbox(0.36, 0.14, 0.18, 0.06, topM); hood.position.set(0, 1.48, -0.1); body.add(hood); const pocket = rbox(0.28, 0.12, 0.02, 0.03, mat(new THREE.Color(a.top).multiplyScalar(0.85).getStyle(), 0.9)); pocket.position.set(0, 1.0, 0.15); body.add(pocket); for (const dx of [-0.05, 0.05]) { const str = cyl(0.006, 0.006, 0.16, mat('#e6eaec'), 4); str.position.set(dx, 1.36, 0.15); body.add(str); } }
    if (a.outfit === 'tracksuit') for (const s of [-1, 1]) { const st = rbox(0.02, 0.55, 0.02, 0.005, mat('#f2f2ee', 0.6)); st.position.set(s * 0.235, 1.2, 0.0); body.add(st); }
    if (a.outfit === 'cardigan') { const shirt = rbox(0.14, 0.5, 0.02, 0.02, mat('#e6eaec', 0.9)); shirt.position.set(0, 1.2, 0.142); body.add(shirt); for (let i = 0; i < 4; i++) { const b = sphere(0.012, mat('#3a2c22', 0.4), 6, 4); b.position.set(0.09, 1.05 + i * 0.1, 0.15); body.add(b); } }
    if (a.outfit === 'flannel') { torso.material = new THREE.MeshStandardMaterial({ map: plaid(a.top), roughness: 0.9 }); }
    if (a.outfit === 'turtleneck') { const neck = cyl(0.1, 0.11, 0.1, topM, 14); neck.position.y = 1.5; body.add(neck); }
    if (a.outfit === 'blazer' || a.outfit === 'shirt_tie') {
      const shirt = rbox(0.16, 0.5, 0.02, 0.02, mat(a.outfit === 'blazer' ? '#f4f5f3' : '#ffffff', 0.7)); shirt.position.set(0, 1.22, 0.142); body.add(shirt);
      const tie = rbox(0.05, 0.36, 0.015, 0.01, mat(a.accent === '#e6eaec' ? '#a3294a' : a.accent, 0.5)); tie.position.set(0, 1.24, 0.152); body.add(tie);
      if (a.outfit === 'shirt_tie') torso.material = mat(a.top, 0.75);
    }
    if (a.extra === 'lanyard') { const card = rbox(0.07, 0.1, 0.006, 0.006, mat('#ffffff', 0.4)); card.position.set(0.05, 1.04, 0.16); body.add(card); const strap = rbox(0.015, 0.3, 0.006, 0.003, mat('#2f7dd6', 0.6)); strap.position.set(0.04, 1.24, 0.15); strap.rotation.z = -0.15; body.add(strap); }
    // ноги
    for (const dx of [-0.11, 0.11]) {
      const leg = rbox(0.17, 0.8, 0.2, 0.07, pantsM); leg.position.set(dx, 0.48, 0); body.add(leg);
      if (a.slippers) { const sl = rbox(0.17, 0.05, 0.28, 0.025, mat('#3d6d8a', 0.85)); sl.position.set(dx, 0.025, 0.04); body.add(sl); const sock = rbox(0.13, 0.07, 0.13, 0.04, mat('#e6eaec', 0.95)); sock.position.set(dx, 0.08, 0); body.add(sock); }
      else { const shoe = rbox(0.18, 0.08, 0.28, 0.04, mat(a.shoes, 0.6)); shoe.position.set(dx, 0.04, 0.04); body.add(shoe); }
    }
    // руки
    [this.armL, this.armR].forEach((arm, i) => {
      const s = i ? 1 : -1;
      const up = rbox(0.13, 0.5, 0.14, 0.06, torso.material as THREE.Material); up.position.y = -0.24; arm.add(up);
      const hand = sphere(0.065, skinM, 10, 8); hand.position.y = -0.53; arm.add(hand);
      if (a.extra === 'watch' && i === 0) { const w = cyl(0.068, 0.068, 0.03, mat('#c9a24a', 0.3, 0.85), 14); w.position.y = -0.46; arm.add(w); }
      arm.position.set(s * 0.3, 1.44, 0); arm.rotation.z = s * 0.08;
      body.add(arm);
    });
    // голова
    const neck = cyl(0.07, 0.08, 0.1, skinM, 10); neck.position.y = 1.52; body.add(neck);
    this.headY = 1.72;
    this.head.position.y = this.headY; body.add(this.head);
    const skull = sphere(0.2, skinM, 22, 16); skull.scale.set(1, 1.08, 0.98); this.head.add(skull);
    for (const dx of [-0.2, 0.2]) { const ear = sphere(0.045, skinM, 8, 6); ear.scale.set(0.5, 1, 0.8); ear.position.set(dx, 0, 0.01); this.head.add(ear); }
    this.addHair(hairM);
    if (a.extra === 'cap') { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.215, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), mat(a.accent, 0.8)); cap.position.y = 0.04; this.head.add(cap); const visor = rbox(0.24, 0.02, 0.16, 0.01, mat(a.accent, 0.8)); visor.position.set(0, 0.11, 0.2); visor.rotation.x = 0.15; this.head.add(visor); }
    if (a.extra === 'headphones') { const band = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.015, 6, 20, Math.PI), mat('#1b1d22', 0.4)); band.position.y = 0.0; this.head.add(band); band.rotation.z = 0; band.rotation.y = Math.PI / 2; band.rotation.set(0, 0, 0); band.position.set(0, 0.0, 0); const bandG = new THREE.Group(); bandG.add(band); band.rotation.z = 0; for (const dx of [-0.21, 0.21]) { const cup = cyl(0.06, 0.06, 0.04, mat('#1b1d22', 0.4), 14); cup.rotation.z = Math.PI / 2; cup.position.set(dx, -0.02, 0); this.head.add(cup); } band.rotation.set(0, 0, 0); this.head.add(bandG); }
    // лицо
    this.faceCanvas.width = this.faceCanvas.height = 256;
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas); this.faceTex.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.203, 24, 16, Math.PI * 0.18 + Math.PI, Math.PI * 0.64, Math.PI * 0.22, Math.PI * 0.56), new THREE.MeshStandardMaterial({ map: this.faceTex, transparent: true, roughness: 0.7 }));
    // сегмент сферы ориентирован в +Z
    face.rotation.y = Math.PI; face.scale.copy(skull.scale); this.head.add(face);
    g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    face.castShadow = false;
    this.redraw();
  }

  private addHair(m: THREE.Material) {
    const a = this.a;
    if (a.hairStyle === 'bald') { const fringe = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.035, 6, 20, Math.PI), m); fringe.rotation.set(Math.PI / 2, 0, Math.PI); fringe.position.set(0, -0.02, -0.02); this.head.add(fringe); return; }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.212, 20, 12, 0, Math.PI * 2, 0, Math.PI * (a.hairStyle === 'buzz' ? 0.42 : 0.5)), m);
    cap.scale.set(1.02, a.hairStyle === 'buzz' ? 1.0 : 1.06, 1.02); cap.rotation.x = 0.25; cap.position.set(0, 0.035, -0.02); this.head.add(cap);
    if (a.hairStyle === 'side' || a.hairStyle === 'slick') { const f = rbox(0.32, 0.07, 0.1, 0.035, m); f.position.set(0.03, 0.16, 0.14); f.rotation.z = a.hairStyle === 'slick' ? 0 : -0.18; f.rotation.x = a.hairStyle === 'slick' ? -0.4 : 0; this.head.add(f); }
    if (a.hairStyle === 'short') { const f = rbox(0.28, 0.06, 0.08, 0.03, m); f.position.set(0, 0.17, 0.14); this.head.add(f); }
    if (a.hairStyle === 'curly') for (let i = 0; i < 14; i++) { const t = (i / 14) * Math.PI * 2; const c = sphere(0.06, m, 8, 6); c.position.set(Math.sin(t) * 0.17, 0.14 + Math.cos(t * 2) * 0.03, Math.cos(t) * 0.15 - 0.02); this.head.add(c); }
    if (a.hairStyle === 'long') { const back = rbox(0.38, 0.32, 0.12, 0.06, m); back.position.set(0, -0.06, -0.14); this.head.add(back); for (const s of [-1, 1]) { const side = rbox(0.06, 0.26, 0.16, 0.03, m); side.position.set(s * 0.19, -0.02, 0.0); this.head.add(side); } }
  }

  private redraw(blink = false) {
    const ctx = this.faceCanvas.getContext('2d')!;
    drawFace(ctx, 256, 256, this.mood, this.a, { blink, clear: true });
    this.faceTex.needsUpdate = true;
  }

  setMood(m: Level) { if (m !== this.mood) { this.mood = m; this.redraw(); } }

  react(kind: 'nod' | 'cross' | 'shake' | 'leave' | 'happy') {
    this.anim = { kind, t: 0 };
    if (kind === 'leave') this.leaving = true;
  }

  get isGone() { return this.leaving && this.anim.t > 2.2; }

  update(dt: number, t: number, lookAt: THREE.Vector3) {
    const a = this.anim; a.t += dt;
    // дыхание
    this.torso.scale.y = 1 + Math.sin(t * 1.6) * 0.012;
    this.head.position.y = this.headY + Math.sin(t * 1.6) * 0.004;
    // взгляд на мастера
    if (!this.leaving) {
      const local = this.group.worldToLocal(lookAt.clone());
      const yaw = Math.atan2(local.x, local.z);
      this.head.rotation.y += (THREE.MathUtils.clamp(yaw, -0.6, 0.6) + Math.sin(t * 0.35) * 0.08 - this.head.rotation.y) * Math.min(1, dt * 3);
    }
    // моргание
    if (t > this.nextBlink) { this.blinkUntil = t + 0.12; this.nextBlink = t + 2.5 + ((t * 7.3) % 2.5); this.redraw(true); }
    else if (this.blinkUntil && t > this.blinkUntil) { this.blinkUntil = 0; this.redraw(false); }
    // реакции
    const k = a.kind, p = a.t;
    this.armL.rotation.x = 0; this.armR.rotation.x = 0; this.armL.rotation.z = -0.08; this.armR.rotation.z = 0.08; this.head.rotation.x = 0; this.head.rotation.z = 0;
    if (k === 'nod' && p < 1.2) this.head.rotation.x = Math.sin(p * 10) * 0.18 * (1 - p / 1.2);
    if (k === 'shake' && p < 1.2) this.head.rotation.y += Math.sin(p * 14) * 0.25 * (1 - p / 1.2);
    if (k === 'cross') { const q = Math.min(1, p * 3); this.armL.rotation.x = -1.2 * q; this.armR.rotation.x = -1.2 * q; this.armL.rotation.z = 0.7 * q; this.armR.rotation.z = -0.7 * q; this.head.rotation.z = 0.08 * q; }
    if (k === 'happy' && p < 1.5) { this.armR.rotation.x = -2.2 * Math.sin(Math.min(1, p * 2) * Math.PI / 2); this.head.rotation.z = Math.sin(p * 6) * 0.06; }
    if (k === 'leave') {
      const q = Math.min(1, p / 0.5);
      this.group.rotation.y = this.baseRot + Math.PI * 0.6 * q;
      if (p > 0.5) { const dir = new THREE.Vector3(Math.sin(this.group.rotation.y), 0, Math.cos(this.group.rotation.y)); this.group.position.addScaledVector(dir, dt * 1.1); this.group.position.y = Math.abs(Math.sin(p * 9)) * 0.02; }
    }
  }

  baseRot = 0;
  face(target: THREE.Vector3) {
    const d = target.clone().sub(this.group.position);
    this.baseRot = Math.atan2(d.x, d.z);
    this.group.rotation.y = this.baseRot;
  }
}

function plaid(base: string): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.fillStyle = base; x.fillRect(0, 0, 128, 128);
  x.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 4; i++) { x.fillRect(i * 32, 0, 12, 128); x.fillRect(0, i * 32, 128, 12); }
  x.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 4; i++) { x.fillRect(i * 32 + 20, 0, 3, 128); x.fillRect(0, i * 32 + 20, 128, 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  return t;
}

/** Портрет клиента для экрана разговора (2D). */
export function drawPortrait(canvas: HTMLCanvasElement, a: Appearance, mood: Level, wallLow: string, wallHigh: string) {
  const ctx = canvas.getContext('2d')!, w = canvas.width, h = canvas.height;
  ctx.fillStyle = wallHigh; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = wallLow; ctx.fillRect(0, h * 0.64, w, h * 0.36);
  const wide = [0.85, 1, 1.15][a.build];
  // плечи
  ctx.fillStyle = a.top;
  ctx.beginPath(); ctx.moveTo(w * (0.5 - 0.42 * wide), h); ctx.quadraticCurveTo(w * (0.5 - 0.38 * wide), h * 0.7, w * 0.5, h * 0.68); ctx.quadraticCurveTo(w * (0.5 + 0.38 * wide), h * 0.7, w * (0.5 + 0.42 * wide), h); ctx.fill();
  ctx.fillStyle = a.skin; ctx.fillRect(w * 0.42, h * 0.6, w * 0.16, h * 0.1);
  if (a.outfit === 'shirt_tie' || a.outfit === 'blazer') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(w * 0.4, h * 0.69); ctx.lineTo(w * 0.5, h * 0.82); ctx.lineTo(w * 0.6, h * 0.69); ctx.fill(); ctx.fillStyle = a.accent === '#e6eaec' ? '#a3294a' : a.accent; ctx.fillRect(w * 0.485, h * 0.72, w * 0.03, h * 0.28); }
  else if (a.outfit === 'turtleneck') { ctx.fillStyle = a.top; ctx.fillRect(w * 0.4, h * 0.6, w * 0.2, h * 0.1); }
  else if (a.outfit === 'hoodie') { ctx.strokeStyle = '#e6eaec'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * 0.46, h * 0.72); ctx.lineTo(w * 0.46, h * 0.86); ctx.moveTo(w * 0.54, h * 0.72); ctx.lineTo(w * 0.54, h * 0.86); ctx.stroke(); }
  else { ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.moveTo(w * 0.38, h * 0.69); ctx.lineTo(w * 0.5, h * 0.78); ctx.lineTo(w * 0.62, h * 0.69); ctx.fill(); }
  // голова
  ctx.fillStyle = a.skin;
  ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.38, w * 0.27, h * 0.23, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w * 0.23, h * 0.39, w * 0.04, h * 0.045, 0, 0, Math.PI * 2); ctx.ellipse(w * 0.77, h * 0.39, w * 0.04, h * 0.045, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(w * 0.25, h * 0.18); drawFace(ctx, w * 0.5, h * 0.42, mood, a); ctx.restore();
  // волосы
  ctx.fillStyle = a.hair;
  if (a.hairStyle === 'bald') { ctx.beginPath(); ctx.ellipse(w * 0.25, h * 0.33, w * 0.03, h * 0.07, 0, 0, Math.PI * 2); ctx.ellipse(w * 0.75, h * 0.33, w * 0.03, h * 0.07, 0, 0, Math.PI * 2); ctx.fill(); }
  else if (a.hairStyle === 'curly') { for (let i = 0; i < 11; i++) { ctx.beginPath(); ctx.arc(w * (0.24 + i * 0.052), h * (0.18 + Math.sin(i) * 0.02), w * 0.07, 0, Math.PI * 2); ctx.fill(); } }
  else {
    ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.2, w * 0.28, h * (a.hairStyle === 'buzz' ? 0.07 : 0.1), 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w * 0.22, h * 0.25); ctx.quadraticCurveTo(w * 0.3, h * 0.1, w * 0.55, h * 0.12); ctx.quadraticCurveTo(w * 0.72, h * 0.12, w * 0.79, h * 0.26); ctx.quadraticCurveTo(w * 0.62, h * (a.hairStyle === 'slick' ? 0.15 : 0.19), w * 0.45, h * 0.21); ctx.quadraticCurveTo(w * 0.32, h * 0.22, w * 0.22, h * 0.31); ctx.fill();
    if (a.hairStyle === 'long') { ctx.fillRect(w * 0.2, h * 0.24, w * 0.07, h * 0.3); ctx.fillRect(w * 0.73, h * 0.24, w * 0.07, h * 0.3); }
  }
  if (a.extra === 'cap') { ctx.fillStyle = a.accent; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.2, w * 0.29, h * 0.12, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillRect(w * 0.45, h * 0.18, w * 0.4, h * 0.04); }
  if (a.extra === 'headphones') { ctx.strokeStyle = '#1b1d22'; ctx.lineWidth = w * 0.04; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.36, w * 0.29, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.fillStyle = '#1b1d22'; ctx.fillRect(w * 0.18, h * 0.32, w * 0.08, h * 0.12); ctx.fillRect(w * 0.74, h * 0.32, w * 0.08, h * 0.12); }
}
