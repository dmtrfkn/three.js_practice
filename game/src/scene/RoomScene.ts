import * as THREE from 'three';
import { buildShell, buildPreset, surface, anchors, dimsFor, LOOKS, type Shell } from './decor';
import { makeItem, makeDevice, blinkers } from './props';
import { ClientActor, appearanceFor, type Appearance } from './client';
import { rbox, cyl, mat, shadowBlob, disposeDeep } from './kit';
import { LOCATIONS, type Level } from '../core/params';
import { PRESETS } from '../core/content';
import type { Order } from '../core/types';

export interface SceneEvents {
  onItemClick?: (id: string) => void;
  onClientClick?: () => void;
  onHover?: (id: string | null) => void;
}

const YAW = 65, PITCH = 25;
export const MOBILE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

export class RoomScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.05, 60);
  private room: THREE.Group | null = null;
  private shell: Shell | null = null;
  private items = new Map<string, { group: THREE.Group; outline: THREE.Group }>();
  private clientHit: THREE.Object3D[] = [];
  client: ClientActor | null = null;
  appearance: Appearance | null = null;
  private yaw = 0; private pitch = -4; private tYaw = 0; private tPitch = -4;
  private dragging = false; private moved = 0; private lx = 0; private ly = 0;
  private ndc = new THREE.Vector2(); private ray = new THREE.Raycaster();
  private hovered: string | null = null;
  private clock = new THREE.Clock();
  private outlineMat = new THREE.MeshBasicMaterial({ color: '#fff6c9', side: THREE.BackSide, toneMapped: false });
  private motes: THREE.Points | null = null;
  private hands: THREE.Object3D[] = [];
  private raf = 0;
  interactive = false;
  sensitivity = 1;
  events: SceneEvents = {};
  locId = 'dorm';

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MOBILE ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.background = new THREE.Color('#0e1013');
    this.bindInput();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
    const loop = () => { this.raf = requestAnimationFrame(loop); this.frame(); };
    loop();
  }

  dispose() { cancelAnimationFrame(this.raf); this.clear(); this.renderer.dispose(); }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // в портретной ориентации расширяем вертикальный угол, чтобы по горизонтали было видно не меньше ~50°
    this.camera.fov = w / h < 1 ? Math.min(90, 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(25)) / (w / h)))) : 60;
    this.camera.updateProjectionMatrix();
  }

  private clear() {
    if (this.room) { this.scene.remove(this.room); disposeDeep(this.room); }
    for (const it of this.items.values()) this.scene.remove(it.outline);
    this.items.clear(); this.clientHit = []; this.client = null; this.room = null; this.hands = []; blinkers.length = 0;
    this.hovered = null;
  }

  /** Собрать комнату для заказа. */
  build(o: Order) {
    this.clear();
    const loc = LOCATIONS[o.locIdx];
    this.locId = loc.id;
    const L = LOOKS[loc.id];
    const d = dimsFor(loc.id);
    const A = anchors(loc.id);
    const room = new THREE.Group();
    this.room = room;
    const shell = buildShell(loc.id); this.shell = shell; room.add(shell.root);
    const preset = PRESETS[loc.id][o.presetIdx];
    const decor = new THREE.Group(); buildPreset(preset.id, decor); room.add(decor);
    decor.traverse((ob) => { if (ob.userData.spin) this.hands.push(ob); });
    this.renderer.toneMappingExposure = L.exposure;
    this.scene.fog = new THREE.Fog(L.fog, d.D * 2.2, d.D * 4);

    // устройство
    const dev = makeDevice(o.deviceId);
    if (dev.wall) {
      dev.group.position.set(A.device.x, Math.min(d.H - 0.45, 2.3), d.zBack - 0.13);
      dev.group.rotation.y = Math.PI;
      dev.group.rotation.y = 0; dev.group.lookAt(A.camera.x, dev.group.position.y, A.camera.z);
      room.add(dev.group);
    } else if (dev.onTable) {
      const tw = A.tableW;
      const table = new THREE.Group();
      const top = rbox(tw, 0.05, 0.7, 0.015, mat('#e8e2d2', 0.55)); top.position.y = 0.76; table.add(top);
      for (const [dx, dz] of [[tw / 2 - 0.06, 0.29], [-tw / 2 + 0.06, 0.29], [tw / 2 - 0.06, -0.29], [-tw / 2 + 0.06, -0.29]]) { const l = cyl(0.02, 0.02, 0.74, mat('#c9ccd0', 0.35, 0.65), 8); l.position.set(dx, 0.37, dz); table.add(l); }
      table.position.copy(A.device); room.add(table);
      const sh = shadowBlob(tw + 0.4, 1.1, 0.5); sh.position.set(A.device.x, 0.004, A.device.z); room.add(sh);
      dev.group.position.set(A.device.x, 0.785, A.device.z);
      dev.group.lookAt(A.camera.x, 0.785, A.camera.z);
      room.add(dev.group);
    } else {
      dev.group.position.copy(A.device);
      dev.group.lookAt(A.camera.x, 0, A.camera.z);
      room.add(dev.group);
      const sh = shadowBlob(1.0, 1.0, 0.55); sh.position.set(A.device.x, 0.004, A.device.z); room.add(sh);
    }

    // поверхности и предметы A–D
    const kinds: (0 | 1 | 2)[] = [0, 1, 2, 1];
    A.slots.forEach((p, i) => {
      const s = surface(loc.id, kinds[i]);
      s.position.set(p.x, 0, p.z); s.lookAt(A.camera.x, 0, A.camera.z);
      room.add(s);
      const b = shadowBlob(1.0, 0.85, 0.5); b.position.set(p.x, 0.004, p.z); room.add(b);
    });
    // лампа рядом с точкой A — тёплое пятно света
    shell.lights.lamp.position.set(A.slots[0].x + 0.15, 1.55, A.slots[0].z + 0.3);
    const lampG = new THREE.Group();
    const lb = cyl(0.07, 0.08, 0.02, mat('#2f7d4f', 0.5), 16); lampG.add(lb);
    const la = cyl(0.008, 0.008, 0.32, mat('#c9ccd0', 0.35, 0.65), 6); la.position.set(0, 0.16, 0); la.rotation.z = 0.25; lampG.add(la);
    const lsh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.11, 16, 1, true), mat('#2f7d4f', 0.5, 0, { side: THREE.DoubleSide })); lsh.position.set(-0.06, 0.33, 0); lsh.rotation.z = 2.1; lampG.add(lsh);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd9a0', toneMapped: false })); bulb.position.set(-0.035, 0.31, 0); lampG.add(bulb);
    lampG.position.set(A.slots[0].x + 0.24, 1.1, A.slots[0].z + 0.18); room.add(lampG);
    if (loc.id === 'elite' || loc.id === 'office') { lampG.visible = false; }

    for (const it of o.items) {
      const g = makeItem(it.id);
      const p = A.slots[it.slot];
      g.position.set(p.x - 0.04, 1.1, p.z);
      g.lookAt(A.camera.x, 1.1, A.camera.z);
      g.traverse((ob) => { const m = ob as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.userData.item = it.id; } });
      room.add(g);
      const outline = new THREE.Group();
      g.traverse((ob) => { const m = ob as THREE.Mesh; if (m.isMesh && !m.userData.noOutline) { const om = new THREE.Mesh(m.geometry, this.outlineMat); om.matrixAutoUpdate = false; om.userData.src = m; outline.add(om); } });
      outline.visible = false;
      this.scene.add(outline);
      this.items.set(it.id, { group: g, outline });
    }

    // клиент
    const off = o.client.name + ':' + o.no;
    this.appearance = appearanceFor(off, loc.id);
    const cl = new ClientActor(this.appearance);
    cl.group.position.copy(A.client);
    cl.face(A.camera);
    cl.setMood(o.mood);
    room.add(cl.group);
    const cs = shadowBlob(0.9, 0.7, 0.55); cs.position.set(A.client.x, 0.005, A.client.z); room.add(cs);
    this.client = cl;
    cl.group.traverse((ob) => { if ((ob as THREE.Mesh).isMesh) this.clientHit.push(ob); });

    // пылинки в луче окна
    const n = 160, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = d.XL - Math.random() * d.W * 0.6; pos[i * 3 + 1] = 0.4 + Math.random() * (d.H - 0.6); pos[i * 3 + 2] = 0.6 + Math.random() * (d.D - 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dot = document.createElement('canvas'); dot.width = dot.height = 32; const dx = dot.getContext('2d')!; const gr = dx.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); dx.fillStyle = gr; dx.fillRect(0, 0, 32, 32);
    this.motes = new THREE.Points(g, new THREE.PointsMaterial({ color: '#fff3d6', size: 0.018, map: new THREE.CanvasTexture(dot), transparent: true, opacity: loc.id === 'elite' ? 0.25 : 0.5, depthWrite: false }));
    room.add(this.motes);

    this.scene.add(room);
    this.camera.position.copy(A.camera);
  }

  setCamera(yaw: number, pitch: number) { this.yaw = this.tYaw = yaw; this.pitch = this.tPitch = pitch; }
  get cameraAngles() { return { yaw: this.tYaw, pitch: this.tPitch }; }
  setMood(m: Level) { this.client?.setMood(m); }

  /** Короткий наезд камеры на клиента (для разговора) или возврат. */
  focusClient(on: boolean) {
    if (!this.room || !this.client) return;
    if (on) { const p = this.client.group.position; const yaw = THREE.MathUtils.radToDeg(Math.atan2(-(p.x - this.camera.position.x), p.z - this.camera.position.z)); this.tYaw = THREE.MathUtils.clamp(yaw, -YAW, YAW); this.tPitch = 2; }
  }
  focusDevice() { this.tYaw = 0; this.tPitch = -12; }

  /* ---------------- ввод ---------------- */

  private bindInput() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => { const r0 = c.getBoundingClientRect(); this.ndc.set(((e.clientX - r0.left) / r0.width) * 2 - 1, -((e.clientY - r0.top) / r0.height) * 2 + 1); if (!this.interactive) return; this.dragging = true; this.moved = 0; this.lx = e.clientX; this.ly = e.clientY; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      if (this.dragging) {
        const dx = e.clientX - this.lx, dy = e.clientY - this.ly; this.moved += Math.abs(dx) + Math.abs(dy); this.lx = e.clientX; this.ly = e.clientY;
        this.tYaw = THREE.MathUtils.clamp(this.tYaw - dx * (MOBILE ? 0.22 : 0.16) * this.sensitivity, -YAW, YAW);
        this.tPitch = THREE.MathUtils.clamp(this.tPitch + dy * 0.12 * this.sensitivity, -PITCH, PITCH);
        if (this.moved > 4) c.classList.add('drag');
      } else this.pick();
    });
    c.addEventListener('pointerup', () => {
      c.classList.remove('drag');
      if (this.dragging && this.moved < (MOBILE ? 14 : 6) && this.interactive) {
        const hit = this.pick();
        if (hit === '__client') this.events.onClientClick?.();
        else if (hit) this.events.onItemClick?.(hit);
      }
      this.dragging = false;
    });
    c.addEventListener('pointerleave', () => { if (!this.dragging) this.setHover(null); });
  }

  private pick(): string | null {
    if (!this.interactive || !this.room) { this.setHover(null); return null; }
    this.ray.setFromCamera(this.ndc, this.camera);
    const meshes: THREE.Object3D[] = [...this.clientHit];
    for (const it of this.items.values()) it.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o); });
    const hit = this.ray.intersectObjects(meshes, false)[0];
    let id: string | null = null;
    if (hit) id = hit.object.userData.item ?? (this.clientHit.includes(hit.object) ? '__client' : null);
    this.setHover(id);
    return id;
  }

  private setHover(id: string | null) {
    if (this.hovered === id) return;
    if (this.hovered && this.hovered !== '__client') { const it = this.items.get(this.hovered); if (it) it.outline.visible = false; }
    this.hovered = id;
    if (id && id !== '__client') { const it = this.items.get(id); if (it) it.outline.visible = true; }
    this.canvas.classList.toggle('hover', !!id);
    this.events.onHover?.(id);
  }

  /** Подсветить предмет программно (клавиатура). */
  highlight(id: string | null) { this.setHover(id); }
  lookAtItem(id: string) {
    const it = this.items.get(id); if (!it) return;
    const p = it.group.position, c = this.camera.position;
    this.tYaw = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(Math.atan2(-(p.x - c.x), p.z - c.z)), -YAW, YAW);
    this.tPitch = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(Math.atan2(p.y - c.y, Math.hypot(p.x - c.x, p.z - c.z))), -PITCH, PITCH);
  }

  /** Координаты предмета на экране (для e2e-тестов и клавиатурной навигации). */
  screenPos(id: string): { x: number; y: number } | null {
    const it = id === '__client' ? (this.client ? { group: this.client.group } : null) : this.items.get(id);
    if (!it) return null;
    const v = new THREE.Box3().setFromObject(it.group).getCenter(new THREE.Vector3()).project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  }

  /* ---------------- кадр ---------------- */

  private frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05), t = this.clock.elapsedTime;
    this.yaw += (this.tYaw - this.yaw) * Math.min(1, dt * 8);
    this.pitch += (this.tPitch - this.pitch) * Math.min(1, dt * 8);
    const yr = THREE.MathUtils.degToRad(this.yaw + Math.sin(t * 0.4) * 0.25);
    const pr = THREE.MathUtils.degToRad(this.pitch + Math.sin(t * 0.53) * 0.15);
    const dir = new THREE.Vector3(-Math.sin(yr) * Math.cos(pr), Math.sin(pr), Math.cos(yr) * Math.cos(pr));
    this.camera.lookAt(this.camera.position.clone().add(dir));
    if (this.client) this.client.update(dt, t, this.camera.position);
    for (const b of blinkers) b.color.set(Math.floor(t * 1.6) % 2 ? '#ff2a2a' : '#4a0d0d');
    if (this.shell?.flicker) { const f = Math.sin(t * 37) > 0.995 || t % 7 < 0.08 ? 0.55 : 1; this.shell.flicker.emissiveIntensity = 1.4 * f; this.shell.lights.ceiling.intensity = LOOKS.dorm.ceilingI * f; }
    for (const h of this.hands) h.rotation.z = -t * 0.05;
    if (this.motes) { const mp = this.motes.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < mp.count; i++) { let y = mp.getY(i) + dt * 0.02; if (y > 2.9) y = 0.4; mp.setY(i, y); } mp.needsUpdate = true; }
    for (const it of this.items.values()) {
      if (!it.outline.visible) continue;
      it.outline.children.forEach((om) => {
        const src = om.userData.src as THREE.Mesh; src.updateWorldMatrix(true, false);
        const geo = src.geometry; if (!geo.boundingSphere) geo.computeBoundingSphere();
        const c = geo.boundingSphere!.center, r = geo.boundingSphere!.radius;
        const k = 1 + Math.min(0.12, 0.012 / Math.max(r, 0.02));
        om.matrix.copy(src.matrixWorld).multiply(new THREE.Matrix4().makeTranslation(c.x, c.y, c.z)).multiply(new THREE.Matrix4().makeScale(k, k, k)).multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z));
      });
    }
    this.renderer.render(this.scene, this.camera);
  }
}
