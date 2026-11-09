// Процедурные звуки на Web Audio API: без файлов и лицензий.
// Шины: master → (sfx | music | ambient). Общая громкость — master, музыка — отдельно.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let music: GainNode | null = null;
let volume = 1;
let musicVolume = 0.7;
let ambient: { stop: () => void } | null = null;

function ac(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext();
      master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination);
      music = ctx.createGain(); music.gain.value = musicVolume * 0.55; music.connect(master);
    } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export const audioCtx = () => ac();
export const musicBus = () => { ac(); return music; };
export function setVolume(v: number) { volume = v; if (master) master.gain.value = v; }
export function setMusicVolume(v: number) { musicVolume = v; if (music) music.gain.value = v * 0.55; }

/** Браузеры запускают звук только после действия игрока. */
export function unlockAudio(cb?: () => void) {
  const go = () => { ac(); cb?.(); window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go); };
  window.addEventListener('pointerdown', go); window.addEventListener('keydown', go);
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.2, when = 0, slide = 0, dest?: AudioNode) {
  const a = ac(); if (!a || !master) return;
  const t = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest ?? master); o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur: number, gain = 0.2, filter = 2000, when = 0, q = 0.8, type: BiquadFilterType = 'bandpass', dest?: AudioNode, sweep = 0) {
  const a = ac(); if (!a || !master) return;
  const t = a.currentTime + when;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(filter, t); if (sweep) f.frequency.linearRampToValueAtTime(filter + sweep, t + dur); f.Q.value = q;
  const g = a.createGain(); g.gain.value = gain;
  src.connect(f); f.connect(g); g.connect(dest ?? master); src.start(t);
}

export type Sfx = 'click' | 'paper' | 'paperClose' | 'speech' | 'ok' | 'no' | 'stamp' | 'cash' | 'success' | 'fail' | 'tick' | 'tickUrgent' | 'scan' | 'spark' | 'screw' | 'beep' | 'door' | 'truck' | 'hit' | 'steps' | 'moodDown' | 'hover' | 'pin' | 'print';

export function sfx(name: Sfx) {
  switch (name) {
    case 'click': tone(900, 0.05, 'square', 0.05); break;
    case 'hover': tone(1400, 0.025, 'sine', 0.025); break;
    case 'pin': tone(2200, 0.04, 'triangle', 0.05); noise(0.05, 0.1, 5000); break;
    case 'paper': noise(0.18, 0.25, 3500, 0, 0.6); noise(0.12, 0.15, 6000, 0.06); break;
    case 'paperClose': noise(0.12, 0.2, 2500); break;
    case 'speech': for (let i = 0; i < 5; i++) tone(180 + Math.random() * 90, 0.07, 'triangle', 0.06, i * 0.07); break;
    case 'ok': tone(523, 0.12, 'triangle', 0.15); tone(784, 0.18, 'triangle', 0.15, 0.1); break;
    case 'no': tone(330, 0.16, 'sawtooth', 0.08); tone(247, 0.24, 'sawtooth', 0.08, 0.12); break;
    case 'moodDown': tone(300, 0.25, 'sine', 0.08, 0, -90); break;
    case 'stamp': noise(0.25, 0.9, 180, 0, 0.7, 'lowpass'); tone(70, 0.3, 'sine', 0.5, 0, -30); break;
    case 'cash': tone(1318, 0.08, 'square', 0.06); tone(1760, 0.3, 'square', 0.06, 0.08); noise(0.2, 0.15, 5000, 0.05); break;
    case 'print': for (let i = 0; i < 14; i++) noise(0.05, 0.12, 2600 + (i % 2) * 400, i * 0.11, 2); break;
    case 'success': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.13, i * 0.08)); break;
    case 'fail': tone(220, 0.35, 'sawtooth', 0.1, 0, -120); noise(0.2, 0.3, 900, 0); break;
    case 'tick': tone(1500, 0.03, 'square', 0.03); break;
    case 'tickUrgent': tone(1900, 0.04, 'square', 0.05); tone(950, 0.04, 'square', 0.03, 0.05); break;
    case 'scan': for (let i = 0; i < 6; i++) tone(600 + i * 120, 0.06, 'sine', 0.06, i * 0.06); break;
    case 'spark': noise(0.15, 0.5, 4000, 0, 2); tone(1800, 0.05, 'square', 0.05); break;
    case 'screw': for (let i = 0; i < 4; i++) noise(0.04, 0.2, 2200, i * 0.05, 3); break;
    case 'beep': tone(2000, 0.08, 'square', 0.05); break;
    case 'door': noise(0.12, 0.35, 900, 0, 1.2); noise(0.12, 0.35, 900, 0.18, 1.2); noise(0.5, 0.3, 300, 0.7, 0.5, 'lowpass'); tone(110, 0.25, 'sine', 0.15, 0.75); break;
    case 'steps': for (let i = 0; i < 6; i++) { noise(0.07, 0.25, 500 + (i % 2) * 120, i * 0.36, 1.5, 'bandpass'); } noise(0.5, 0.25, 260, 2.3, 0.5, 'lowpass'); break;
    case 'truck': noise(1.2, 0.4, 120, 0, 0.5, 'lowpass'); tone(80, 1.0, 'sawtooth', 0.05, 0, 30); break;
    case 'hit': tone(880, 0.08, 'triangle', 0.12); break;
  }
}

/* ---------------- фон локаций ---------------- */

/** Фоновый шум локации и случайные события «за стеной». */
export function startAmbient(locId: string) {
  stopAmbient();
  const a = ac(); if (!a || !master) return;
  const bus = a.createGain(); bus.gain.value = 0; bus.connect(master);
  bus.gain.linearRampToValueAtTime(1, a.currentTime + 1.5);
  const stops: (() => void)[] = [];
  // ровный шум помещения
  const buf = a.createBuffer(1, a.sampleRate * 3, a.sampleRate);
  const dd = buf.getChannelData(0); let last = 0; for (let i = 0; i < dd.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; dd[i] = last * 3; }
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = locId === 'elite' ? 380 : 900;
  const rg = a.createGain(); rg.gain.value = locId === 'elite' ? 0.09 : 0.06;
  src.connect(f); f.connect(rg); rg.connect(bus); src.start(); stops.push(() => src.stop());
  // гул ламп в общежитии и офисе, гул холодильника в хрущёвке
  if (locId === 'dorm' || locId === 'office' || locId === 'khr') {
    const hum = a.createOscillator(); hum.frequency.value = locId === 'khr' ? 55 : 100; const hg = a.createGain(); hg.gain.value = locId === 'khr' ? 0.012 : 0.008;
    hum.connect(hg); hg.connect(bus); hum.start(); stops.push(() => hum.stop());
  }
  // часы в хрущёвке
  if (locId === 'khr') { const id = window.setInterval(() => tone(2400, 0.015, 'square', 0.012, 0, 0, bus), 1000); stops.push(() => clearInterval(id)); }
  // случайные события
  const events: Record<string, (() => void)[]> = {
    dorm: [
      () => { noise(0.35, 0.35, 160, 0, 0.6, 'lowpass', bus); },                                      // хлопнула дверь
      () => { for (let i = 0; i < 6; i++) tone(200 + Math.random() * 160, 0.09, 'triangle', 0.012, i * 0.11, 0, bus); }, // голоса в коридоре
      () => { for (let i = 0; i < 8; i++) tone(110, 0.12, 'square', 0.006, i * 0.25, 0, bus); },        // бас из соседней комнаты
    ],
    khr: [
      () => { tone(2600, 0.12, 'sine', 0.012, 0, 600, bus); tone(2900, 0.1, 'sine', 0.01, 0.16, 500, bus); }, // воробьи за окном
      () => { noise(1.6, 0.06, 500, 0, 0.6, 'lowpass', bus, 400); },                                    // проехала машина
      () => { noise(0.4, 0.05, 1200, 0, 3, 'bandpass', bus); },                                         // вода в трубах
    ],
    new: [
      () => { for (let i = 0; i < 3; i++) tone(180, 0.5, 'sawtooth', 0.01, i * 0.7, 40, bus); },         // дрель у соседей
      () => { for (let i = 0; i < 4; i++) noise(0.06, 0.12, 700, i * 0.45, 2, 'bandpass', bus); },      // молоток
    ],
    elite: [
      () => { noise(3, 0.05, 300, 0, 0.5, 'lowpass', bus, 200); },                                      // город за панорамой
      () => { tone(523, 1.2, 'sine', 0.006, 0, 0, bus); tone(659, 1.2, 'sine', 0.005, 0.02, 0, bus); }, // лифт
    ],
    office: [
      () => { for (let i = 0; i < 10; i++) noise(0.03, 0.05, 3000, i * 0.09 + Math.random() * 0.04, 3, 'bandpass', bus); }, // клавиатура
      () => { for (let i = 0; i < 2; i++) { tone(880, 0.35, 'sine', 0.008, i * 0.55, 0, bus); tone(1046, 0.35, 'sine', 0.006, i * 0.55, 0, bus); } }, // телефон
      () => { noise(1.2, 0.04, 1600, 0, 1.5, 'bandpass', bus); },                                       // принтер
    ],
  };
  const pool = events[locId] ?? [];
  let alive = true;
  const loop = () => { if (!alive) return; if (pool.length) pool[Math.floor(Math.random() * pool.length)](); timeout = window.setTimeout(loop, 4500 + Math.random() * 7000); };
  let timeout = window.setTimeout(loop, 2500);
  stops.push(() => { alive = false; clearTimeout(timeout); });
  ambient = { stop: () => { try { bus.gain.cancelScheduledValues(a.currentTime); bus.gain.setValueAtTime(bus.gain.value, a.currentTime); bus.gain.linearRampToValueAtTime(0, a.currentTime + 0.6); setTimeout(() => { stops.forEach((s) => { try { s(); } catch { /* */ } }); bus.disconnect(); }, 700); } catch { /* */ } } };
}

export function stopAmbient() { ambient?.stop(); ambient = null; }
