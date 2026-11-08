// Процедурные модели интерактивных предметов и устройств. Перед каждого предмета — ось +Z.
import * as THREE from 'three';
import { mat, umat, rbox, cyl, sphere, at, canvasTex, screen, noteTex, plane, COLORS } from './kit';

const metal = () => mat('#c9ccd0', 0.35, 0.65);
const dark = () => mat('#2c2f35', 0.5);
const paper = () => mat('#f6f4ec', 0.95);
const brass = () => mat('#c9a24a', 0.3, 0.85);

function flatPaper(w: number, d: number, tex: THREE.Texture, y = 0.002, rot = 0): THREE.Mesh {
  const p = plane(w, d, tex, { roughness: 0.95 });
  p.rotation.x = -Math.PI / 2; p.rotation.z = rot; p.position.y = y;
  p.castShadow = false;
  return p;
}

function printedSheet(title: string, rows: string[], o: { w?: number; h?: number; hand?: boolean; ink?: string } = {}): THREE.Texture {
  const w = o.w ?? 300, h = o.h ?? 420;
  return canvasTex(w, h, (c) => {
    c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, w, h);
    c.fillStyle = COLORS.graphite; c.font = `800 ${Math.round(w / 12)}px Nunito, sans-serif`; c.fillText(title, w * 0.08, h * 0.12);
    c.font = o.hand ? `${Math.round(w / 11)}px Neucha, cursive` : `${Math.round(w / 17)}px Nunito, sans-serif`;
    c.fillStyle = o.ink ?? (o.hand ? COLORS.ink : '#5b616b');
    rows.forEach((t, i) => c.fillText(t, w * 0.08, h * 0.22 + i * (h * 0.085)));
  });
}

/* ================= ДОСТОВЕРНЫЕ ПРИЗНАКИ ================= */

function envelopeCoupons(): THREE.Group {
  const g = new THREE.Group();
  const env = rbox(0.24, 0.012, 0.16, 0.004, mat('#e8dcc0', 0.9)); env.position.y = 0.006; g.add(env);
  const flap = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.08, 3), mat('#ddd0b1', 0.9)); flap.rotation.set(-Math.PI / 2, 0, Math.PI); flap.scale.set(1, 1, 0.05); flap.position.set(0, 0.013, -0.03); g.add(flap);
  const colors = ['#d64d3b', '#2f7d4f', '#f1d04b'];
  colors.forEach((cl, i) => {
    const t = canvasTex(160, 64, (c) => { c.fillStyle = cl; c.fillRect(0, 0, 160, 64); c.setLineDash([6, 5]); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.strokeRect(5, 5, 150, 54); c.fillStyle = '#fff'; c.font = '900 30px Nunito'; c.fillText(['−15%', '1+1', '−50₽'][i], 18, 44); });
    const cp = flatPaper(0.13, 0.05, t, 0.014 + i * 0.002, 0.15 * (i - 1));
    cp.position.set(0.04 * (i - 1), cp.position.y, 0.06 + i * 0.012); g.add(cp);
  });
  return g;
}

function folderPlan(): THREE.Group {
  const g = new THREE.Group();
  const f = rbox(0.24, 0.01, 0.32, 0.004, mat('#4a7c9a', 0.75)); f.position.y = 0.005; g.add(f);
  g.add(at(flatPaper(0.2, 0.28, printedSheet('План покупок', ['☐ крупа, масло', '☐ проездной', '☐ коммуналка', '☐ подарок маме', '— без крупных трат'], { hand: true })), 0, 0.012, 0));
  const pen = cyl(0.005, 0.005, 0.14, mat(COLORS.ink, 0.4), 8); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.5; pen.position.set(0.05, 0.016, 0.1); g.add(pen);
  return g;
}

function receiptBox(): THREE.Group {
  const g = new THREE.Group();
  const box = rbox(0.3, 0.12, 0.22, 0.01, mat('#2a2d33', 0.6)); box.position.y = 0.06; g.add(box);
  const logo = canvasTex(256, 128, (c) => { c.fillStyle = '#2a2d33'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#e6eaec'; c.font = '800 34px Nunito'; c.fillText('ULTRA Pro 15', 20, 76); });
  const lp = plane(0.26, 0.1, logo); lp.position.set(0, 0.06, 0.111); g.add(lp);
  const rc = canvasTex(160, 420, (c) => {
    c.fillStyle = '#f7f7f2'; c.fillRect(0, 0, 160, 420); c.fillStyle = '#55575c'; c.font = '16px "PT Mono", monospace';
    ['ТЕХНОМИР', 'кассовый чек', '----------------', 'ULTRA Pro 15', '   149 990,00', 'Гарантия 2г', '   9 990,00', '----------------', 'ИТОГО', '   159 980,00', 'Покупатель:', '  (имя клиента)'].forEach((t, i) => c.fillText(t, 10, 30 + i * 30));
  });
  const r = flatPaper(0.08, 0.21, rc, 0.122, 0.25); r.position.x = -0.03; g.add(r);
  return g;
}

function printout(): THREE.Group {
  const g = new THREE.Group();
  const t = canvasTex(300, 420, (c) => {
    c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, 300, 420);
    c.fillStyle = '#2a2d33'; c.font = '800 30px Nunito'; c.fillText('Инструкция', 24, 50);
    c.fillStyle = '#9aa1aa'; for (let i = 0; i < 8; i++) c.fillRect(24, 80 + i * 22, 250 - (i % 3) * 40, 8);
    c.fillStyle = '#c9ccd0'; c.fillRect(24, 270, 110, 80);
    c.strokeStyle = COLORS.stamp; c.lineWidth = 4; c.beginPath(); c.ellipse(210, 300, 70, 40, -0.1, 0, Math.PI * 2); c.stroke();
    c.fillStyle = COLORS.stamp; c.font = '30px Neucha'; c.fillText('как', 180, 292); c.fillText('включить?', 150, 322);
  });
  g.add(at(flatPaper(0.21, 0.29, t, 0.003, -0.12), 0, 0.003, 0));
  const t2 = canvasTex(300, 420, (c) => { c.fillStyle = '#f3f1ea'; c.fillRect(0, 0, 300, 420); c.fillStyle = '#9aa1aa'; for (let i = 0; i < 12; i++) c.fillRect(24, 40 + i * 26, 240, 8); });
  g.add(at(flatPaper(0.21, 0.29, t2, 0.001, 0.15), 0.04, 0.001, -0.02));
  return g;
}

function manualTabs(): THREE.Group {
  const g = new THREE.Group();
  const book = rbox(0.2, 0.05, 0.28, 0.006, mat('#e6eaec', 0.8)); book.position.y = 0.025; g.add(book);
  const cover = canvasTex(256, 360, (c) => { c.fillStyle = '#1e3c8c'; c.fillRect(0, 0, 256, 360); c.fillStyle = '#fff'; c.font = '900 30px Nunito'; c.fillText('РУКОВОДСТВО', 18, 70); c.font = '20px Nunito'; c.fillText('по эксплуатации', 18, 100); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(18, 140, 220, 140); });
  g.add(at(flatPaper(0.19, 0.27, cover, 0.0515), 0, 0.0515, 0));
  ['#f1d04b', '#a3294a', '#2f7d4f', '#f1d04b'].forEach((cl, i) => { const tab = rbox(0.03, 0.002, 0.025, 0.001, mat(cl, 0.6)); tab.position.set(0.105, 0.03 + i * 0.004, -0.09 + i * 0.05); g.add(tab); });
  return g;
}

function multimeter(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.1, 0.035, 0.18, 0.015, mat('#f1c232', 0.55)); body.position.y = 0.018; g.add(body);
  const face = rbox(0.085, 0.006, 0.16, 0.008, mat('#2a2d33', 0.5)); face.position.y = 0.037; g.add(face);
  const disp = screen(0.06, 0.035, canvasTex(160, 96, (c) => { c.fillStyle = '#9fb59a'; c.fillRect(0, 0, 160, 96); c.fillStyle = '#1b2a18'; c.font = '700 54px "PT Mono", monospace'; c.fillText('0.00', 14, 70); }));
  disp.rotation.x = -Math.PI / 2; disp.position.set(0, 0.041, -0.04); g.add(disp);
  const knob = cyl(0.025, 0.025, 0.012, mat('#e6eaec', 0.5), 18); knob.position.set(0, 0.044, 0.03); g.add(knob);
  for (const [cl, x] of [['#d64d3b', -0.07], ['#2a2d33', -0.1]] as const) {
    const lead = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.04, 0.07), new THREE.Vector3(x + 0.03, 0.01, 0.13), new THREE.Vector3(x, 0.006, 0.05), new THREE.Vector3(x - 0.02, 0.006, -0.06),
    ]), 20, 0.004, 6), mat(cl, 0.5));
    lead.castShadow = true; g.add(lead);
    const probe = cyl(0.007, 0.004, 0.08, mat(cl, 0.4), 8); probe.rotation.x = Math.PI / 2; probe.position.set(x - 0.02, 0.008, -0.1); g.add(probe);
  }
  return g;
}

function stickerOnPad(lines: string[], underline = false, padColor = '#e6eaec'): THREE.Group {
  const g = new THREE.Group();
  const cols = ['#1e3c8c', '#2f7d4f', padColor];
  cols.forEach((cl, i) => { const nb = rbox(0.22, 0.02, 0.3, 0.006, mat(cl, 0.75)); nb.position.y = 0.01 + i * 0.021; nb.rotation.y = (i - 1) * 0.12; g.add(nb); });
  const st = plane(0.13, 0.13, noteTex(lines, { underline, size: 52 }), { roughness: 0.85 });
  st.rotation.x = -Math.PI / 2; st.rotation.z = 0.2; st.position.set(0.02, 0.066, 0); g.add(st);
  const pen = cyl(0.006, 0.006, 0.15, mat(COLORS.ink, 0.4), 8); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.6; pen.position.set(0.02, 0.07, 0.12); g.add(pen);
  return g;
}

function deskCalendar(): THREE.Group {
  const g = new THREE.Group();
  const t = canvasTex(320, 240, (c) => {
    c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, 320, 240);
    c.fillStyle = COLORS.stamp; c.fillRect(0, 0, 320, 46); c.fillStyle = '#fff'; c.font = '900 28px Nunito'; c.fillText('НОЯБРЬ', 16, 33);
    c.fillStyle = '#2a2d33'; c.font = '700 20px "PT Mono"';
    for (let i = 0; i < 28; i++) c.fillText(String(i + 1), 16 + (i % 7) * 43, 80 + Math.floor(i / 7) * 40);
    c.strokeStyle = COLORS.ink; c.lineWidth = 4; c.strokeRect(8, 96, 304, 36);
    c.fillStyle = COLORS.ink; c.font = '22px Neucha'; c.fillText('нужно на этой неделе!', 70, 232);
  });
  const p1 = plane(0.24, 0.18, t, { side: THREE.DoubleSide }); p1.position.set(0, 0.08, 0.035); p1.rotation.x = -0.35; g.add(p1);
  const back = rbox(0.24, 0.18, 0.004, 0.002, mat('#8e6a45', 0.7)); back.position.set(0, 0.08, -0.035); back.rotation.x = 0.35; g.add(back);
  const ring = cyl(0.004, 0.004, 0.24, metal(), 6); ring.rotation.z = Math.PI / 2; ring.position.y = 0.162; g.add(ring);
  return g;
}

/* ================= НЕОДНОЗНАЧНЫЕ ================= */

function laptopItem(): THREE.Group {
  const g = new THREE.Group();
  const alu = mat('#b9bcc2', 0.3, 0.8);
  const base = rbox(0.42, 0.022, 0.29, 0.01, alu); base.position.y = 0.011; g.add(base);
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.12), mat('#2b2e33', 0.6)); kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.0225, 0.03); kb.userData.noOutline = true; g.add(kb);
  const lid = new THREE.Group();
  const lidM = rbox(0.42, 0.28, 0.014, 0.01, alu); lidM.position.y = 0.14; lid.add(lidM);
  const scrTex = canvasTex(420, 280, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1f3c6e'); gr.addColorStop(1, '#6a3d7a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '600 22px Nunito'; c.fillText('Квартальный отчёт.xlsx', 24, 46); c.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 7; i++) c.fillRect(24, 70 + i * 28, 300 - i * 20, 14); });
  const scr = screen(0.38, 0.24, scrTex); scr.position.set(0, 0.14, 0.008); lid.add(scr);
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (c) => { c.fillStyle = '#f1d04b'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#2a2d33'; c.font = '700 14px Nunito'; c.fillText('инв.', 8, 26); c.fillText('№ 0417', 4, 48); }) }));
  st.position.set(0.15, 0.14, -0.009); st.rotation.y = Math.PI; st.userData.noOutline = true; lid.add(st);
  lid.position.set(0, 0.022, -0.14); lid.rotation.x = -0.32; g.add(lid);
  return g;
}

function tvBox(): THREE.Group {
  const g = new THREE.Group();
  const box = rbox(0.62, 0.42, 0.12, 0.01, mat('#d8c7a3', 0.9)); box.position.set(0, 0.21, -0.1); box.rotation.x = -0.12; g.add(box);
  const print = canvasTex(512, 340, (c) => {
    c.fillStyle = '#d8c7a3'; c.fillRect(0, 0, 512, 340);
    c.fillStyle = '#1b1d22'; c.fillRect(60, 50, 392, 230);
    const gr = c.createLinearGradient(60, 50, 452, 280); gr.addColorStop(0, '#2f7dd6'); gr.addColorStop(1, '#e1834a'); c.fillStyle = gr; c.fillRect(70, 60, 372, 210);
    c.fillStyle = '#1b1d22'; c.font = '900 34px Nunito'; c.fillText('QLED 65"', 60, 320);
    c.fillStyle = COLORS.stamp; c.font = '800 22px Nunito'; c.fillText('8K · 120 Гц', 330, 320);
  });
  const p = plane(0.58, 0.385, print); p.position.set(0, 0.215, -0.036); p.rotation.x = -0.12; g.add(p);
  const tape = rbox(0.62, 0.004, 0.05, 0.001, mat('#c9a77a', 0.5)); tape.position.set(0, 0.42, -0.12); g.add(tape);
  return g;
}

function designerLamp(): THREE.Group {
  const g = new THREE.Group();
  const base = cyl(0.08, 0.09, 0.025, mat('#e6e2d6', 0.3), 28); base.position.y = 0.012; g.add(base);
  const stem = cyl(0.006, 0.006, 0.38, brass(), 8); stem.position.y = 0.2; g.add(stem);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.006, 8, 24, Math.PI * 0.7), brass()); arc.position.set(-0.12, 0.39, 0); arc.rotation.z = 0; g.add(arc);
  const globe = sphere(0.075, new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0.9, roughness: 0.4 }), 20, 14);
  globe.position.set(-0.23, 0.44, 0); globe.userData.noOutline = false; g.add(globe);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), new THREE.MeshBasicMaterial({ map: canvasTex(96, 48, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 96, 48); c.fillStyle = '#2a2d33'; c.font = '700 13px Nunito'; c.fillText('LUMEN·IT', 6, 20); c.fillText('€ 1 290', 6, 40); }) }));
  tag.position.set(0.02, 0.15, 0.012); tag.rotation.y = 0.3; tag.userData.noOutline = true; g.add(tag);
  return g;
}

function trophy(): THREE.Group {
  const g = new THREE.Group();
  const gold = mat('#d9b44a', 0.25, 0.9);
  const plinth = rbox(0.12, 0.06, 0.12, 0.008, mat('#2a2522', 0.5)); plinth.position.y = 0.03; g.add(plinth);
  const stem = cyl(0.012, 0.025, 0.08, gold, 14); stem.position.y = 0.1; g.add(stem);
  const cup = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.02, 0), new THREE.Vector2(0.06, 0.03), new THREE.Vector2(0.075, 0.09), new THREE.Vector2(0.078, 0.12)], 24), gold);
  cup.castShadow = true; cup.position.y = 0.14; g.add(cup);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 14, Math.PI), gold); h.position.set(s * 0.08, 0.21, 0); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(h); }
  const plate = plane(0.08, 0.03, canvasTex(128, 48, (c) => { c.fillStyle = '#c9a24a'; c.fillRect(0, 0, 128, 48); c.fillStyle = '#2a2522'; c.font = '700 15px Nunito'; c.fillText('ROYAL CLUB', 14, 20); c.fillText('1 место', 30, 40); }), { metalness: 0.6, roughness: 0.3 });
  plate.position.set(0, 0.03, 0.061); g.add(plate);
  return g;
}

function awardPlaque(): THREE.Group {
  const g = new THREE.Group();
  const base = rbox(0.16, 0.035, 0.07, 0.008, mat('#2a2d33', 0.4)); base.position.y = 0.018; g.add(base);
  const glass = rbox(0.13, 0.2, 0.025, 0.012, new THREE.MeshStandardMaterial({ color: '#cfe6f2', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.55 }));
  glass.position.y = 0.135; g.add(glass);
  const t = canvasTex(200, 300, (c) => { c.clearRect(0, 0, 200, 300); c.fillStyle = '#1e3c8c'; c.font = '900 22px Nunito'; c.fillText('ЛУЧШИЙ', 30, 70); c.fillText('ТЕХ. ПРОЕКТ', 18, 100); c.font = '16px Nunito'; c.fillText('2026', 80, 140); c.beginPath(); c.arc(100, 210, 34, 0, Math.PI * 2); c.strokeStyle = '#c9a24a'; c.lineWidth = 6; c.stroke(); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.18), new THREE.MeshBasicMaterial({ map: t, transparent: true })); lab.position.set(0, 0.135, 0.0135); lab.userData.noOutline = true; g.add(lab);
  return g;
}

/* ================= ПОДОЗРИТЕЛЬНЫЕ ================= */

export const blinkers: THREE.MeshBasicMaterial[] = [];

function recorder(): THREE.Group {
  const g = new THREE.Group();
  const papers = rbox(0.21, 0.006, 0.29, 0.002, paper()); papers.position.set(-0.03, 0.003, -0.02); papers.rotation.y = 0.2; g.add(papers);
  const body = rbox(0.06, 0.025, 0.13, 0.012, mat('#3a3d44', 0.35, 0.3)); body.position.set(0.02, 0.019, 0.02); g.add(body);
  const grill = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.03), mat('#1c1e22', 0.8)); grill.rotation.x = -Math.PI / 2; grill.position.set(0.02, 0.0325, -0.015); grill.userData.noOutline = true; g.add(grill);
  const led = new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false }); blinkers.push(led);
  const ledM = sphere(0.006, led, 8, 6); ledM.position.set(0.038, 0.034, 0.065); ledM.userData.noOutline = true; g.add(ledM);
  const scr = screen(0.035, 0.018, canvasTex(128, 64, (c) => { c.fillStyle = '#9fd3b5'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#0c2a1a'; c.font = '700 30px "PT Mono", monospace'; c.fillText('● REC', 8, 44); }));
  scr.rotation.x = -Math.PI / 2; scr.position.set(0.02, 0.0325, 0.032); g.add(scr);
  return g;
}

function phoneStand(): THREE.Group {
  const g = new THREE.Group();
  const legs = mat('#2a2d33', 0.5);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.3; const l = cyl(0.004, 0.004, 0.13, legs, 6); l.position.set(Math.sin(a) * 0.035, 0.055, Math.cos(a) * 0.035); l.rotation.set(Math.cos(a) * 0.45, 0, -Math.sin(a) * 0.45); g.add(l); }
  const head = cyl(0.008, 0.008, 0.06, legs, 8); head.position.y = 0.14; g.add(head);
  const phone = rbox(0.075, 0.15, 0.009, 0.01, mat('#15171b', 0.3)); phone.position.set(0, 0.24, 0); g.add(phone);
  const ui = screen(0.066, 0.138, canvasTex(132, 276, (c) => {
    const gr = c.createLinearGradient(0, 0, 0, 276); gr.addColorStop(0, '#6d7f8f'); gr.addColorStop(1, '#3e4a55'); c.fillStyle = gr; c.fillRect(0, 0, 132, 276);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; for (const x of [44, 88]) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 276); c.stroke(); } for (const y of [92, 184]) { c.beginPath(); c.moveTo(0, y); c.lineTo(132, y); c.stroke(); }
    c.fillStyle = '#ff3b30'; c.beginPath(); c.arc(66, 246, 15, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(66, 246, 20, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#fff'; c.font = '700 14px "PT Mono"'; c.fillText('00:12:47', 34, 22);
  }));
  ui.position.set(0, 0.24, 0.0052); g.add(ui);
  const clamp = rbox(0.085, 0.02, 0.016, 0.004, legs); clamp.position.set(0, 0.17, 0); g.add(clamp);
  return g;
}

function formsFolder(): THREE.Group {
  const g = new THREE.Group();
  const f = rbox(0.25, 0.012, 0.33, 0.004, mat('#5b616b', 0.7)); f.position.y = 0.006; g.add(f);
  const t = canvasTex(300, 420, (c) => {
    c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, 300, 420); c.fillStyle = '#2a2d33'; c.font = '800 20px Nunito'; c.fillText('АКТ', 130, 40); c.font = '14px Nunito'; c.fillText('выполненных работ / оказанных услуг', 20, 64);
    c.strokeStyle = '#9aa1aa'; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(20, 100 + i * 30); c.lineTo(280, 100 + i * 30); c.stroke(); }
    c.fillStyle = '#5b616b'; c.font = '13px Nunito'; ['Исполнитель', 'Заказчик', 'Услуга', 'Цена по прайсу', 'Согласованная цена'].forEach((s, i) => c.fillText(s, 22, 95 + i * 30));
  });
  g.add(at(flatPaper(0.21, 0.29, t, 0.014), 0, 0.014, 0));
  const pen = cyl(0.005, 0.005, 0.15, mat('#2a2d33', 0.3, 0.4), 8); pen.rotation.z = Math.PI / 2; pen.rotation.y = -0.7; pen.position.set(0.06, 0.02, 0.06); g.add(pen);
  const clip = rbox(0.06, 0.01, 0.025, 0.004, metal()); clip.position.set(0, 0.018, -0.15); g.add(clip);
  return g;
}

/* ================= НЕЙТРАЛЬНЫЕ ================= */

function mugItem(label = 'ЛУЧШИЙ СТУДЕНТ', color = '#e6eaec'): THREE.Group {
  const g = new THREE.Group();
  const m = mat(color, 0.35);
  const body = cyl(0.055, 0.05, 0.11, m, 20); body.position.y = 0.055; g.add(body);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 8, 16, Math.PI), m); handle.rotation.z = -Math.PI / 2; handle.position.set(0.058, 0.058, 0); handle.castShadow = true; g.add(handle);
  const tea = cyl(0.05, 0.05, 0.004, mat('#6b3a1e', 0.2), 20); tea.position.y = 0.098; tea.userData.noOutline = true; g.add(tea);
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0555, 0.0555, 0.04, 20, 1, true, -0.7, 1.4), new THREE.MeshStandardMaterial({ map: canvasTex(256, 64, (c) => { c.fillStyle = COLORS.stamp; c.fillRect(0, 0, 256, 64); c.fillStyle = '#fff'; c.font = '800 28px Nunito'; c.fillText(label, 8, 44); }), roughness: 0.4 }));
  lab.position.y = 0.06; lab.userData.noOutline = true; g.add(lab);
  return g;
}

function spoonItem(): THREE.Group {
  const g = new THREE.Group();
  const saucer = cyl(0.09, 0.07, 0.015, mat('#f2f0e8', 0.3), 24); saucer.position.y = 0.008; g.add(saucer);
  const handle = rbox(0.014, 0.005, 0.15, 0.002, metal()); handle.position.set(0.02, 0.02, 0.02); handle.rotation.y = 0.5; g.add(handle);
  const bowl = sphere(0.022, metal(), 10, 6); bowl.scale.set(1, 0.3, 1.4); bowl.position.set(-0.02, 0.02, -0.045); g.add(bowl);
  return g;
}

function notebookItem(): THREE.Group {
  const g = new THREE.Group();
  const nb = rbox(0.17, 0.018, 0.23, 0.005, mat('#2f7d4f', 0.7)); nb.position.y = 0.009; g.add(nb);
  const label = flatPaper(0.08, 0.04, noteTex(['Матан'], { bg: '#fbfaf4', size: 44, w: 200, h: 100, pad: 30 }), 0.0185); label.position.z = -0.04; g.add(label);
  const spiral = cyl(0.004, 0.004, 0.22, metal(), 6); spiral.rotation.x = Math.PI / 2; spiral.position.set(-0.085, 0.018, 0); g.add(spiral);
  return g;
}

function pillowItem(color = '#9fb8d6', stripes = true): THREE.Group {
  const g = new THREE.Group();
  const p = rbox(0.42, 0.13, 0.3, 0.06, stripes ? new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = color; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 8; i++) c.fillRect(i * 16, 0, 6, 128); }), roughness: 0.95 }) : mat(color, 0.95));
  p.position.y = 0.065; p.rotation.y = 0.15; g.add(p);
  return g;
}

function plantItem(): THREE.Group {
  const g = new THREE.Group();
  const pot = cyl(0.08, 0.06, 0.13, mat('#b5532f', 0.8), 18); pot.position.y = 0.065; g.add(pot);
  const soil = cyl(0.075, 0.075, 0.01, mat('#3b2a1e', 0.95), 18); soil.position.y = 0.128; soil.userData.noOutline = true; g.add(soil);
  const leaf = mat('#4f7d3b', 0.8);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const l = sphere(0.05, leaf, 8, 6); l.scale.set(0.45, 1.4, 0.2); l.position.set(Math.sin(a) * 0.05, 0.2 + (i % 3) * 0.03, Math.cos(a) * 0.05); l.rotation.set(Math.cos(a) * 0.5, a, -Math.sin(a) * 0.5); g.add(l); }
  return g;
}

function napkinHolder(): THREE.Group {
  const g = new THREE.Group();
  const base = rbox(0.16, 0.015, 0.07, 0.005, mat('#8e6a45', 0.6)); base.position.y = 0.008; g.add(base);
  for (const s of [-1, 1]) { const side = rbox(0.16, 0.1, 0.008, 0.004, mat('#8e6a45', 0.6)); side.position.set(0, 0.06, s * 0.03); g.add(side); }
  const nap = rbox(0.14, 0.12, 0.045, 0.004, mat('#f6f4ec', 0.95)); nap.position.y = 0.075; g.add(nap);
  return g;
}

function newspaperItem(): THREE.Group {
  const g = new THREE.Group();
  const t = canvasTex(320, 420, (c) => {
    c.fillStyle = '#ece7da'; c.fillRect(0, 0, 320, 420); c.fillStyle = '#2a2d33'; c.font = '900 36px Nunito'; c.fillText('ВЕЧЕРНИЙ', 20, 46); c.fillText('РАЙОН', 20, 84);
    c.fillRect(20, 96, 280, 3); c.font = '800 18px Nunito'; c.fillText('Тарифы на ЖКХ снова выросли', 20, 126);
    c.fillStyle = '#9aa1aa'; c.fillRect(20, 140, 130, 100); for (let i = 0; i < 12; i++) c.fillRect(165, 140 + i * 10, 130, 5); for (let i = 0; i < 14; i++) c.fillRect(20, 260 + i * 10, 280, 5);
  });
  g.add(at(flatPaper(0.26, 0.34, t, 0.006, 0.2), 0, 0.006, 0));
  const fold = rbox(0.26, 0.006, 0.34, 0.002, mat('#e0dbcd', 0.95)); fold.position.y = 0.003; fold.rotation.y = 0.2; g.add(fold);
  return g;
}

function deskClock(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.16, 0.12, 0.06, 0.02, mat('#7a4e2f', 0.4)); body.position.y = 0.06; g.add(body);
  const face = plane(0.1, 0.1, canvasTex(128, 128, (c) => { c.fillStyle = '#fbfaf4'; c.beginPath(); c.arc(64, 64, 62, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2a2d33'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.fillRect(64 + Math.sin(a) * 48 - 2, 64 - Math.cos(a) * 48 - 5, 4, 10); } c.lineWidth = 4; c.strokeStyle = '#2a2d33'; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 26); c.moveTo(64, 64); c.lineTo(90, 70); c.stroke(); }), { transparent: true });
  face.position.set(0, 0.065, 0.031); face.userData.noOutline = true; g.add(face);
  return g;
}

function moveBox(): THREE.Group {
  const g = new THREE.Group();
  const b = rbox(0.4, 0.3, 0.32, 0.008, mat('#c9a77a', 0.9)); b.position.y = 0.15; g.add(b);
  const tape = rbox(0.41, 0.004, 0.06, 0.001, mat('#b8955f', 0.5)); tape.position.y = 0.302; g.add(tape);
  const lab = plane(0.2, 0.1, noteTex(['КУХНЯ', 'хрупкое!'], { bg: '#f6f4ec', ink: '#2a2d33', size: 38, w: 256, h: 128, lineH: 40, pad: 16 }));
  lab.position.set(0, 0.17, 0.161); lab.userData.noOutline = true; g.add(lab);
  return g;
}

function folded(color: string, w = 0.3, d = 0.22, h = 0.05, check = false): THREE.Group {
  const g = new THREE.Group();
  const m = check ? new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = color; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(255,255,255,.3)'; for (let i = 0; i < 8; i++) { c.fillRect(i * 16, 0, 6, 128); c.fillRect(0, i * 16, 128, 6); } }), roughness: 0.95 }) : mat(color, 0.95);
  for (let i = 0; i < 2; i++) { const l = rbox(w, h / 2, d, 0.02, m); l.position.y = h / 4 + i * h / 2; l.rotation.y = i * 0.06; g.add(l); }
  return g;
}

function mousepad(): THREE.Group {
  const g = new THREE.Group();
  const p = rbox(0.28, 0.006, 0.22, 0.02, new THREE.MeshStandardMaterial({ map: canvasTex(256, 200, (c) => { const gr = c.createLinearGradient(0, 0, 256, 200); gr.addColorStop(0, '#2f4f8f'); gr.addColorStop(1, '#1b2a4a'); c.fillStyle = gr; c.fillRect(0, 0, 256, 200); c.fillStyle = '#f1d04b'; c.font = '900 26px Nunito'; c.fillText('GG', 196, 186); }), roughness: 0.9 }));
  p.position.y = 0.003; g.add(p);
  const mouse = sphere(0.035, mat('#2a2d33', 0.4), 14, 10); mouse.scale.set(0.8, 0.45, 1.25); mouse.position.set(0.04, 0.02, 0.02); g.add(mouse);
  return g;
}

function vaseItem(): THREE.Group {
  const g = new THREE.Group();
  const v = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(0.06, 0.005), new THREE.Vector2(0.09, 0.08), new THREE.Vector2(0.05, 0.2), new THREE.Vector2(0.035, 0.26), new THREE.Vector2(0.045, 0.28)], 28), mat('#2f5d55', 0.2, 0.1));
  v.castShadow = true; g.add(v);
  for (let i = 0; i < 3; i++) { const s = cyl(0.003, 0.003, 0.25, mat('#5a6b3c', 0.8), 5); s.position.set((i - 1) * 0.02, 0.38, 0); s.rotation.z = (i - 1) * 0.2; g.add(s); const b = sphere(0.025, mat('#e8e2d6', 0.9), 8, 6); b.position.set((i - 1) * 0.045, 0.5, 0); g.add(b); }
  return g;
}

function magazineItem(): THREE.Group {
  const g = new THREE.Group();
  const t = canvasTex(300, 400, (c) => { const gr = c.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#1b2a4a'); gr.addColorStop(1, '#2f7dd6'); c.fillStyle = gr; c.fillRect(0, 0, 300, 400); c.fillStyle = '#f1d04b'; c.font = '900 52px Nunito'; c.fillText('ТЕННИС', 22, 70); c.fillStyle = '#fff'; c.font = '800 20px Nunito'; c.fillText('Подача как у профи:', 22, 330); c.fillText('5 упражнений', 22, 356); c.fillStyle = '#d7f05a'; c.beginPath(); c.arc(200, 200, 60, 0, Math.PI * 2); c.fill(); });
  g.add(at(flatPaper(0.21, 0.28, t, 0.005, -0.25), 0, 0.005, 0));
  const under = rbox(0.21, 0.004, 0.28, 0.001, mat('#e6eaec', 0.6)); under.position.y = 0.002; under.rotation.y = -0.1; g.add(under);
  return g;
}

function pensCup(): THREE.Group {
  const g = new THREE.Group();
  const cup = cyl(0.045, 0.04, 0.1, mat('#3e4a5a', 0.5), 18); cup.position.y = 0.05; g.add(cup);
  const cols = ['#1e3c8c', '#a3294a', '#2a2d33', '#f1d04b', '#2f7d4f'];
  cols.forEach((cl, i) => { const p = cyl(0.005, 0.005, 0.15, mat(cl, 0.4), 6); const a = (i / cols.length) * Math.PI * 2; p.position.set(Math.sin(a) * 0.02, 0.12, Math.cos(a) * 0.02); p.rotation.set(Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2); g.add(p); });
  return g;
}

function waterBottle(): THREE.Group {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(0.035, 0.002), new THREE.Vector2(0.036, 0.16), new THREE.Vector2(0.02, 0.2), new THREE.Vector2(0.014, 0.22)], 20),
    new THREE.MeshStandardMaterial({ color: '#bfe1f2', roughness: 0.08, transparent: true, opacity: 0.6 }));
  g.add(b);
  const cap = cyl(0.015, 0.015, 0.02, mat('#2f7dd6', 0.4), 12); cap.position.y = 0.23; g.add(cap);
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0365, 0.0365, 0.06, 20, 1, true), new THREE.MeshStandardMaterial({ map: canvasTex(256, 64, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#2f7dd6'; c.font = '900 30px Nunito'; c.fillText('АКВА · 0,5', 20, 44); }) }));
  lab.position.y = 0.09; lab.userData.noOutline = true; g.add(lab);
  return g;
}

function deptFolder(): THREE.Group {
  const g = new THREE.Group();
  const f = rbox(0.05, 0.3, 0.24, 0.006, mat('#a3294a', 0.6)); f.position.y = 0.15; f.rotation.z = 0.08; g.add(f);
  const lab = plane(0.035, 0.2, canvasTex(64, 360, (c) => { c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, 64, 360); c.save(); c.translate(42, 340); c.rotate(-Math.PI / 2); c.fillStyle = '#2a2d33'; c.font = '700 26px Nunito'; c.fillText('Отдел продаж · Q4', 0, 0); c.restore(); }));
  lab.position.set(0.026, 0.16, 0); lab.rotation.y = Math.PI / 2; lab.rotation.z = 0; lab.userData.noOutline = true; g.add(lab);
  return g;
}

function paperBin(): THREE.Group {
  const g = new THREE.Group();
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.28, 20, 1, true), mat('#3e4a5a', 0.6, 0, { side: THREE.DoubleSide }));
  bin.position.y = 0.14; bin.castShadow = true; g.add(bin);
  const bottom = cyl(0.1, 0.1, 0.01, mat('#3e4a5a', 0.6), 20); bottom.position.y = 0.005; g.add(bottom);
  for (let i = 0; i < 4; i++) { const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), paper()); ball.position.set((i % 2 - 0.5) * 0.08, 0.25 + Math.floor(i / 2) * 0.04, (i < 2 ? -1 : 1) * 0.03); ball.castShadow = true; g.add(ball); }
  return g;
}

/* ================= реестр ================= */

const ITEM_FACTORIES: Record<string, () => THREE.Group> = {
  B_LOW: envelopeCoupons,
  B_MID: folderPlan,
  B_HIGH: receiptBox,
  K_LOW: printout,
  K_MID: manualTabs,
  K_HIGH: multimeter,
  U_LOW: () => stickerOnPad(['можно', 'починить', 'позже'], false),
  U_MID: deskCalendar,
  U_HIGH: () => stickerOnPad(['нужно', 'сегодня!'], true),
  AMB_LAPTOP: laptopItem,
  AMB_TVBOX: tvBox,
  AMB_LAMP: designerLamp,
  AMB_CUP: trophy,
  AMB_AWARD: awardPlaque,
  SUS_RECORDER: recorder,
  SUS_PHONE: phoneStand,
  SUS_FOLDER: formsFolder,
  mug: () => mugItem(),
  spoon: spoonItem,
  notebook: notebookItem,
  pillow: () => pillowItem(),
  plant: plantItem,
  napkins: napkinHolder,
  newspaper: newspaperItem,
  deskclock: deskClock,
  movebox: moveBox,
  towel_k: () => folded('#d64d3b', 0.3, 0.2, 0.04, true),
  plaid: () => folded('#8a5a3c', 0.38, 0.3, 0.09, true),
  mousepad,
  vase: vaseItem,
  cushion: () => pillowItem('#c9a24a', false),
  magazine: magazineItem,
  towel: () => folded('#f2f0e8', 0.3, 0.2, 0.06),
  pens: pensCup,
  water: waterBottle,
  deptfolder: deptFolder,
  paperbin: paperBin,
};

export function makeItem(id: string): THREE.Group {
  const f = ITEM_FACTORIES[id];
  if (!f) throw new Error(`Нет модели для предмета ${id}`);
  return f();
}

/* ================= УСТРОЙСТВА ================= */

export interface DeviceModel { group: THREE.Group; onTable: boolean; wall?: boolean }

function kettle(): THREE.Group {
  const g = new THREE.Group();
  const base = cyl(0.11, 0.12, 0.03, dark(), 24); base.position.y = 0.015; g.add(base);
  const body = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(0.1, 0.0), new THREE.Vector2(0.105, 0.05), new THREE.Vector2(0.09, 0.2), new THREE.Vector2(0.06, 0.23), new THREE.Vector2(0.001, 0.235)], 28), mat('#c9d4dc', 0.25, 0.6));
  body.position.y = 0.03; body.castShadow = true; g.add(body);
  const handle = rbox(0.03, 0.18, 0.05, 0.012, dark()); handle.position.set(-0.11, 0.15, 0); g.add(handle);
  const spout = cyl(0.02, 0.03, 0.06, mat('#c9d4dc', 0.25, 0.6), 10); spout.rotation.z = -1.0; spout.position.set(0.11, 0.21, 0); g.add(spout);
  const win = rbox(0.015, 0.12, 0.03, 0.006, new THREE.MeshStandardMaterial({ color: '#7fb6d6', roughness: 0.1, transparent: true, opacity: 0.7 })); win.position.set(0, 0.12, 0.1); g.add(win);
  const led = sphere(0.008, new THREE.MeshBasicMaterial({ color: '#4cff9a', toneMapped: false }), 8, 6); led.position.set(-0.1, 0.05, 0.03); g.add(led);
  return g;
}

function microwave(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.56, 0.32, 0.4, 0.035, mat('#f0efe9', 0.45)); body.position.y = 0.16; g.add(body);
  const door = rbox(0.38, 0.25, 0.02, 0.02, mat('#222428', 0.25, 0.1)); door.position.set(-0.07, 0.16, 0.205); g.add(door);
  const panel = rbox(0.12, 0.27, 0.02, 0.012, mat('#d7d6cf', 0.5)); panel.position.set(0.2, 0.16, 0.205); g.add(panel);
  const disp = screen(0.08, 0.035, canvasTex(128, 56, (c) => { c.fillStyle = '#0d1a12'; c.fillRect(0, 0, 128, 56); c.fillStyle = '#4cff9a'; c.font = '700 34px "PT Mono"'; c.fillText('0:00', 18, 42); }));
  disp.position.set(0.2, 0.25, 0.217); g.add(disp);
  for (let i = 0; i < 3; i++) { const k = cyl(0.016, 0.016, 0.015, dark(), 12); k.rotation.x = Math.PI / 2; k.position.set(0.2, 0.18 - i * 0.05, 0.218); g.add(k); }
  const handle = rbox(0.02, 0.2, 0.03, 0.008, metal()); handle.position.set(0.11, 0.16, 0.225); g.add(handle);
  return g;
}

function tvDevice(): THREE.Group {
  const g = new THREE.Group();
  const frame = rbox(0.9, 0.54, 0.05, 0.015, mat('#1b1d22', 0.4)); frame.position.y = 0.38; g.add(frame);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.5), new THREE.MeshStandardMaterial({ color: '#0c0d10', roughness: 0.15, metalness: 0.2 }));
  scr.position.set(0, 0.38, 0.026); scr.userData.noOutline = true; g.add(scr);
  const stand = rbox(0.3, 0.02, 0.18, 0.008, mat('#2a2d33', 0.4)); stand.position.y = 0.01; g.add(stand);
  const neck = rbox(0.06, 0.1, 0.04, 0.01, mat('#2a2d33', 0.4)); neck.position.y = 0.07; g.add(neck);
  const led = sphere(0.006, new THREE.MeshBasicMaterial({ color: '#ff3b30', toneMapped: false }), 6, 4); led.position.set(0.4, 0.12, 0.03); g.add(led);
  return g;
}

function washer(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.6, 0.85, 0.58, 0.03, mat('#eef0ef', 0.45)); body.position.y = 0.425; g.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 12, 36), mat('#b9bcc2', 0.3, 0.7)); ring.position.set(0, 0.4, 0.29); g.add(ring);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), new THREE.MeshStandardMaterial({ color: '#2a3a48', roughness: 0.05, metalness: 0.2 })); glass.position.set(0, 0.4, 0.3); g.add(glass);
  const panel = rbox(0.58, 0.1, 0.02, 0.01, mat('#d7d9d8', 0.5)); panel.position.set(0, 0.79, 0.29); g.add(panel);
  const knob = cyl(0.035, 0.035, 0.02, mat('#b9bcc2', 0.3, 0.7), 20); knob.rotation.x = Math.PI / 2; knob.position.set(0.18, 0.79, 0.305); g.add(knob);
  const drw = rbox(0.16, 0.06, 0.02, 0.008, mat('#eef0ef', 0.5)); drw.position.set(-0.18, 0.79, 0.302); g.add(drw);
  const hatch = rbox(0.12, 0.08, 0.01, 0.005, mat('#d7d9d8', 0.5)); hatch.position.set(0.2, 0.08, 0.292); g.add(hatch);
  return g;
}

function fridgeDevice(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.62, 1.75, 0.62, 0.05, mat('#eceae2', 0.45)); body.position.y = 0.875; g.add(body);
  const line = rbox(0.625, 0.012, 0.02, 0.004, mat('#b9b6ac', 0.6)); line.position.set(0, 1.2, 0.31); g.add(line);
  for (const y of [1.45, 0.9]) { const h = rbox(0.03, 0.26, 0.04, 0.012, metal()); h.position.set(-0.24, y, 0.33); g.add(h); }
  const badge = plane(0.16, 0.04, canvasTex(256, 64, (c) => { c.fillStyle = '#c9ccd0'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#2a2d33'; c.font = 'italic 800 40px Nunito'; c.fillText('Бирюса', 40, 46); }), { metalness: 0.6, roughness: 0.3 });
  badge.position.set(0.15, 1.65, 0.312); badge.userData.noOutline = true; g.add(badge);
  return g;
}

function speakerDevice(): THREE.Group {
  const g = new THREE.Group();
  const body = cyl(0.07, 0.075, 0.2, new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = '#3e4148'; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(255,255,255,.08)'; for (let y = 0; y < 128; y += 4) for (let x = (y / 4) % 2 * 2; x < 128; x += 4) c.fillRect(x, y, 2, 2); }), roughness: 0.95 }), 32);
  body.position.y = 0.1; g.add(body);
  const top = cyl(0.068, 0.068, 0.01, mat('#2a2d33', 0.3), 32); top.position.y = 0.205; g.add(top);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.006, 8, 40), new THREE.MeshBasicMaterial({ color: '#5ab0ff', toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.212; ring.userData.noOutline = true; g.add(ring);
  return g;
}

function dishwasher(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.6, 0.82, 0.58, 0.02, mat('#d7dadc', 0.35, 0.4)); body.position.y = 0.41; g.add(body);
  const handle = rbox(0.4, 0.025, 0.03, 0.01, metal()); handle.position.set(0, 0.72, 0.3); g.add(handle);
  const strip = screen(0.3, 0.04, canvasTex(256, 32, (c) => { c.fillStyle = '#1b1d22'; c.fillRect(0, 0, 256, 32); c.fillStyle = '#5ab0ff'; c.font = '700 20px "PT Mono"'; c.fillText('ECO 50°  1:45', 30, 23); }));
  strip.position.set(0, 0.79, 0.292); g.add(strip);
  return g;
}

function aircon(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.9, 0.3, 0.22, 0.06, mat('#f4f5f3', 0.4)); g.add(body);
  const flap = rbox(0.8, 0.04, 0.03, 0.01, mat('#e2e4e2', 0.4)); flap.position.set(0, -0.12, 0.1); flap.rotation.x = 0.5; g.add(flap);
  const disp = screen(0.06, 0.025, canvasTex(96, 40, (c) => { c.fillStyle = '#e6eaec'; c.fillRect(0, 0, 96, 40); c.fillStyle = '#2f7dd6'; c.font = '700 26px "PT Mono"'; c.fillText('18°', 26, 30); }));
  disp.position.set(0.32, 0.02, 0.112); g.add(disp);
  return g;
}

function vrDevice(): THREE.Group {
  const g = new THREE.Group();
  const head = sphere(0.09, mat('#e6e2d6', 0.6), 16, 12); head.scale.set(0.9, 1.15, 0.9); head.position.y = 0.26; g.add(head);
  const neck = cyl(0.03, 0.05, 0.12, mat('#e6e2d6', 0.6), 12); neck.position.y = 0.1; g.add(neck);
  const base = cyl(0.08, 0.09, 0.03, mat('#2a2d33', 0.4), 20); base.position.y = 0.015; g.add(base);
  const visor = rbox(0.2, 0.1, 0.1, 0.035, mat('#f2f2f2', 0.35)); visor.position.set(0, 0.28, 0.07); g.add(visor);
  const face = rbox(0.18, 0.08, 0.01, 0.02, mat('#15171b', 0.2)); face.position.set(0, 0.28, 0.122); g.add(face);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 8, 30), mat('#2a2d33', 0.7)); strap.rotation.x = Math.PI / 2; strap.position.y = 0.28; g.add(strap);
  return g;
}

function coffeeMachine(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.32, 0.4, 0.42, 0.03, mat('#1b1d22', 0.35, 0.3)); body.position.y = 0.2; g.add(body);
  const front = rbox(0.28, 0.2, 0.02, 0.01, mat('#c9ccd0', 0.25, 0.8)); front.position.set(0, 0.24, 0.21); g.add(front);
  const spout = rbox(0.08, 0.05, 0.06, 0.01, mat('#c9ccd0', 0.25, 0.8)); spout.position.set(0, 0.17, 0.22); g.add(spout);
  const tray = rbox(0.24, 0.02, 0.12, 0.006, mat('#8a8d92', 0.3, 0.7)); tray.position.set(0, 0.03, 0.2); g.add(tray);
  const cup = cyl(0.03, 0.025, 0.06, mat('#f2f0e8', 0.3), 16); cup.position.set(0, 0.07, 0.22); g.add(cup);
  const disp = screen(0.1, 0.04, canvasTex(160, 64, (c) => { c.fillStyle = '#0d0f12'; c.fillRect(0, 0, 160, 64); c.fillStyle = '#ffb067'; c.font = '700 22px Nunito'; c.fillText('ЭСПРЕССО', 18, 40); }));
  disp.position.set(0, 0.36, 0.212); g.add(disp);
  return g;
}

function tennisMachine(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.5, 0.35, 0.45, 0.04, mat('#2f6b4a', 0.5)); body.position.y = 0.3; g.add(body);
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.25, 4, 1, true), mat('#1b1d22', 0.6, 0, { side: THREE.DoubleSide })); hopper.rotation.y = Math.PI / 4; hopper.position.y = 0.6; hopper.castShadow = true; g.add(hopper);
  for (let i = 0; i < 9; i++) { const b = sphere(0.033, mat('#d7f05a', 0.8), 10, 8); b.position.set((i % 3 - 1) * 0.08, 0.66 + Math.floor(i / 3) * 0.02, (Math.floor(i / 3) - 1) * 0.08); g.add(b); }
  const mouth = cyl(0.05, 0.05, 0.08, mat('#1b1d22', 0.4), 16); mouth.rotation.x = Math.PI / 2; mouth.position.set(0, 0.36, 0.25); g.add(mouth);
  for (const s of [-1, 1]) { const w = cyl(0.08, 0.08, 0.04, mat('#2a2d33', 0.7), 18); w.rotation.z = Math.PI / 2; w.position.set(s * 0.27, 0.08, -0.12); g.add(w); }
  return g;
}

function robovac(): THREE.Group {
  const g = new THREE.Group();
  const body = cyl(0.17, 0.17, 0.07, mat('#2a2d33', 0.35, 0.2), 36); body.position.y = 0.045; g.add(body);
  const top = cyl(0.12, 0.12, 0.01, mat('#3e4148', 0.2), 36); top.position.y = 0.083; g.add(top);
  const lidar = cyl(0.04, 0.04, 0.03, mat('#c9ccd0', 0.3, 0.7), 20); lidar.position.set(0, 0.1, -0.04); g.add(lidar);
  const led = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.003, 6, 20), new THREE.MeshBasicMaterial({ color: '#4cff9a', toneMapped: false })); led.rotation.x = Math.PI / 2; led.position.set(0, 0.09, 0.07); led.userData.noOutline = true; g.add(led);
  const brush = cyl(0.03, 0.03, 0.005, mat('#a3294a', 0.6), 6); brush.position.set(0.12, 0.012, 0.1); g.add(brush);
  return g;
}

function printerDevice(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.48, 0.3, 0.42, 0.02, mat('#e8eaec', 0.45)); body.position.y = 0.15; g.add(body);
  const lid = rbox(0.46, 0.04, 0.38, 0.01, mat('#d2d6da', 0.4)); lid.position.y = 0.32; g.add(lid);
  const tray = rbox(0.3, 0.012, 0.16, 0.004, mat('#2a2d33', 0.5)); tray.position.set(0, 0.14, 0.27); tray.rotation.x = 0.15; g.add(tray);
  const paperOut = rbox(0.21, 0.002, 0.14, 0.001, paper()); paperOut.position.set(0, 0.15, 0.26); paperOut.rotation.x = 0.15; g.add(paperOut);
  const disp = screen(0.1, 0.05, canvasTex(160, 80, (c) => { c.fillStyle = '#1b2a4a'; c.fillRect(0, 0, 160, 80); c.fillStyle = '#ffb067'; c.font = '700 18px Nunito'; c.fillText('Нет бумаги', 14, 34); c.fillStyle = '#fff'; c.font = '14px Nunito'; c.fillText('Лоток 1', 14, 58); }));
  disp.position.set(0.14, 0.28, 0.212); disp.rotation.x = -0.4; g.add(disp);
  return g;
}

function projectorDevice(): THREE.Group {
  const g = new THREE.Group();
  const body = rbox(0.34, 0.12, 0.26, 0.03, mat('#f2f2f0', 0.4)); body.position.y = 0.06; g.add(body);
  const lens = cyl(0.045, 0.05, 0.04, mat('#1b1d22', 0.2), 24); lens.rotation.x = Math.PI / 2; lens.position.set(-0.08, 0.065, 0.14); g.add(lens);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), new THREE.MeshStandardMaterial({ color: '#2a4a6a', roughness: 0.05, metalness: 0.4 })); glass.position.set(-0.08, 0.065, 0.161); g.add(glass);
  const vent = plane(0.1, 0.06, canvasTex(64, 40, (c) => { c.fillStyle = '#d2d6da'; c.fillRect(0, 0, 64, 40); c.fillStyle = '#2a2d33'; for (let i = 0; i < 6; i++) c.fillRect(4, 4 + i * 6, 56, 3); }));
  vent.position.set(0.1, 0.065, 0.131); vent.userData.noOutline = true; g.add(vent);
  return g;
}

function laptopDevice(): THREE.Group {
  // игровой ноутбук: чёрный, толстый, с подсветкой — чтобы не путать с «дорогим ноутбуком»-уликой
  const g = new THREE.Group(); const body = mat('#1b1d22', 0.45, 0.2);
  const base = rbox(0.44, 0.035, 0.3, 0.012, body); base.position.y = 0.018; g.add(base);
  const kb = screen(0.38, 0.13, canvasTex(256, 96, (c) => { const gr = c.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, '#ff3b6b'); gr.addColorStop(0.5, '#5ab0ff'); gr.addColorStop(1, '#4cff9a'); c.fillStyle = '#111'; c.fillRect(0, 0, 256, 96); c.globalAlpha = 0.85; for (let y = 0; y < 5; y++) for (let x = 0; x < 15; x++) { c.fillStyle = gr; c.fillRect(4 + x * 17, 6 + y * 18, 13, 13); } }));
  kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.0365, 0.03); g.add(kb);
  const lid = new THREE.Group(); const lm = rbox(0.44, 0.28, 0.02, 0.01, body); lm.position.y = 0.14; lid.add(lm);
  const scr = screen(0.4, 0.24, canvasTex(400, 240, (c) => { c.fillStyle = '#0a1a3a'; c.fillRect(0, 0, 400, 240); c.fillStyle = '#ffffff'; c.font = '700 22px "PT Mono", monospace'; c.fillText('CPU 98°C', 24, 60); c.fillStyle = '#ff3b6b'; c.fillText('THERMAL SHUTDOWN', 24, 100); c.fillStyle = 'rgba(255,255,255,.4)'; c.font = '16px "PT Mono"'; c.fillText('_', 24, 140); }));
  scr.position.set(0, 0.14, 0.011); lid.add(scr);
  lid.position.set(0, 0.035, -0.14); lid.rotation.x = -0.3; g.add(lid);
  return g;
}

const DEVICE_FACTORIES: Record<string, () => DeviceModel> = {
  kettle: () => ({ group: kettle(), onTable: true }),
  microwave: () => ({ group: microwave(), onTable: true }),
  laptop: () => ({ group: laptopDevice(), onTable: true }),
  tv: () => ({ group: tvDevice(), onTable: true }),
  washer: () => ({ group: washer(), onTable: false }),
  fridge: () => ({ group: fridgeDevice(), onTable: false }),
  speaker: () => ({ group: speakerDevice(), onTable: true }),
  dishwasher: () => ({ group: dishwasher(), onTable: false }),
  aircon: () => ({ group: aircon(), onTable: false, wall: true }),
  vr: () => ({ group: vrDevice(), onTable: true }),
  coffee: () => ({ group: coffeeMachine(), onTable: true }),
  tennis: () => ({ group: tennisMachine(), onTable: false }),
  robovac: () => ({ group: robovac(), onTable: false }),
  printer: () => ({ group: printerDevice(), onTable: true }),
  projector: () => ({ group: projectorDevice(), onTable: true }),
};

export function makeDevice(id: string): DeviceModel {
  const f = DEVICE_FACTORIES[id];
  if (!f) throw new Error(`Нет модели устройства ${id}`);
  const d = f();
  d.group.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return d;
}

export const ALL_ITEM_IDS = Object.keys(ITEM_FACTORIES);
export const ALL_DEVICE_IDS = Object.keys(DEVICE_FACTORIES);
export { umat };
