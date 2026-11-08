// Оболочка комнаты, свет и неинтерактивный декор 10 заготовок (2 на локацию).
// Система координат комнаты: камера (0; 1,6; 0,4) смотрит в +Z; экранное «вправо» = −X.
import * as THREE from 'three';
import { mat, umat, rbox, cyl, sphere, at, canvasTex, plane, shadowBlob, noteTex, COLORS } from './kit';

export interface Dims { W: number; D: number; H: number; zFront: number; zBack: number; XL: number; XR: number; s: number }
/** Размеры комнат по локациям (ширина × глубина × высота, м). Общежитие тесное, хрущёвка с низким потолком,
 *  элитный ЖК и офис — просторные и высокие. Камера всегда в 1,0 м от передней стены на высоте 1,6 м. */
const SIZES: Record<string, [number, number, number]> = {
  dorm: [4.6, 3.9, 2.6], khr: [5.2, 4.3, 2.5], new: [6.5, 5.0, 2.8], elite: [9.2, 7.0, 3.7], office: [10.0, 7.6, 3.2],
};
export function dimsFor(locId: string): Dims {
  const [W, D, H] = SIZES[locId];
  const zFront = -0.6;
  return { W, D, H, zFront, zBack: zFront + D, XL: W / 2, XR: -W / 2, s: W / 6.5 };
}
/** Игровые точки (ГДД «Генерация комнаты»), подобранные под размер каждой комнаты. Ось X зеркальна ГДД. */
const ANCHORS: Record<string, { device: [number, number]; client: [number, number]; slots: [number, number][]; tableW: number }> = {
  dorm:   { device: [0, 2.8], client: [-1.5, 2.55], slots: [[1.7, 1.75], [0.65, 2.0], [-0.65, 2.0], [-1.7, 1.75]], tableW: 0.9 },
  khr:    { device: [0, 3.15], client: [-1.8, 2.95], slots: [[2.0, 1.9], [0.75, 2.3], [-0.75, 2.3], [-2.0, 1.9]], tableW: 0.9 },
  new:    { device: [0, 3.5], client: [-2.2, 3.6], slots: [[2.4, 2.4], [0.8, 3.0], [-0.8, 3.0], [-2.4, 2.4]], tableW: 1.2 },
  elite:  { device: [0, 5.3], client: [-2.6, 5.0], slots: [[2.9, 3.0], [1.0, 3.8], [-1.0, 3.8], [-2.9, 3.0]], tableW: 1.4 },
  office: { device: [0, 5.5], client: [-2.8, 5.2], slots: [[3.0, 3.1], [1.0, 3.9], [-1.0, 3.9], [-3.0, 3.1]], tableW: 1.4 },
};
export function anchors(locId: string) {
  const a = ANCHORS[locId];
  return {
    camera: new THREE.Vector3(0, 1.6, 0.4),
    device: new THREE.Vector3(a.device[0], 0, a.device[1]),
    client: new THREE.Vector3(a.client[0], 0, a.client[1]),
    slots: a.slots.map(([x, z]) => new THREE.Vector3(x, 1.1, z)),
    tableW: a.tableW,
  };
}

// размеры текущей комнаты для функций декора
let W = 6.5, H = 3, zBack = 4.4, XL = 3.25, XR = -3.25;
function useDims(d: Dims) { ({ W, H, zBack, XL, XR } = d); }

export interface Look {
  wallLow: string; wallHigh: string; split: number; wallTex?: 'flowers' | 'stone' | 'plain' | 'stripe';
  floor: [string, string]; floorKind: 'plank' | 'tile' | 'carpet';
  ceil: string; baseboard: string;
  hemiSky: string; hemiGround: string; hemiI: number;
  key: string; keyI: number; ceilingLight: string; ceilingI: number; lamp: string; lampI: number;
  exposure: number; view: 'dorm' | 'khr' | 'new' | 'elite' | 'office'; window: 'small' | 'big' | 'panorama';
  surface: string; surfaceLeg: string; fog: string;
}

export const LOOKS: Record<string, Look> = {
  dorm: { wallLow: '#5e8c6a', wallHigh: '#d9d5c6', split: 1.25, floor: ['#b98756', '#a3743f'], floorKind: 'plank', ceil: '#e9e7df', baseboard: '#6b4b32',
    hemiSky: '#bcd3f0', hemiGround: '#4a4034', hemiI: 0.42, key: '#ffbf80', keyI: 1.25, ceilingLight: '#dff1ff', ceilingI: 0.9, lamp: '#ffa552', lampI: 1.6,
    exposure: 0.95, view: 'dorm', window: 'small', surface: '#a7825a', surfaceLeg: '#6e5238', fog: '#2b2a26' },
  khr: { wallLow: '#8b6a4f', wallHigh: '#d8c39c', split: 0.95, wallTex: 'flowers', floor: ['#7a4e2f', '#6a4127'], floorKind: 'plank', ceil: '#efe6d6', baseboard: '#4a2f1e',
    hemiSky: '#ffe2b0', hemiGround: '#5a3a22', hemiI: 0.38, key: '#ffc27a', keyI: 1.0, ceilingLight: '#ffd89a', ceilingI: 0.9, lamp: '#ff9f45', lampI: 1.8,
    exposure: 0.95, view: 'khr', window: 'small', surface: '#7a4e2f', surfaceLeg: '#4a2f1e', fog: '#2b2118' },
  new: { wallLow: '#e4e6e5', wallHigh: '#eef0ef', split: 0.08, wallTex: 'plain', floor: ['#d0b48d', '#c3a57c'], floorKind: 'plank', ceil: '#f5f6f5', baseboard: '#f1f1ec',
    hemiSky: '#f2f6ff', hemiGround: '#b8ad9e', hemiI: 0.7, key: '#ffffff', keyI: 1.25, ceilingLight: '#fff6e8', ceilingI: 0.9, lamp: '#fff1d6', lampI: 0.6,
    exposure: 0.98, view: 'new', window: 'big', surface: '#d7c3a2', surfaceLeg: '#b9a27e', fog: '#4a4a48' },
  elite: { wallLow: '#4a5a52', wallHigh: '#66756d', split: 0.08, wallTex: 'stone', floor: ['#3a2c22', '#2e231b'], floorKind: 'plank', ceil: '#4a504c', baseboard: '#c9a24a',
    hemiSky: '#c8d4e2', hemiGround: '#7a6454', hemiI: 1.0, key: '#ffa25e', keyI: 1.8, ceilingLight: '#ffd2a0', ceilingI: 2.0, lamp: '#ffb067', lampI: 2.4,
    exposure: 1.35, view: 'elite', window: 'panorama', surface: '#2a2522', surfaceLeg: '#c9a24a', fog: '#141816' },
  office: { wallLow: '#9aa7b4', wallHigh: '#dfe5ea', split: 1.0, wallTex: 'plain', floor: ['#4f5d6e', '#465364'], floorKind: 'carpet', ceil: '#f0f3f6', baseboard: '#5b6672',
    hemiSky: '#dbe9ff', hemiGround: '#8a96a6', hemiI: 0.75, key: '#dfefff', keyI: 1.0, ceilingLight: '#eaf3ff', ceilingI: 1.4, lamp: '#fff4dc', lampI: 0.5,
    exposure: 1.0, view: 'office', window: 'panorama', surface: '#c9ced4', surfaceLeg: '#8a939d', fog: '#2a3038' },
};

/* ---------------- текстуры ---------------- */

function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

function floorTexture(L: Look): THREE.Texture {
  const r = rng(7);
  const t = canvasTex(512, 512, (c, w, h) => {
    const [a, b] = L.floor;
    c.fillStyle = a; c.fillRect(0, 0, w, h);
    if (L.floorKind === 'carpet') {
      for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) { c.fillStyle = ((x + y) / 128) % 2 ? a : b; c.fillRect(x, y, 128, 128); }
      for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(255,255,255,${r() * 0.05})`; c.fillRect(r() * w, r() * h, 2, 2); }
      c.strokeStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 128, 0); c.lineTo(i * 128, h); c.stroke(); c.beginPath(); c.moveTo(0, i * 128); c.lineTo(w, i * 128); c.stroke(); }
      return;
    }
    const pw = 128, ph = 24;
    for (let y = 0; y < h; y += ph) {
      const off = ((y / ph) % 3) * 43;
      for (let x = -pw; x < w; x += pw) { c.fillStyle = r() < 0.5 ? a : b; c.globalAlpha = 0.6 + r() * 0.4; c.fillRect(x + off + 1, y + 1, pw - 2, ph - 2); }
    }
    c.globalAlpha = 1; c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1.5;
    for (let y = 0; y < h; y += ph) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(0,0,0,${r() * 0.06})`; c.fillRect(r() * w, r() * h, r() * 22, 1); }
    for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(255,255,255,.05)'; c.beginPath(); c.ellipse(r() * w, r() * h, 20 + r() * 40, 6 + r() * 10, r() * 3, 0, Math.PI * 2); c.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2.4);
  return t;
}

function wallTexture(L: Look): THREE.Texture | null {
  if (L.wallTex === 'flowers') {
    const r = rng(3);
    const t = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = L.wallHigh; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(120,70,40,.10)'; for (let x = 0; x < w; x += 32) c.fillRect(x, 0, 12, h);
      for (let i = 0; i < 10; i++) {
        const x = (i % 4) * 64 + 32 + ((Math.floor(i / 4) % 2) * 32), y = Math.floor(i / 4) * 86 + 40;
        c.fillStyle = 'rgba(160,60,50,.35)'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + Math.cos(k * 1.26) * 9, y + Math.sin(k * 1.26) * 9, 7, 5, k, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = 'rgba(80,110,60,.35)'; c.beginPath(); c.ellipse(x + 14, y + 14, 9, 4, 0.7, 0, Math.PI * 2); c.fill();
      }
      for (let i = 0; i < 800; i++) { c.fillStyle = `rgba(0,0,0,${r() * 0.03})`; c.fillRect(r() * w, r() * h, 2, 2); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 2);
    return t;
  }
  if (L.wallTex === 'stone') {
    const r = rng(5);
    const t = canvasTex(512, 256, (c, w, h) => {
      c.fillStyle = L.wallHigh; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`; c.lineWidth = 1 + r() * 2; c.beginPath(); let x = r() * w, y = r() * h; c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.3) * 80; y += (r() - 0.5) * 30; c.lineTo(x, y); } c.stroke(); }
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; for (let x = 0; x <= w; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1.5);
    return t;
  }
  return null;
}

export function windowView(kind: Look['view']): THREE.Texture {
  const r = rng(11);
  return canvasTex(768, 512, (c, w, h) => {
    const sky = { dorm: ['#f0a868', '#7d6aa1'], khr: ['#f7c27a', '#8a7aa6'], new: ['#cfe2f4', '#9cc2e8'], elite: ['#e1834a', '#1c2540'], office: ['#d6e6f6', '#9fb6d1'] }[kind];
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky[1]); g.addColorStop(1, sky[0]); c.fillStyle = g; c.fillRect(0, 0, w, h);
    if (kind === 'elite') {
      for (let i = 0; i < 40; i++) { const bw = 20 + r() * 40, bh = 120 + r() * 340, x = i * 20 - 10; c.fillStyle = '#141a2b'; c.fillRect(x, h - bh, bw, bh); for (let k = 0; k < 40; k++) { c.fillStyle = r() < 0.5 ? '#ffcf7a' : '#2a3350'; c.fillRect(x + 3 + r() * bw * 0.8, h - bh + r() * bh, 3, 4); } }
      c.fillStyle = 'rgba(255,190,120,.25)'; c.fillRect(0, h * 0.55, w, h * 0.1);
      return;
    }
    if (kind === 'new') {
      c.fillStyle = '#c7cfd8'; for (let i = 0; i < 7; i++) c.fillRect(30 + i * 110, h - 320 + (i % 3) * 30, 80, 340);
      c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 7; i++) for (let y = 0; y < 12; y++) c.fillRect(38 + i * 110, h - 300 + (i % 3) * 30 + y * 26, 64, 10);
      c.strokeStyle = '#e3a33a'; c.lineWidth = 6; c.beginPath(); c.moveTo(560, 40); c.lineTo(560, h); c.moveTo(380, 70); c.lineTo(720, 70); c.moveTo(690, 70); c.lineTo(690, 160); c.stroke();
      return;
    }
    if (kind === 'office') {
      for (let i = 0; i < 6; i++) { c.fillStyle = '#8aa2bf'; c.fillRect(i * 140 - 20, h - 300 - (i % 2) * 60, 120, 400); c.fillStyle = 'rgba(255,255,255,.35)'; for (let y = 0; y < 18; y++) c.fillRect(i * 140 - 14, h - 290 - (i % 2) * 60 + y * 18, 108, 8); }
      return;
    }
    c.fillStyle = kind === 'dorm' ? '#c9b8a6' : '#b7a891'; c.fillRect(60, 120, 660, 420);
    for (let y = 0; y < 7; y++) for (let x = 0; x < 12; x++) { const lit = r() < 0.35; c.fillStyle = lit ? '#ffd27a' : '#5b5f70'; c.fillRect(84 + x * 53, 140 + y * 52, 28, 32); if (r() < 0.2) { c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(84 + x * 53, 140 + y * 52 + 22, 28, 3); } }
    c.fillStyle = '#3f4a3a'; c.beginPath(); c.ellipse(140, 420, 150, 140, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2e2a24'; c.fillRect(132, 420, 14, 100);
    if (kind === 'khr') { c.strokeStyle = '#2a2d33'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 60); c.quadraticCurveTo(400, 110, w, 50); c.stroke(); }
  });
}

/* ---------------- оболочка ---------------- */

export interface Shell {
  root: THREE.Group;
  lights: { hemi: THREE.HemisphereLight; key: THREE.DirectionalLight; ceiling: THREE.PointLight; lamp: THREE.PointLight };
  flicker: THREE.MeshStandardMaterial | null;
}

export function buildShell(locId: string): Shell {
  const L = LOOKS[locId];
  const d = dimsFor(locId); useDims(d); const ROOM = { D: d.D, zFront: d.zFront };
  const root = new THREE.Group();
  const low = umat(L.wallLow, 0.9), highTex = wallTexture(L);
  const high = new THREE.MeshStandardMaterial({ color: highTex ? '#ffffff' : L.wallHigh, map: highTex, roughness: 0.95 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture(L), roughness: L.floorKind === 'carpet' ? 1 : 0.7 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, ROOM.D), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, ROOM.D / 2 - 0.6); floor.receiveShadow = true; root.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, ROOM.D), umat(L.ceil, 0.95, 0, { emissive: new THREE.Color(L.ceil), emissiveIntensity: 0.22 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, ROOM.D / 2 - 0.6); root.add(ceil);

  const wall = (len: number, rotY: number, x: number, z: number) => {
    const lowH = L.split;
    const lo = new THREE.Mesh(new THREE.PlaneGeometry(len, lowH), low); lo.position.set(x, lowH / 2, z); lo.rotation.y = rotY; lo.receiveShadow = true;
    const hi = new THREE.Mesh(new THREE.PlaneGeometry(len, H - lowH), high); hi.position.set(x, lowH + (H - lowH) / 2, z); hi.rotation.y = rotY; hi.receiveShadow = true;
    root.add(lo, hi);
    if (lowH > 0.2) { const strip = rbox(len, 0.035, 0.02, 0.008, mat(new THREE.Color(L.wallLow).multiplyScalar(0.7).getStyle(), 0.8)); strip.position.set(x, lowH, z); strip.rotation.y = rotY; root.add(strip); }
  };
  wall(W, Math.PI, 0, zBack);
  wall(W, 0, 0, ROOM.zFront);
  wall(ROOM.D, -Math.PI / 2, XL, ROOM.D / 2 - 0.6);
  wall(ROOM.D, Math.PI / 2, XR, ROOM.D / 2 - 0.6);
  const bb = mat(L.baseboard, 0.6);
  for (const [l, x, z, r] of [[W, 0, zBack - 0.02, 0], [ROOM.D, XL - 0.02, ROOM.D / 2 - 0.6, Math.PI / 2], [ROOM.D, XR + 0.02, ROOM.D / 2 - 0.6, Math.PI / 2]] as const) {
    const b = rbox(l, 0.09, 0.03, 0.01, bb); at(b, x, 0.045, z, r); root.add(b);
  }

  // окно на левой (экранной) стене
  const winW = L.window === 'panorama' ? Math.min(d.D - 1.2, 5.0) : L.window === 'big' ? 2.4 : 1.3;
  const winH = L.window === 'panorama' ? H - 0.5 : L.window === 'big' ? 1.6 : 1.1;
  const winY = L.window === 'panorama' ? Math.min(1.75, H / 2 + 0.05) : Math.min(1.8, H - 0.85), winZ = d.zFront + d.D * 0.45;
  const view = plane(winW, winH, windowView(L.view), { emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.9, roughness: 1 });
  (view.material as THREE.MeshStandardMaterial).emissiveMap = (view.material as THREE.MeshStandardMaterial).map;
  view.position.set(XL - 0.012, winY, winZ); view.rotation.y = -Math.PI / 2; root.add(view);
  const frameMat = mat(locId === 'elite' ? '#1b1d22' : '#f1f1ec', 0.5);
  const fz = winW / 2 + 0.04, fy = winH / 2 + 0.04;
  for (const [dz, dy, w, h] of [[0, fy, winW + 0.15, 0.07], [0, -fy, winW + 0.15, 0.07], [fz, 0, 0.07, winH + 0.1], [-fz, 0, 0.07, winH + 0.1], [0, 0, 0.05, winH]] as const) {
    const f = rbox(0.06, h, w, 0.015, frameMat); at(f, XL - 0.04, winY + dy, winZ + dz); root.add(f);
  }
  if (L.window !== 'panorama') {
    const sill = rbox(0.28, 0.05, winW + 0.3, 0.02, mat('#f1f1ec', 0.5)); at(sill, XL - 0.14, winY - winH / 2 - 0.07, winZ); root.add(sill);
    // батарея
    const rad = mat(locId === 'dorm' || locId === 'khr' ? '#e9e9e2' : '#f4f5f3', 0.55);
    const n = locId === 'dorm' || locId === 'khr' ? 9 : 1;
    if (n > 1) for (let i = 0; i < n; i++) { const fin = rbox(0.09, 0.55, 0.08, 0.02, rad); at(fin, XL - 0.12, 0.72, winZ - 0.4 + i * 0.1); root.add(fin); }
    else { const panel = rbox(0.08, 0.5, 1.2, 0.02, rad); at(panel, XL - 0.1, 0.55, winZ); root.add(panel); }
    // тюль / шторы
    const curtain = mat(locId === 'khr' ? '#c98a5a' : locId === 'dorm' ? '#8fa7b8' : '#e8e6dd', 0.95);
    for (const s of [-1, 1]) { const cur = rbox(0.05, winH + 0.5, 0.32, 0.02, curtain); at(cur, XL - 0.1, winY + 0.05, winZ + s * (winW / 2 + 0.2)); root.add(cur); }
  }

  // свет
  const hemi = new THREE.HemisphereLight(L.hemiSky, L.hemiGround, L.hemiI);
  const key = new THREE.DirectionalLight(L.key, L.keyI);
  key.position.set(XL + 3.5, H + 0.8, winZ - 0.3); key.target.position.set(-0.5, 0.6, zBack - 1.4);
  key.castShadow = true; const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches; key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -d.D, right: d.D, top: H + 1, bottom: -2, near: 0.5, far: W + 12 });
  key.shadow.camera.updateProjectionMatrix();
  const ceiling = new THREE.PointLight(L.ceilingLight, L.ceilingI, Math.max(9, d.D * 2), 1.4); ceiling.position.set(0, H - 0.3, d.zFront + d.D * 0.55);
  const lamp = new THREE.PointLight(L.lamp, L.lampI, 3.8, 1.6); lamp.position.set(Math.min(XL - 0.7, 2.5), 1.5, zBack - 1.9);
  const rim = new THREE.DirectionalLight('#9fb8ff', 0.22); rim.position.set(-3, H, zBack + 1);
  root.add(hemi, key, key.target, ceiling, lamp, rim);
  if (W > 7) for (const fx of [-W * 0.3, W * 0.3]) { const f = new THREE.PointLight(L.ceilingLight, L.ceilingI * 0.7, d.D * 1.6, 1.3); f.position.set(fx, H - 0.4, d.zFront + d.D * 0.6); root.add(f); }

  // потолочный светильник по локации
  let flicker: THREE.MeshStandardMaterial | null = null;
  if (locId === 'dorm' || locId === 'office') {
    const fl = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color(L.ceilingLight), emissiveIntensity: 1.4 });
    const zc = d.zFront + d.D * 0.55;
    if (locId === 'dorm') { const h = rbox(1.3, 0.06, 0.22, 0.02, mat('#f2f2ee', 0.6)); at(h, 0, H - 0.04, zc); root.add(h); const tube = cyl(0.025, 0.025, 1.18, fl, 10); tube.rotation.z = Math.PI / 2; at(tube, 0, H - 0.1, zc); tube.castShadow = false; root.add(tube); flicker = fl; }
    else for (const [x, z] of [[-3, 1.6], [0, 1.6], [3, 1.6], [-3, 4.4], [0, 4.4], [3, 4.4]]) { const p = rbox(0.6, 0.03, 0.6, 0.01, fl); at(p, x, H - 0.02, z); p.castShadow = false; root.add(p); }
  } else if (locId === 'khr') {
    const ch = new THREE.Group(); const rodM = mat('#c9a24a', 0.3, 0.8);
    const rod = cyl(0.01, 0.01, 0.4, rodM, 6); rod.position.y = -0.2; ch.add(rod);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const sh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#f7e7c4', emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.8, side: THREE.DoubleSide })); sh.position.set(Math.sin(a) * 0.22, -0.42, Math.cos(a) * 0.22); sh.rotation.x = Math.PI; ch.add(sh); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.008, 6, 30), rodM); ring.rotation.x = Math.PI / 2; ring.position.y = -0.38; ch.add(ring);
    at(ch, 0, H, d.zFront + d.D * 0.55); root.add(ch);
  } else if (locId === 'new') {
    const zc2 = d.zFront + d.D * 0.55; const wire = cyl(0.004, 0.004, 0.6, mat('#2a2d33'), 4); at(wire, 0, H - 0.3, zc2); root.add(wire);
    const bulb = sphere(0.05, new THREE.MeshStandardMaterial({ color: '#fff', emissive: new THREE.Color('#fff1d6'), emissiveIntensity: 2 }), 12, 10); at(bulb, 0, H - 0.64, zc2); root.add(bulb);
  } else {
    for (const x of [-3, -1.5, 0, 1.5, 3]) for (const z of [1.5, 4.0]) { const spot = cyl(0.05, 0.05, 0.02, new THREE.MeshStandardMaterial({ color: '#fff', emissive: new THREE.Color('#ffcf9a'), emissiveIntensity: 1.5 }), 16); at(spot, x, H - 0.01, z); root.add(spot); }
    // LED-подсветка по периметру потолка
    const cove = new THREE.MeshStandardMaterial({ color: '#2a2522', emissive: new THREE.Color('#ffb066'), emissiveIntensity: 1.6 });
    const cb = rbox(W - 0.2, 0.03, 0.05, 0.01, cove); cb.castShadow = false; at(cb, 0, H - 0.12, zBack - 0.06); root.add(cb);
    for (const sx of [XL - 0.06, XR + 0.06]) { const cs = rbox(0.05, 0.03, d.D - 0.2, 0.01, cove); cs.castShadow = false; at(cs, sx, H - 0.12, d.zFront + d.D / 2); root.add(cs); }
    const ceilGlow = new THREE.PointLight('#ffb066', 0.8, d.D * 1.5, 1.2); ceilGlow.position.set(0, H - 0.2, zBack - 1.5); root.add(ceilGlow);
  }
  return { root, lights: { hemi, key, ceiling, lamp }, flicker };
}

/* ---------------- общие детали декора ---------------- */

function wallSheet(root: THREE.Group, tex: THREE.Texture, w: number, h: number, x: number, y: number, z: number, side: 'back' | 'left' | 'right' = 'back', transparent = false) {
  const p = plane(w, h, tex, transparent ? { transparent: true, depthWrite: false } : {});
  if (side === 'back') at(p, x, y, zBack - 0.006, Math.PI);
  else if (side === 'left') { p.position.set(XL - 0.006, y, z); p.rotation.y = -Math.PI / 2; }
  else { p.position.set(XR + 0.006, y, z); p.rotation.y = Math.PI / 2; }
  root.add(p);
  return p;
}

function blob(root: THREE.Group, x: number, z: number, w: number, d: number, op = 0.5) { const b = shadowBlob(w, d, op); b.position.set(x, 0.004, z); root.add(b); }

function cabinetRow(root: THREE.Group, x0: number, n: number, color: string, doorColor: string, top: string, upper = true) {
  const wood = mat(color, 0.75), door = mat(doorColor, 0.7), metalM = mat('#c9ccd0', 0.35, 0.65);
  for (let i = 0; i < n; i++) {
    const x = x0 - i * 0.64;
    const cab = rbox(0.62, 0.82, 0.58, 0.02, wood); at(cab, x, 0.41, zBack - 0.31); root.add(cab);
    const d = rbox(0.56, 0.72, 0.02, 0.01, door); at(d, x, 0.43, zBack - 0.6); root.add(d);
    const h = rbox(0.12, 0.02, 0.03, 0.008, metalM); at(h, x, 0.7, zBack - 0.62); root.add(h);
    if (upper) { const uc = rbox(0.62, 0.62, 0.34, 0.02, wood); at(uc, x, 1.95, zBack - 0.17); root.add(uc); const ud = rbox(0.56, 0.54, 0.02, 0.01, door); at(ud, x, 1.95, zBack - 0.35); root.add(ud); }
  }
  const tp = rbox(n * 0.64 + 0.04, 0.05, 0.64, 0.015, mat(top, 0.5)); at(tp, x0 - (n - 1) * 0.32, 0.845, zBack - 0.32); root.add(tp);
  blob(root, x0 - (n - 1) * 0.32, zBack - 0.4, n * 0.7, 0.9, 0.45);
}

function stool(root: THREE.Group, x: number, z: number, seatColor: string) {
  const g = new THREE.Group(); const metalM = mat('#c9ccd0', 0.35, 0.65);
  const seat = cyl(0.17, 0.17, 0.04, mat(seatColor, 0.6), 20); seat.position.y = 0.48; g.add(seat);
  for (const [dx, dz] of [[0.1, 0.1], [-0.1, 0.1], [0.1, -0.1], [-0.1, -0.1]]) { const l = cyl(0.014, 0.014, 0.47, metalM, 6); l.position.set(dx, 0.235, dz); g.add(l); }
  at(g, x, 0, z); root.add(g); blob(root, x, z, 0.5, 0.5, 0.4);
}

function fridgeOld(root: THREE.Group, x: number, z: number, ry = Math.PI) {
  const g = new THREE.Group();
  const body = rbox(0.58, 1.42, 0.6, 0.06, mat('#eceae2', 0.45)); body.position.y = 0.71; g.add(body);
  const line = rbox(0.585, 0.012, 0.02, 0.004, mat('#b9b6ac', 0.6)); line.position.set(0, 1.05, 0.3); g.add(line);
  const handle = rbox(0.03, 0.26, 0.04, 0.012, mat('#c9ccd0', 0.35, 0.65)); handle.position.set(-0.22, 1.2, 0.32); g.add(handle);
  const badge = plane(0.16, 0.04, canvasTex(256, 64, (c) => { c.fillStyle = '#c9ccd0'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#2a2d33'; c.font = 'italic 800 40px Nunito'; c.fillText('Полюс-2', 30, 46); }), { metalness: 0.6, roughness: 0.3 });
  badge.position.set(0.12, 1.32, 0.302); g.add(badge);
  ['#a3294a', '#f1d04b', '#1e3c8c', '#2f7d4f'].forEach((cl, i) => { const m = rbox(0.05, 0.04, 0.012, 0.008, mat(cl, 0.4)); m.position.set(0.16 - i * 0.09, 0.9 - (i % 2) * 0.08, 0.305); g.add(m); });
  const note = plane(0.15, 0.19, noteTex(['не трогать!', 'это моё', '— Рома'], { bg: '#f6f4ec', size: 30, w: 160, h: 200, lineH: 40, pad: 10 }));
  note.position.set(-0.02, 0.72, 0.307); note.rotation.z = -0.08; g.add(note);
  g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = m.receiveShadow = true; } });
  at(g, x, 0, z, ry); root.add(g); blob(root, x, z, 0.9, 0.9, 0.55);
}

function clock(root: THREE.Group, x: number, y: number, color: string, label: string): THREE.Group {
  const face = canvasTex(256, 256, (c) => { c.fillStyle = '#fbfaf4'; c.beginPath(); c.arc(128, 128, 124, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2a2d33'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 8, 6, 16); } c.font = '700 22px Nunito'; c.textAlign = 'center'; c.fillText(label, 128, 90); });
  const body = cyl(0.17, 0.17, 0.04, mat(color, 0.5), 28); body.rotation.x = Math.PI / 2; at(body, x, y, zBack - 0.03); root.add(body);
  const p = new THREE.Mesh(new THREE.CircleGeometry(0.15, 28), new THREE.MeshStandardMaterial({ map: face })); at(p, x, y, zBack - 0.052, Math.PI); root.add(p);
  const hands = new THREE.Group(); const hm = rbox(0.008, 0.12, 0.004, 0.002, mat('#2a2d33')); hm.position.y = 0.05; const hh = rbox(0.012, 0.08, 0.004, 0.002, mat('#2a2d33')); hh.position.y = 0.035; hh.rotation.z = 2;
  hands.add(hm, hh); at(hands, x, y, zBack - 0.058); root.add(hands);
  hands.userData.spin = 0.05;
  return hands;
}

function sofa(root: THREE.Group, x: number, z: number, color: string, ry = Math.PI, w = 1.8) {
  const g = new THREE.Group(); const m = mat(color, 0.9);
  const seat = rbox(w, 0.42, 0.8, 0.08, m); seat.position.y = 0.21; g.add(seat);
  const back = rbox(w, 0.5, 0.22, 0.08, m); back.position.set(0, 0.62, -0.3); g.add(back);
  for (const s of [-1, 1]) { const arm = rbox(0.2, 0.36, 0.8, 0.08, m); arm.position.set(s * (w / 2 - 0.1), 0.52, 0); g.add(arm); }
  for (let i = 0; i < 2; i++) { const cu = rbox(w / 2 - 0.25, 0.14, 0.62, 0.06, mat(new THREE.Color(color).offsetHSL(0, 0, 0.05).getStyle(), 0.95)); cu.position.set((i - 0.5) * (w / 2 - 0.15), 0.48, 0.04); g.add(cu); }
  at(g, x, 0, z, ry); root.add(g); blob(root, x, z, w + 0.3, 1.1, 0.5);
}

function boxStack(root: THREE.Group, x: number, z: number, n = 3) {
  const m = mat('#c9a77a', 0.9);
  for (let i = 0; i < n; i++) { const b = rbox(0.5 - i * 0.06, 0.34, 0.4 - i * 0.04, 0.008, m); at(b, x + (i % 2) * 0.05, 0.17 + i * 0.34, z, i * 0.15); root.add(b); const tp = rbox(0.51 - i * 0.06, 0.004, 0.06, 0.001, mat('#b8955f', 0.5)); at(tp, x + (i % 2) * 0.05, 0.342 + i * 0.34, z, i * 0.15); root.add(tp); }
  blob(root, x, z, 0.8, 0.7, 0.5);
}

function poster(root: THREE.Group, x: number, y: number, z: number, side: 'back' | 'left' | 'right', draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, w = 0.55, h = 0.77) {
  wallSheet(root, canvasTex(400, Math.round(400 * h / w), draw), w, h, x, y, z, side);
}

function plantBig(root: THREE.Group, x: number, z: number) {
  const pot = cyl(0.18, 0.14, 0.4, mat('#e6e2d6', 0.6), 20); at(pot, x, 0.2, z); root.add(pot);
  const leaf = mat('#3f6b3a', 0.8);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const l = sphere(0.12, leaf, 8, 6); l.scale.set(0.35, 1.8, 0.15); l.position.set(x + Math.sin(a) * 0.12, 0.75 + (i % 4) * 0.12, z + Math.cos(a) * 0.12); l.rotation.set(Math.cos(a) * 0.6, a, -Math.sin(a) * 0.6); root.add(l); }
  blob(root, x, z, 0.7, 0.7, 0.5);
}

/* ---------------- заготовки ---------------- */

type Builder = (root: THREE.Group) => void;

const dormKitchen: Builder = (root) => {
  cabinetRow(root, 1.95, 2, '#c8a273', '#d6b386', '#d8d4c8');
  const tiles = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#dfe7e3'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b9c6c0'; c.lineWidth = 3; for (let x = 0; x <= w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.fillStyle = 'rgba(140,110,60,.15)'; c.fillRect(70, 40, 30, 30); c.fillRect(170, 80, 30, 30); });
  wallSheet(root, tiles, 1.3, 0.75, 1.63, 1.25, 0);
  const stove = rbox(0.5, 0.09, 0.36, 0.02, mat('#e9e6dc', 0.5)); at(stove, 1.95, 0.915, zBack - 0.3); root.add(stove);
  for (const dx of [-0.11, 0.11]) { const b = cyl(0.075, 0.075, 0.012, mat('#2c2f35', 0.5), 20); at(b, 1.95 + dx, 0.966, zBack - 0.3); root.add(b); }
  const pot = cyl(0.11, 0.1, 0.14, mat('#4f6f8f', 0.45, 0.3), 18); at(pot, 1.84, 1.04, zBack - 0.3); root.add(pot);
  const sink = rbox(0.46, 0.04, 0.4, 0.04, mat('#c9ccd0', 0.35, 0.65)); at(sink, 1.31, 0.875, zBack - 0.32); root.add(sink);
  const tap = cyl(0.02, 0.025, 0.22, mat('#c9ccd0', 0.35, 0.65)); at(tap, 1.31, 0.98, zBack - 0.55); root.add(tap);
  const dish = rbox(0.3, 0.2, 0.05, 0.01, mat('#2f7dd6', 0.5)); at(dish, 1.55, 0.97, zBack - 0.45); root.add(dish);
  poster(root, -1.0, 1.75, 0, 'back', (c, w, h) => {
    c.fillStyle = '#f6f4ec'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2d33'; c.font = '800 34px Nunito'; c.fillText('ГРАФИК ДЕЖУРСТВ', 24, 56); c.font = '20px Nunito'; c.fillStyle = '#5b616b'; c.fillText('кухня 3 этажа · ноябрь', 24, 88);
    const d = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], who = ['Артём', 'Кирилл', 'Рома', 'Паша', 'Игорь', 'все', 'никто'];
    for (let i = 0; i < 7; i++) { const y = 112 + i * 62; c.strokeStyle = '#9aa1aa'; c.lineWidth = 2; c.strokeRect(24, y, w - 48, 54); c.fillStyle = '#2a2d33'; c.font = '700 24px Nunito'; c.fillText(d[i], 40, y + 36); c.font = '30px Neucha'; c.fillStyle = i === 6 ? COLORS.stamp : COLORS.ink; c.fillText(who[i], 120, y + 38); }
    c.strokeStyle = COLORS.stamp; c.lineWidth = 3; c.beginPath(); c.moveTo(112, 112 + 62 + 30); c.lineTo(250, 112 + 62 + 26); c.stroke();
  });
  clock(root, 0.1, 2.2, '#a3294a', 'ЗАРЯ');
  fridgeOld(root, XR + 0.36, 1.05, Math.PI / 2);
  const hook = rbox(0.8, 0.06, 0.04, 0.015, mat('#8e6a45', 0.75)); at(hook, -0.2, 1.9, zBack - 0.03); root.add(hook);
  const jacket = rbox(0.42, 0.75, 0.12, 0.08, mat('#7a3b34', 0.85)); at(jacket, -0.3, 1.5, zBack - 0.1); root.add(jacket);
  stool(root, 0.9, 3.0, '#b33a2e');
  const bin = cyl(0.15, 0.13, 0.38, mat('#4d7c8a', 0.6), 18); at(bin, -0.8, 0.19, zBack - 0.3); root.add(bin);
  wallSheet(root, canvasTex(256, 200, (c, w, h) => { const g = c.createRadialGradient(128, 100, 10, 128, 100, 110); g.addColorStop(0, 'rgba(120,140,110,.35)'); g.addColorStop(1, 'rgba(120,140,110,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }), 0.8, 0.6, -1.9, 2.2, 0, 'back', true);
};

const dormRoom: Builder = (root) => {
  // двухъярусная кровать у задней стены справа
  const metalM = mat('#5d7a8f', 0.5, 0.4);
  const bunk = new THREE.Group();
  for (const [dx, dz] of [[-0.95, -0.42], [0.95, -0.42], [-0.95, 0.42], [0.95, 0.42]]) { const p = cyl(0.025, 0.025, 1.85, metalM, 8); p.position.set(dx, 0.925, dz); bunk.add(p); }
  for (const y of [0.42, 1.42]) { const mattress = rbox(1.85, 0.16, 0.82, 0.06, mat('#d9d5c6', 0.95)); mattress.position.y = y; bunk.add(mattress); const blanket = rbox(1.3, 0.05, 0.84, 0.03, mat(y < 1 ? '#8a3b3b' : '#3b5a8a', 0.95)); blanket.position.set(0.25, y + 0.09, 0); bunk.add(blanket); const pil = rbox(0.4, 0.1, 0.5, 0.05, mat('#f2f0e8', 0.95)); pil.position.set(-0.7, y + 0.12, 0); bunk.add(pil); }
  at(bunk, -1.38, 0, zBack - 0.45); root.add(bunk); blob(root, -1.38, zBack - 0.45, 2.2, 1.1, 0.5);
  // стол с лампой слева
  const desk = rbox(1.2, 0.05, 0.6, 0.015, mat('#a7825a', 0.7)); at(desk, 1.6, 0.76, zBack - 0.32); root.add(desk);
  for (const [dx, dz] of [[0.55, 0.25], [-0.55, 0.25], [0.55, -0.25], [-0.55, -0.25]]) { const l = rbox(0.04, 0.74, 0.04, 0.01, mat('#6e5238', 0.8)); at(l, 1.6 + dx, 0.37, zBack - 0.32 + dz); root.add(l); }
  const books = ['#a3294a', '#1e3c8c', '#2f7d4f', '#d9b52e', '#5b616b'];
  books.forEach((cl, i) => { const b = rbox(0.05, 0.25, 0.2, 0.006, mat(cl, 0.7)); at(b, 2.0 - i * 0.055, 0.91, zBack - 0.15); root.add(b); });
  const monitor = rbox(0.5, 0.32, 0.03, 0.01, mat('#1b1d22', 0.4)); at(monitor, 1.35, 1.08, zBack - 0.15); root.add(monitor);
  poster(root, 1.6, 1.75, 0, 'back', (c, w, h) => { c.fillStyle = '#2f4f8f'; c.fillRect(0, 0, w, h); c.fillStyle = '#f1d04b'; c.beginPath(); c.arc(200, 220, 120, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2f4f8f'; c.beginPath(); c.arc(240, 200, 110, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f6f4ec'; c.font = '900 52px Nunito'; c.textAlign = 'center'; c.fillText('СЕССИЯ', 200, 430); c.font = '30px Neucha'; c.fillText('сдадим. наверное', 200, 480); });
  // сушилка с бельём
  const rack = new THREE.Group(); const rm = mat('#d7d9d8', 0.4, 0.5);
  for (let i = 0; i < 5; i++) { const r = cyl(0.006, 0.006, 0.9, rm, 6); r.rotation.z = Math.PI / 2; r.position.set(0, 0.95, -0.2 + i * 0.1); rack.add(r); }
  for (const s of [-1, 1]) { const leg = cyl(0.01, 0.01, 1.0, rm, 6); leg.position.set(s * 0.45, 0.5, 0); rack.add(leg); }
  ['#d64d3b', '#f2f0e8', '#3b5a8a'].forEach((cl, i) => { const cloth = rbox(0.3, 0.4, 0.01, 0.02, mat(cl, 0.95)); cloth.position.set(-0.25 + i * 0.25, 0.75, -0.1 + i * 0.1); rack.add(cloth); });
  at(rack, XL - 0.35, 0, 2.55, Math.PI / 2); root.add(rack); blob(root, XL - 0.35, 2.55, 0.6, 1.0, 0.35);
  // шкаф у правой стены
  const ward = rbox(0.6, 2.0, 1.0, 0.03, mat('#c8a273', 0.75)); at(ward, XR + 0.32, 1.0, 0.6); root.add(ward);
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 1.2), new THREE.MeshStandardMaterial({ color: '#b9c8d4', roughness: 0.05, metalness: 0.9 })); mirror.position.set(XR + 0.63, 1.1, 0.6); mirror.rotation.y = Math.PI / 2; root.add(mirror);
  clock(root, 0.35, 2.25, '#2f7d4f', 'ЗАРЯ');
};

const khrKitchen: Builder = (root) => {
  cabinetRow(root, 2.2, 2, '#e8e2d2', '#f0ebdc', '#a7825a');
  const gasStove = rbox(0.55, 0.85, 0.58, 0.02, mat('#f2f0e8', 0.4)); at(gasStove, 1.0, 0.425, zBack - 0.31); root.add(gasStove);
  for (const [dx, dz] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) { const b = cyl(0.06, 0.06, 0.02, mat('#2c2f35', 0.5), 14); at(b, 1.0 + dx, 0.86, zBack - 0.31 + dz); root.add(b); }
  const kettleOld = cyl(0.09, 0.11, 0.16, mat('#c94a3a', 0.3, 0.2), 18); at(kettleOld, 0.88, 0.95, zBack - 0.43); root.add(kettleOld);
  // сервант
  const side = rbox(1.2, 1.9, 0.45, 0.02, mat('#6a4127', 0.5)); at(side, -1.6, 0.95, zBack - 0.25); root.add(side);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), new THREE.MeshStandardMaterial({ color: '#cfe0e8', transparent: true, opacity: 0.35, roughness: 0.05 })); at(glass, -1.6, 1.4, zBack - 0.48, Math.PI); root.add(glass);
  for (let i = 0; i < 6; i++) { const cr = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(0.04, 0.01), new THREE.Vector2(0.05, 0.1), new THREE.Vector2(0.03, 0.16)], 12), new THREE.MeshStandardMaterial({ color: '#e8f2f6', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.7 })); at(cr, -2.0 + i * 0.16, 1.15, zBack - 0.3); root.add(cr); }
  const doily = new THREE.Mesh(new THREE.CircleGeometry(0.25, 20), mat('#f6f4ec', 0.95)); doily.rotation.x = -Math.PI / 2; at(doily, -1.6, 1.905, zBack - 0.25); root.add(doily);
  clock(root, 0.95, 2.05, '#6a4127', 'МАЯК');
  const calTex = canvasTex(300, 420, (c, w, h) => { c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, w, h); c.fillStyle = '#c94a3a'; c.fillRect(0, 0, w, 210); c.fillStyle = '#fff'; c.font = '900 40px Nunito'; c.fillText('2026', 20, 60); c.font = '24px Nunito'; c.fillText('Котики', 20, 100); c.fillStyle = '#f1d04b'; c.beginPath(); c.arc(200, 150, 50, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2a2d33'; c.font = '700 18px "PT Mono"'; for (let i = 0; i < 30; i++) c.fillText(String(i + 1), 16 + (i % 7) * 40, 250 + Math.floor(i / 7) * 34); });
  wallSheet(root, calTex, 0.32, 0.45, -0.3, 1.7, 0);
  // кухонный уголок у правой стены
  const bench = rbox(0.5, 0.45, 1.4, 0.04, mat('#8a5a3c', 0.85)); at(bench, XR + 0.3, 0.225, 0.9); root.add(bench);
  const benchBack = rbox(0.1, 0.5, 1.4, 0.04, mat('#8a5a3c', 0.85)); at(benchBack, XR + 0.06, 0.7, 0.9); root.add(benchBack);
  const towel = rbox(0.3, 0.45, 0.02, 0.02, new THREE.MeshStandardMaterial({ map: canvasTex(64, 64, (c) => { c.fillStyle = '#f6f4ec'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#c94a3a'; for (let i = 0; i < 4; i++) { c.fillRect(i * 16, 0, 5, 64); c.fillRect(0, i * 16, 64, 5); } }) })); at(towel, 1.9, 0.62, zBack - 0.63); root.add(towel);
};

const khrRoom: Builder = (root) => {
  // ковёр на стене
  const carpet = canvasTex(600, 400, (c, w, h) => {
    c.fillStyle = '#7a1f2b'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#d9b44a'; c.lineWidth = 10; c.strokeRect(20, 20, w - 40, h - 40);
    c.strokeStyle = '#1f3c6e'; c.lineWidth = 16; c.strokeRect(46, 46, w - 92, h - 92);
    for (let i = 0; i < 3; i++) { c.save(); c.translate(150 + i * 150, h / 2); c.rotate(Math.PI / 4); c.fillStyle = ['#d9b44a', '#1f3c6e', '#f2e6cf'][i % 3]; c.fillRect(-50, -50, 100, 100); c.fillStyle = '#7a1f2b'; c.fillRect(-25, -25, 50, 50); c.restore(); }
    for (let x = 80; x < w - 80; x += 24) { c.fillStyle = '#f2e6cf'; c.fillRect(x, 70, 10, 10); c.fillRect(x, h - 80, 10, 10); }
  });
  wallSheet(root, carpet, 2.4, 1.6, 1.4, 1.65, 0);
  sofa(root, 1.35, zBack - 0.5, '#6b5a43', Math.PI, 1.6);
  // стенка
  const unit = rbox(1.6, 2.3, 0.5, 0.02, mat('#5a3a22', 0.45)); at(unit, -1.6, 1.15, zBack - 0.27); root.add(unit);
  for (let i = 0; i < 4; i++) { const d = rbox(0.36, 0.9, 0.02, 0.01, mat('#6a4127', 0.45)); at(d, -2.2 + i * 0.4, 0.5, zBack - 0.53); root.add(d); }
  const books = ['#a3294a', '#1e3c8c', '#2f7d4f', '#d9b52e', '#5b616b', '#8a3b3b', '#3b5a8a'];
  books.forEach((cl, i) => { const b = rbox(0.06, 0.28, 0.2, 0.006, mat(cl, 0.7)); at(b, -2.25 + i * 0.07, 1.25, zBack - 0.3); root.add(b); });
  const crt = rbox(0.55, 0.45, 0.45, 0.04, mat('#2a2d33', 0.5)); at(crt, -1.25, 1.35, zBack - 0.3); root.add(crt);
  const crtScr = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), new THREE.MeshStandardMaterial({ color: '#2a3a48', roughness: 0.1 })); at(crtScr, -1.25, 1.37, zBack - 0.526, Math.PI); root.add(crtScr);
  const vase = cyl(0.06, 0.08, 0.25, mat('#1f3c6e', 0.3), 16); at(vase, -1.9, 2.42, zBack - 0.27); root.add(vase);
  // торшер
  const pole = cyl(0.015, 0.015, 1.5, mat('#c9a24a', 0.3, 0.8), 8); at(pole, 2.35, 0.75, 3.3); root.add(pole);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.3, 20, 1, true), new THREE.MeshStandardMaterial({ color: '#f2d9a8', emissive: new THREE.Color('#ffb067'), emissiveIntensity: 0.6, side: THREE.DoubleSide })); at(shade, 2.35, 1.6, 3.3); root.add(shade);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: carpet, roughness: 1 })); rug.rotation.x = -Math.PI / 2; at(rug, 0.6, 0.005, 2.6); rug.receiveShadow = true; root.add(rug);
  clock(root, -0.3, 2.15, '#c9a24a', 'МАЯК');
};

const newKitchen: Builder = (root) => {
  cabinetRow(root, 2.6, 3, '#f4f5f3', '#e9ecef', '#d7c3a2', false);
  const film = new THREE.MeshStandardMaterial({ color: '#e8f0f4', transparent: true, opacity: 0.35, roughness: 0.1 });
  const wrap = rbox(1.98, 0.9, 0.66, 0.03, film); at(wrap, 1.96, 0.45, zBack - 0.32); root.add(wrap);
  boxStack(root, -1.5, 4.0, 3);
  boxStack(root, -2.5, 3.0, 2);
  // стремянка
  const lad = new THREE.Group(); const lm = mat('#c9ccd0', 0.35, 0.6);
  for (const s of [-1, 1]) { const rail = rbox(0.04, 1.6, 0.04, 0.01, lm); rail.position.set(s * 0.22, 0.8, 0); rail.rotation.x = 0.18; lad.add(rail); const back = rbox(0.04, 1.6, 0.04, 0.01, lm); back.position.set(s * 0.22, 0.78, 0.45); back.rotation.x = -0.18; lad.add(back); }
  for (let i = 0; i < 4; i++) { const st = rbox(0.44, 0.03, 0.12, 0.01, mat('#e9c437', 0.6)); st.position.set(0, 0.3 + i * 0.35, -0.05 + i * 0.065); lad.add(st); }
  at(lad, 0.9, 0, 3.95, 0.3); root.add(lad); blob(root, 0.9, 4.1, 0.8, 0.8, 0.4);
  const roll = cyl(0.08, 0.08, 1.0, mat('#e8e6dd', 0.9), 16); at(roll, -0.6, 0.5, 4.2); roll.rotation.z = 0.2; root.add(roll);
  const bucket = cyl(0.14, 0.12, 0.3, mat('#f4f5f3', 0.5), 18); at(bucket, -0.9, 0.15, 4.1); root.add(bucket);
  const paint = plane(0.25, 0.12, noteTex(['ГРУНТ', '10 л'], { bg: '#f4f5f3', ink: '#2a2d33', font: '800 Nunito, sans-serif', size: 40, w: 256, h: 128, lineH: 40, pad: 16 }));
  // стикер-план на стене
  poster(root, 1.2, 1.7, 0, 'back', (c, w, h) => { c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1e3c8c'; c.lineWidth = 4; c.strokeRect(40, 60, 320, 260); c.beginPath(); c.moveTo(200, 60); c.lineTo(200, 200); c.lineTo(360, 200); c.stroke(); c.fillStyle = '#1e3c8c'; c.font = '28px Neucha'; c.fillText('кухня', 60, 120); c.fillText('спальня', 220, 120); c.fillText('сюда диван?', 60, 260); c.fillStyle = '#2a2d33'; c.font = '800 30px Nunito'; c.fillText('ПЛАН', 40, 40); }, 0.5, 0.5);
  void paint;
};

const newWork: Builder = (root) => {
  const desk = rbox(1.6, 0.05, 0.7, 0.015, mat('#f4f5f3', 0.4)); at(desk, 1.6, 0.75, zBack - 0.4); root.add(desk);
  for (const s of [-1, 1]) { const leg = rbox(0.05, 0.72, 0.6, 0.01, mat('#2a2d33', 0.4)); at(leg, 1.6 + s * 0.75, 0.36, zBack - 0.4); root.add(leg); }
  for (const dx of [-0.35, 0.3]) { const mon = rbox(0.6, 0.36, 0.03, 0.01, mat('#1b1d22', 0.3)); at(mon, 1.6 + dx, 1.08, zBack - 0.2, dx > 0 ? -0.15 : 0.15); root.add(mon); const st = rbox(0.06, 0.15, 0.06, 0.01, mat('#2a2d33', 0.3)); at(st, 1.6 + dx, 0.85, zBack - 0.2); root.add(st); }
  const chair = new THREE.Group(); const cm = mat('#2a2d33', 0.6);
  const seat = rbox(0.5, 0.08, 0.5, 0.04, cm); seat.position.y = 0.5; chair.add(seat); const back = rbox(0.48, 0.6, 0.06, 0.04, cm); back.position.set(0, 0.85, 0.25); chair.add(back); const post = cyl(0.03, 0.03, 0.4, mat('#c9ccd0', 0.3, 0.7)); post.position.y = 0.26; chair.add(post);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const leg = rbox(0.3, 0.03, 0.04, 0.01, cm); leg.position.set(Math.sin(a) * 0.15, 0.05, Math.cos(a) * 0.15); leg.rotation.y = a + Math.PI / 2; chair.add(leg); }
  at(chair, 1.5, 0, 3.4, 0.4); root.add(chair); blob(root, 1.5, 3.4, 0.8, 0.8, 0.4);
  boxStack(root, -1.5, 4.0, 2); boxStack(root, -2.6, 3.6, 3);
  plantBig(root, 2.9, 3.0);
  const shelf = rbox(1.2, 0.04, 0.25, 0.01, mat('#d7c3a2', 0.6)); at(shelf, -0.9, 1.8, zBack - 0.13); root.add(shelf);
  ['#2f7dd6', '#f1d04b', '#e6eaec'].forEach((cl, i) => { const b = rbox(0.18, 0.18, 0.18, 0.02, mat(cl, 0.6)); at(b, -1.3 + i * 0.35, 1.91, zBack - 0.13); root.add(b); });
};

const eliteLiving: Builder = (root) => {
  const marble = new THREE.MeshStandardMaterial({ map: canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#ecebe6'; c.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 18; i++) { c.strokeStyle = `rgba(120,120,130,${0.15 + r() * 0.2})`; c.lineWidth = 1 + r() * 2; c.beginPath(); let x = r() * w, y = 0; c.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 80; y += h / 8; c.lineTo(x, y); } c.stroke(); } }), roughness: 0.15, metalness: 0.05 });
  const island = rbox(2.2, 0.92, 0.9, 0.03, marble); at(island, 2.7, 0.46, 5.6); root.add(island); blob(root, 2.7, 5.6, 2.6, 1.3, 0.55);
  for (let i = 0; i < 3; i++) { const st = new THREE.Group(); const s = cyl(0.17, 0.17, 0.05, mat('#2a2522', 0.5), 20); s.position.y = 0.75; st.add(s); const p = cyl(0.02, 0.02, 0.72, mat('#c9a24a', 0.3, 0.85), 8); p.position.y = 0.37; st.add(p); const b = cyl(0.18, 0.18, 0.02, mat('#c9a24a', 0.3, 0.85), 20); b.position.y = 0.01; st.add(b); at(st, 2.0 + i * 0.7, 0, 5.0); root.add(st); }
  for (let i = 0; i < 3; i++) { const pend = new THREE.Group(); const w = cyl(0.003, 0.003, 0.9, mat('#2a2d33'), 4); w.position.y = -0.45; pend.add(w); const sh = sphere(0.1, new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: 0.85, roughness: 0.3, emissive: new THREE.Color('#ffb067'), emissiveIntensity: 0.25 }), 16, 10); sh.scale.y = 0.6; sh.position.y = -0.95; pend.add(sh); at(pend, 2.0 + i * 0.7, H, 5.6); root.add(pend); }
  sofa(root, -3.3, 5.7, '#1f2a3a', Math.PI, 2.2);
  sofa(root, XR + 0.5, 3.6, '#1f2a3a', Math.PI / 2, 2.0);
  plantBig(root, -1.3, 6.0); plantBig(root, 4.2, 6.0);
  const coffeeT = rbox(1.0, 0.35, 0.6, 0.04, mat('#c9a24a', 0.3, 0.85)); at(coffeeT, XR + 1.4, 0.18, 3.6); root.add(coffeeT);
  const shelfE = new THREE.Group(); for (let i = 0; i < 4; i++) { const sh = rbox(1.6, 0.04, 0.32, 0.01, mat('#2a2522', 0.4)); sh.position.y = 0.6 + i * 0.6; shelfE.add(sh); } for (const s2 of [-1, 1]) { const up = rbox(0.04, 2.5, 0.32, 0.01, mat('#c9a24a', 0.3, 0.85)); up.position.set(s2 * 0.8, 1.25, 0); shelfE.add(up); } at(shelfE, 0.2, 0, zBack - 0.2); root.add(shelfE);
  ['#e8e2d6', '#c94a3a', '#1f2a3a', '#c9a24a'].forEach((cl, i) => { const o = sphere(0.09, mat(cl, 0.3, i === 3 ? 0.8 : 0), 14, 10); at(o, -0.4 + i * 0.4, 1.31 + (i % 2) * 0.6, zBack - 0.2); root.add(o); });
  const art = canvasTex(600, 400, (c, w, h) => { c.fillStyle = '#e8e2d6'; c.fillRect(0, 0, w, h); c.fillStyle = '#c94a3a'; c.beginPath(); c.arc(220, 200, 120, 0, Math.PI * 2); c.fill(); c.fillStyle = '#1f2a3a'; c.fillRect(300, 80, 200, 240); c.fillStyle = '#c9a24a'; c.fillRect(120, 330, 380, 14); });
  wallSheet(root, art, 1.8, 1.2, -3.3, 2.15, 0);
  const frame = rbox(1.86, 1.26, 0.03, 0.01, mat('#c9a24a', 0.3, 0.8)); at(frame, -3.3, 2.15, zBack - 0.004); root.add(frame);
};

const eliteSport: Builder = (root) => {
  const tread = new THREE.Group(); const tm = mat('#1b1d22', 0.5);
  const deck = rbox(0.8, 0.2, 1.8, 0.04, tm); deck.position.y = 0.1; tread.add(deck);
  const belt = rbox(0.6, 0.01, 1.6, 0.005, mat('#2a2d33', 0.9)); belt.position.y = 0.205; tread.add(belt);
  for (const s of [-1, 1]) { const up = rbox(0.06, 1.1, 0.06, 0.02, tm); up.position.set(s * 0.36, 0.7, -0.75); up.rotation.x = 0.15; tread.add(up); }
  const consoleM = rbox(0.8, 0.25, 0.12, 0.04, tm); consoleM.position.set(0, 1.25, -0.85); consoleM.rotation.x = -0.5; tread.add(consoleM);
  at(tread, 2.9, 0, 5.4, Math.PI / 2 + 0.3); root.add(tread); blob(root, 2.9, 5.4, 2.0, 1.2, 0.5);
  const tread2 = tread.clone(); at(tread2, 4.0, 0, 4.2, Math.PI / 2 + 0.3); root.add(tread2); blob(root, 4.0, 4.2, 2.0, 1.2, 0.5);
  const bench = rbox(0.4, 0.45, 1.3, 0.05, mat('#1b1d22', 0.6)); at(bench, -4.0, 0.23, 4.0); root.add(bench);
  for (let i = 0; i < 5; i++) { const db = new THREE.Group(); const bar = cyl(0.015, 0.015, 0.3, mat('#c9ccd0', 0.3, 0.8), 8); bar.rotation.z = Math.PI / 2; db.add(bar); for (const s2 of [-1, 1]) { const w = cyl(0.05 + i * 0.008, 0.05 + i * 0.008, 0.06, mat('#2a2d33', 0.5), 12); w.rotation.z = Math.PI / 2; w.position.x = s2 * 0.13; db.add(w); } at(db, -1.2 + i * 0.4, 0.07, zBack - 0.3); root.add(db); }
  plantBig(root, 0.0, 6.0);
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.9), new THREE.MeshStandardMaterial({ color: '#c9d6e0', roughness: 0.04, metalness: 0.95 })); at(mirror, -3.2, 1.5, zBack - 0.01, Math.PI); root.add(mirror);
  const rack = rbox(1.2, 0.04, 0.3, 0.01, mat('#c9a24a', 0.3, 0.85)); at(rack, -3.2, 2.85, zBack - 0.16); root.add(rack);
  for (let i = 0; i < 3; i++) { const cupG = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.02, 0), new THREE.Vector2(0.05, 0.04), new THREE.Vector2(0.06, 0.12)], 14), mat('#d9b44a', 0.25, 0.9)); at(cupG, -3.6 + i * 0.4, 2.9, zBack - 0.16); root.add(cupG); }
  for (let i = 0; i < 3; i++) { const rk = new THREE.Group(); const head = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 6, 20), mat(['#2f7dd6', '#d64d3b', '#1b1d22'][i], 0.4)); head.scale.y = 1.3; head.position.y = 0.6; rk.add(head); const hnd = cyl(0.016, 0.016, 0.35, mat('#2a2d33', 0.6), 8); hnd.position.y = 0.25; rk.add(hnd); at(rk, XL - 0.3, 0, 2.4 + i * 0.25); rk.rotation.z = 0.15; root.add(rk); }
  const balls = mat('#d7f05a', 0.8); for (let i = 0; i < 9; i++) { const b = sphere(0.033, balls, 10, 8); at(b, 1.6 + (i % 4) * 0.09, 0.033, 6.0 - Math.floor(i / 4) * 0.08); root.add(b); }
};

const officeReception: Builder = (root) => {
  const desk = rbox(2.2, 1.1, 0.7, 0.04, mat('#e8eaec', 0.4)); at(desk, 3.0, 0.55, 6.2); root.add(desk); blob(root, 3.0, 6.2, 2.6, 1.1, 0.5);
  const front = rbox(2.2, 0.3, 0.04, 0.02, mat('#ef7d2c', 0.5)); at(front, 3.0, 0.75, 5.84); root.add(front);
  const logo = canvasTex(600, 200, (c, w, h) => { c.fillStyle = '#dfe5ea'; c.fillRect(0, 0, w, h); c.fillStyle = '#ef7d2c'; c.beginPath(); c.arc(90, 100, 60, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2a3038'; c.font = '900 72px Nunito'; c.fillText('МЕРИДИАН', 170, 125); c.font = '24px Nunito'; c.fillText('логистика и склады', 172, 165); });
  wallSheet(root, logo, 2.4, 0.8, 3.0, 2.2, 0);
  const cooler = new THREE.Group(); const cb = rbox(0.32, 1.0, 0.32, 0.03, mat('#f4f5f3', 0.4)); cb.position.y = 0.5; cooler.add(cb);
  const bottle = cyl(0.13, 0.13, 0.42, new THREE.MeshStandardMaterial({ color: '#9fd0ef', transparent: true, opacity: 0.6, roughness: 0.05 }), 20); bottle.position.y = 1.22; cooler.add(bottle);
  at(cooler, -1.5, 0, 6.6); root.add(cooler); blob(root, -1.5, 6.6, 0.6, 0.6, 0.5);
  sofa(root, -3.6, 6.4, '#3e4a5a', Math.PI, 1.8);
  sofa(root, XR + 0.5, 3.4, '#3e4a5a', Math.PI / 2, 1.8);
  plantBig(root, 4.4, 4.6); plantBig(root, -4.5, 6.6); plantBig(root, 1.2, 6.7);
};

const officeOpen: Builder = (root) => {
  for (let i = 0; i < 3; i++) {
    const x = 3.6 - i * (i === 2 ? 3.6 : 2.0);
    const desk = rbox(1.4, 0.04, 0.7, 0.01, mat('#e8eaec', 0.4)); at(desk, x, 0.74, zBack - 0.45); root.add(desk);
    const part = rbox(1.4, 0.5, 0.04, 0.01, mat('#5b6672', 0.95)); at(part, x, 1.0, zBack - 0.1); root.add(part);
    const mon = rbox(0.55, 0.34, 0.03, 0.01, mat('#1b1d22', 0.3)); at(mon, x, 1.05, zBack - 0.3); root.add(mon);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.29), new THREE.MeshBasicMaterial({ color: '#3a5a8a', toneMapped: false })); at(glow, x, 1.05, zBack - 0.317, Math.PI); root.add(glow);
    ['#f1d04b', '#f3b0bd', '#9fe0b5'].forEach((cl, k) => { const st = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), mat(cl, 0.9)); at(st, x - 0.2 + k * 0.09, 1.25, zBack - 0.123, Math.PI); root.add(st); });
    const chair = cyl(0.25, 0.25, 0.08, mat('#ef7d2c', 0.6), 18); at(chair, x, 0.48, zBack - 1.0); root.add(chair);
    blob(root, x, zBack - 0.6, 1.6, 1.2, 0.45);
  }
  const board = canvasTex(500, 330, (c, w, h) => { c.fillStyle = '#fbfbfb'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1e3c8c'; c.lineWidth = 4; c.beginPath(); c.moveTo(40, 280); c.lineTo(140, 200); c.lineTo(240, 230); c.lineTo(340, 120); c.lineTo(450, 60); c.stroke(); c.fillStyle = '#a3294a'; c.font = '34px Neucha'; c.fillText('Q4: +15% !!!', 60, 70); c.fillStyle = '#2a2d33'; c.font = '26px Neucha'; c.fillText('дедлайн пятница', 220, 310); });
  wallSheet(root, board, 1.6, 1.05, 0.0, 1.8, 0);
  const printerBig = rbox(0.7, 1.0, 0.6, 0.03, mat('#e8eaec', 0.45)); at(printerBig, XR + 0.4, 0.5, 1.4); root.add(printerBig);
  // второй ряд столов у левой стены, переговорка за стеклом справа, растения, колонна
  for (let k = 0; k < 2; k++) {
    const z = 4.6 + k * 1.3;
    const desk = rbox(0.7, 0.04, 1.2, 0.01, mat('#e8eaec', 0.4)); at(desk, XL - 0.6, 0.74, z); root.add(desk);
    const mon = rbox(0.03, 0.34, 0.55, 0.01, mat('#1b1d22', 0.3)); at(mon, XL - 0.35, 1.05, z); root.add(mon);
    const ch = cyl(0.25, 0.25, 0.08, mat('#ef7d2c', 0.6), 18); at(ch, XL - 1.2, 0.48, z); root.add(ch);
    blob(root, XL - 0.7, z, 1.2, 1.4, 0.45);
  }
  const glassW = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.6), new THREE.MeshStandardMaterial({ color: '#cfe0ea', transparent: true, opacity: 0.25, roughness: 0.05 }));
  glassW.position.set(XR + 1.6, 1.3, 4.8); room(glassW);
  const frameG = rbox(3.0, 0.05, 0.05, 0.01, mat('#5b6672', 0.4)); at(frameG, XR + 1.6, 2.6, 4.8); root.add(frameG);
  const meetT = rbox(1.6, 0.05, 0.8, 0.02, mat('#2a3038', 0.4)); at(meetT, XR + 1.6, 0.74, 5.9); root.add(meetT);
  for (let k = 0; k < 4; k++) { const ch = cyl(0.22, 0.22, 0.08, mat('#3e4a5a', 0.6), 16); at(ch, XR + 1.0 + k * 0.4, 0.48, 5.3 + (k % 2) * 1.2); root.add(ch); }
  plantBig(root, XL - 0.5, 6.8); plantBig(root, -0.9, 6.7);
  const pillar = rbox(0.5, H, 0.5, 0.02, mat('#dfe5ea', 0.8)); at(pillar, 2.0, H / 2, 2.0 - 0.6 + 0.6); root.add(pillar);
  const sign = plane(0.4, 0.3, noteTex(['ТИШИНА', 'идёт созвон'], { bg: '#fbfbfb', ink: '#a3294a', size: 40, w: 256, h: 192, lineH: 44, pad: 18 })); at(sign, 2.0, 1.5, 1.74, Math.PI); root.add(sign);
  function room(o: THREE.Object3D) { root.add(o); }
};

const BUILDERS: Record<string, Builder> = {
  dorm_kitchen: dormKitchen, dorm_room: dormRoom, khr_kitchen: khrKitchen, khr_room: khrRoom,
  new_kitchen: newKitchen, new_work: newWork, elite_living: eliteLiving, elite_sport: eliteSport,
  office_reception: officeReception, office_open: officeOpen,
};

export function buildPreset(presetId: string, root: THREE.Group): void {
  useDims(dimsFor(presetId.split('_')[0]));
  const b = BUILDERS[presetId];
  if (!b) throw new Error(`Нет заготовки ${presetId}`);
  b(root);
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.userData.noOutline && m.castShadow === false && !(m.material as THREE.Material).transparent) { m.castShadow = true; } });
}

/** Поверхность 1,1 м для точек A–D в стиле локации. */
export function surface(locId: string, kind: 0 | 1 | 2): THREE.Group {
  const L = LOOKS[locId];
  const top = mat(L.surface, locId === 'elite' ? 0.3 : 0.7, locId === 'elite' ? 0.1 : 0);
  const leg = mat(L.surfaceLeg, 0.6, locId === 'elite' ? 0.8 : 0);
  const g = new THREE.Group();
  if (kind === 0) {
    const body = rbox(0.62, 1.05, 0.5, 0.025, top); body.position.y = 0.525; g.add(body);
    const drw = rbox(0.54, 0.24, 0.02, 0.01, leg); drw.position.set(0, 0.82, 0.26); g.add(drw);
    const kn = sphere(0.02, mat('#c9ccd0', 0.35, 0.65), 8, 6); kn.position.set(0, 0.82, 0.28); g.add(kn);
    const t = rbox(0.68, 0.05, 0.56, 0.015, top); t.position.y = 1.075; g.add(t);
  } else if (kind === 1) {
    const t = rbox(0.72, 0.05, 0.6, 0.015, top); t.position.y = 1.075; g.add(t);
    for (const [dx, dz] of [[0.31, 0.25], [-0.31, 0.25], [0.31, -0.25], [-0.31, -0.25]]) { const l = rbox(0.045, 1.05, 0.045, 0.01, leg); l.position.set(dx, 0.525, dz); g.add(l); }
    const sh = rbox(0.66, 0.03, 0.54, 0.01, top); sh.position.y = 0.35; g.add(sh);
  } else {
    for (const y of [0.35, 0.72, 1.075]) { const s = rbox(0.8, 0.04, 0.42, 0.012, top); s.position.y = y; g.add(s); }
    for (const dx of [-0.38, 0.38]) { const s = rbox(0.04, 1.1, 0.42, 0.012, leg); s.position.set(dx, 0.55, 0); g.add(s); }
    const cols = ['#a3294a', '#1e3c8c', '#2f7d4f', '#d9b52e', '#5b616b'];
    for (let i = 0; i < 6; i++) { const b = rbox(0.06, 0.24, 0.26, 0.008, mat(cols[i % 5], 0.7)); b.position.set(-0.3 + i * 0.075, 0.49, 0); g.add(b); }
  }
  g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = m.receiveShadow = true; } });
  return g;
}
