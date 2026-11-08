// Процедурные звуки на Web Audio API: без файлов и лицензий.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 1;
let ambient: { stop: () => void } | null = null;

function ac(): AudioContext | null {
  if (!ctx) {
    try { ctx = new AudioContext(); master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setVolume(v: number) { volume = v; if (master) master.gain.value = v; }

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.2, when = 0, slide = 0) {
  const a = ac(); if (!a || !master) return;
  const t = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur: number, gain = 0.2, filter = 2000, when = 0, q = 0.8, type: BiquadFilterType = 'bandpass') {
  const a = ac(); if (!a || !master) return;
  const t = a.currentTime + when;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = filter; f.Q.value = q;
  const g = a.createGain(); g.gain.value = gain;
  src.connect(f); f.connect(g); g.connect(master); src.start(t);
}

export type Sfx = 'click' | 'paper' | 'paperClose' | 'speech' | 'ok' | 'no' | 'stamp' | 'cash' | 'success' | 'fail' | 'tick' | 'scan' | 'spark' | 'screw' | 'beep' | 'door' | 'truck' | 'hit';

export function sfx(name: Sfx) {
  switch (name) {
    case 'click': tone(900, 0.05, 'square', 0.05); break;
    case 'paper': noise(0.18, 0.25, 3500, 0, 0.6); noise(0.12, 0.15, 6000, 0.06); break;
    case 'paperClose': noise(0.12, 0.2, 2500); break;
    case 'speech': for (let i = 0; i < 5; i++) tone(180 + Math.random() * 90, 0.07, 'triangle', 0.06, i * 0.07); break;
    case 'ok': tone(523, 0.12, 'triangle', 0.15); tone(784, 0.18, 'triangle', 0.15, 0.1); break;
    case 'no': tone(330, 0.16, 'sawtooth', 0.08); tone(247, 0.24, 'sawtooth', 0.08, 0.12); break;
    case 'stamp': noise(0.25, 0.9, 180, 0, 0.7, 'lowpass'); tone(70, 0.3, 'sine', 0.5, 0, -30); break;
    case 'cash': tone(1318, 0.08, 'square', 0.06); tone(1760, 0.3, 'square', 0.06, 0.08); noise(0.2, 0.15, 5000, 0.05); break;
    case 'success': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.13, i * 0.08)); break;
    case 'fail': tone(220, 0.35, 'sawtooth', 0.1, 0, -120); noise(0.2, 0.3, 900, 0); break;
    case 'tick': tone(1500, 0.03, 'square', 0.03); break;
    case 'scan': for (let i = 0; i < 6; i++) tone(600 + i * 120, 0.06, 'sine', 0.06, i * 0.06); break;
    case 'spark': noise(0.15, 0.5, 4000, 0, 2); tone(1800, 0.05, 'square', 0.05); break;
    case 'screw': for (let i = 0; i < 4; i++) noise(0.04, 0.2, 2200, i * 0.05, 3); break;
    case 'beep': tone(2000, 0.08, 'square', 0.05); break;
    case 'door': noise(0.4, 0.3, 300, 0, 0.5, 'lowpass'); tone(110, 0.2, 'sine', 0.15, 0.05); break;
    case 'truck': noise(1.2, 0.4, 120, 0, 0.5, 'lowpass'); tone(80, 1.0, 'sawtooth', 0.05, 0, 30); break;
    case 'hit': tone(880, 0.08, 'triangle', 0.12); break;
  }
}

/** Фоновый шум локации: гул ламп, город, стройка… */
export function startAmbient(locId: string) {
  stopAmbient();
  const a = ac(); if (!a || !master) return;
  const g = a.createGain(); g.gain.value = 0; g.connect(master);
  g.gain.linearRampToValueAtTime(0.06, a.currentTime + 1.5);
  const nodes: AudioScheduledSourceNode[] = [];
  const buf = a.createBuffer(1, a.sampleRate * 3, a.sampleRate);
  const dd = buf.getChannelData(0); let last = 0; for (let i = 0; i < dd.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; dd[i] = last * 3; }
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = locId === 'elite' ? 400 : 900;
  src.connect(f); f.connect(g); src.start(); nodes.push(src);
  if (locId === 'dorm' || locId === 'office') { const hum = a.createOscillator(); hum.frequency.value = 100; const hg = a.createGain(); hg.gain.value = 0.15; hum.connect(hg); hg.connect(g); hum.start(); nodes.push(hum); }
  if (locId === 'khr') { const tick = window.setInterval(() => tone(2400, 0.015, 'square', 0.01), 1000); nodes.push({ stop: () => clearInterval(tick) } as any); }
  ambient = { stop: () => { try { g.gain.linearRampToValueAtTime(0, a.currentTime + 0.5); setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch { /* */ } }), 600); } catch { /* */ } } };
}

export function stopAmbient() { ambient?.stop(); ambient = null; }
