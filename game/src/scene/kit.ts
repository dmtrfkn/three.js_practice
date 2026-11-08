// Инструменты процедурного моделирования в едином стиле «диорамы»:
// скруглённые коробки с фасками, матовые материалы, тексты на canvas-текстурах.
import * as THREE from 'three';

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export function mat(color: string, rough = 0.82, metal = 0, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  const key = Object.keys(extra).length ? '' : `${color}|${rough}|${metal}`;
  if (key && matCache.has(key)) return matCache.get(key)!;
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, metalness: metal, ...extra });
  if (key) matCache.set(key, m);
  return m;
}

/** Уникальный (не кешированный) материал — когда цвет будет меняться. */
export const umat = (color: string, rough = 0.82, metal = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, metalness: metal, ...extra });

const geoCache = new Map<string, THREE.BufferGeometry>();

export function rboxGeo(w: number, h: number, d: number, r: number): THREE.BufferGeometry {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r.toFixed(3)}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  r = Math.max(0.0005, Math.min(r, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005));
  const s = new THREE.Shape();
  const x = -w / 2 + r, y = -h / 2 + r, ww = w - 2 * r, hh = h - 2 * r;
  s.moveTo(x, y - r);
  s.lineTo(x + ww, y - r); s.quadraticCurveTo(x + ww + r, y - r, x + ww + r, y);
  s.lineTo(x + ww + r, y + hh); s.quadraticCurveTo(x + ww + r, y + hh + r, x + ww, y + hh + r);
  s.lineTo(x, y + hh + r); s.quadraticCurveTo(x - r, y + hh + r, x - r, y + hh);
  s.lineTo(x - r, y); s.quadraticCurveTo(x - r, y - r, x, y - r);
  const bev = Math.min(r, d / 2 - 0.0005);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.0005, d - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.6, bevelSegments: 2, curveSegments: 4,
  });
  g.center();
  g.computeVertexNormals();
  geoCache.set(key, g);
  return g;
}

export function rbox(w: number, h: number, d: number, r: number, m: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(rboxGeo(w, h, d, r), m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cyl(rt: number, rb: number, h: number, m: THREE.Material, seg = 16): THREE.Mesh {
  const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  me.castShadow = me.receiveShadow = true;
  return me;
}

export function sphere(r: number, m: THREE.Material, w = 14, h = 10): THREE.Mesh {
  const me = new THREE.Mesh(new THREE.SphereGeometry(r, w, h), m);
  me.castShadow = me.receiveShadow = true;
  return me;
}

export function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, ry = 0): T {
  o.position.set(x, y, z);
  if (ry) o.rotation.y = ry;
  return o;
}

export function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d')!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function plane(w: number, h: number, tex: THREE.Texture, opts: THREE.MeshStandardMaterialParameters = {}): THREE.Mesh {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, ...opts });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  p.receiveShadow = true;
  return p;
}

/** Плоскость-«наклейка» без освещения (экраны, индикаторы). */
export function screen(w: number, h: number, tex: THREE.Texture): THREE.Mesh {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  p.userData.noOutline = true;
  return p;
}

let blobTex: THREE.Texture | null = null;
export function shadowBlob(w: number, d: number, op = 0.5): THREE.Mesh {
  blobTex ??= canvasTex(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: op, depthWrite: false }));
  p.rotation.x = -Math.PI / 2;
  p.userData.noOutline = true;
  return p;
}

/** Текст на бумажке (рукописный / печатный). */
export function noteTex(lines: string[], o: { bg?: string; ink?: string; font?: string; size?: number; w?: number; h?: number; lineH?: number; pad?: number; underline?: boolean } = {}): THREE.CanvasTexture {
  const w = o.w ?? 256, h = o.h ?? 256, size = o.size ?? 44;
  return canvasTex(w, h, (c) => {
    c.fillStyle = o.bg ?? '#f1d04b'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,.05)'; c.fillRect(0, 0, w, h * 0.12);
    c.fillStyle = o.ink ?? '#1e3c8c';
    c.font = `${size}px ${o.font ?? 'Neucha, cursive'}`;
    const lh = o.lineH ?? size * 1.15, pad = o.pad ?? 20;
    lines.forEach((t, i) => c.fillText(t, pad, h * 0.2 + size + i * lh));
    if (o.underline) {
      c.strokeStyle = '#a3294a'; c.lineWidth = 5; c.beginPath();
      const y = h * 0.2 + size + (lines.length - 1) * lh + 16;
      c.moveTo(pad, y); c.quadraticCurveTo(w / 2, y + 14, w - pad, y - 4); c.stroke();
    }
  });
}

export function group(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  children.forEach((ch) => g.add(ch));
  return g;
}

export function disposeDeep(o: THREE.Object3D): void {
  o.traverse((ch) => {
    const m = ch as THREE.Mesh;
    if (m.isMesh) {
      if (!geoCache.size || ![...geoCache.values()].includes(m.geometry)) m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mm of mats) {
        const sm = mm as THREE.MeshStandardMaterial;
        if ([...matCache.values()].includes(sm)) continue;
        if (sm.map && sm.map !== blobTex) sm.map.dispose();
        sm.dispose?.();
      }
    }
  });
}

export const COLORS = {
  ink: '#1e3c8c', stamp: '#a3294a', sticker: '#f1d04b', paper: '#f6f4ec', graphite: '#2a2d33', ok: '#2f7d4f',
};
