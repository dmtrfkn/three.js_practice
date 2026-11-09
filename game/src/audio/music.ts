// Процедурная музыка на Web Audio API: электропиано, контрабас, щётки, мелодия по ладу.
// Планировщик с упреждением (lookahead) — ноты ставятся в очередь заранее, поэтому ритм не «плывёт».
import { audioCtx, musicBus } from './sfx';

interface Track {
  bpm: number;
  swing: number;              // 0..0.33 — доля сдвига второй восьмой
  chords: number[][];         // MIDI-ноты аккордов, по аккорду на такт
  bass: number[];             // корни для баса (MIDI)
  scale: number[];            // лад для мелодии (полутоны от тоники)
  tonic: number;              // MIDI тоники мелодии
  melody: number;             // вероятность ноты мелодии на восьмую
  drums: 'brush' | 'soft' | 'none';
  piano: 'rhodes' | 'bell' | 'organ';
  tone: number;               // частота среза фильтра (тёмный/светлый звук)
}

const m = (n: string) => { const map: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 }; const r = n.match(/^([A-G][#b]?)(\d)$/)!; return 12 * (+r[2] + 1) + map[r[1]]; };
const ch = (...n: string[]) => n.map(m);
const PENT_MAJ = [0, 2, 4, 7, 9], DORIAN = [0, 2, 3, 5, 7, 9, 10], LYDIAN = [0, 2, 4, 6, 7, 9, 11];

export const TRACKS: Record<string, Track> = {
  // главное меню: тёплый джаз ii–V–I
  menu: { bpm: 84, swing: 0.22, chords: [ch('D3', 'F3', 'A3', 'C4', 'E4'), ch('G2', 'F3', 'B3', 'E4'), ch('C3', 'E3', 'G3', 'B3', 'D4'), ch('A2', 'G3', 'C#4', 'F4')], bass: ch('D2', 'G1', 'C2', 'A1'), scale: PENT_MAJ, tonic: m('C5'), melody: 0.32, drums: 'brush', piano: 'rhodes', tone: 2600 },
  // общежитие: lo-fi, чуть расстроенное пианино
  dorm: { bpm: 76, swing: 0.18, chords: [ch('A2', 'G3', 'C4', 'E4'), ch('D3', 'F#3', 'C4', 'E4'), ch('G2', 'F#3', 'B3', 'D4'), ch('C3', 'E3', 'B3', 'D4')], bass: ch('A1', 'D2', 'G1', 'C2'), scale: DORIAN, tonic: m('A4'), melody: 0.22, drums: 'soft', piano: 'rhodes', tone: 1500 },
  // хрущёвка: советская эстрада, органчик
  khr: { bpm: 92, swing: 0.08, chords: [ch('F3', 'A3', 'C4', 'E4'), ch('E3', 'G3', 'B3', 'D4'), ch('D3', 'F3', 'A3', 'C4'), ch('G2', 'F3', 'B3', 'D4')], bass: ch('F2', 'E2', 'D2', 'G1'), scale: [0, 2, 4, 5, 7, 9, 11], tonic: m('C5'), melody: 0.3, drums: 'brush', piano: 'organ', tone: 2200 },
  // новостройка: светло, свежо
  new: { bpm: 96, swing: 0.05, chords: [ch('C3', 'E3', 'G3', 'B3'), ch('A2', 'E3', 'G3', 'C4'), ch('F2', 'A3', 'C4', 'E4'), ch('G2', 'D3', 'G3', 'B3', 'E4')], bass: ch('C2', 'A1', 'F1', 'G1'), scale: LYDIAN, tonic: m('C5'), melody: 0.26, drums: 'soft', piano: 'bell', tone: 3400 },
  // элитный ЖК: медленный лаунж
  elite: { bpm: 70, swing: 0.2, chords: [ch('Eb3', 'G3', 'Bb3', 'D4', 'F4'), ch('C3', 'Eb3', 'G3', 'Bb3', 'D4'), ch('F2', 'Ab3', 'C4', 'Eb4', 'G4'), ch('Bb2', 'Ab3', 'D4', 'G4')], bass: ch('Eb2', 'C2', 'F1', 'Bb1'), scale: [0, 2, 3, 5, 7, 8, 10], tonic: m('Eb5'), melody: 0.2, drums: 'brush', piano: 'rhodes', tone: 1800 },
  // офис: деловой поп без свинга
  office: { bpm: 104, swing: 0, chords: [ch('G2', 'D3', 'F#3', 'B3'), ch('E3', 'G3', 'B3', 'D4'), ch('C3', 'E3', 'G3', 'B3'), ch('D3', 'F#3', 'A3', 'E4')], bass: ch('G1', 'E2', 'C2', 'D2'), scale: PENT_MAJ, tonic: m('G4'), melody: 0.24, drums: 'soft', piano: 'bell', tone: 3000 },
};

const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

let current: string | null = null;
let timer = 0;
let nextTime = 0;
let step = 0;
let trackGain: GainNode | null = null;
let lastMel = 2;

function voice(dest: AudioNode, t: number, note: number, dur: number, kind: Track['piano'], vel: number) {
  const a = audioCtx()!;
  const g = a.createGain(); g.connect(dest);
  const f = hz(note);
  if (kind === 'organ') {
    for (const [mul, lvl] of [[1, 0.5], [2, 0.25], [3, 0.12]] as const) { const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f * mul; const og = a.createGain(); og.gain.value = lvl; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.1); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * 0.5, t + 0.03); g.gain.setValueAtTime(vel * 0.5, t + dur - 0.05); g.gain.linearRampToValueAtTime(0, t + dur + 0.08);
    return;
  }
  // FM-электропиано: несущая + модулятор, затухание как у родес / колокольчика
  const car = a.createOscillator(); car.type = 'sine'; car.frequency.value = f;
  const mod = a.createOscillator(); mod.type = 'sine'; mod.frequency.value = f * (kind === 'bell' ? 3.5 : 1.0);
  const mg = a.createGain(); mg.gain.setValueAtTime(f * (kind === 'bell' ? 2.2 : 1.4), t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.6);
  mod.connect(mg); mg.connect(car.frequency); car.connect(g);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.006); g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
  car.start(t); mod.start(t); car.stop(t + dur + 0.7); mod.stop(t + dur + 0.7);
}

function bassNote(dest: AudioNode, t: number, note: number, dur: number) {
  const a = audioCtx()!;
  const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(note);
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
  const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.18, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp); lp.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}

function noiseHit(dest: AudioNode, t: number, dur: number, freq: number, gain: number, type: BiquadFilterType = 'bandpass', sweep = 0) {
  const a = audioCtx()!;
  const len = Math.ceil(a.sampleRate * dur); const buf = a.createBuffer(1, len, a.sampleRate); const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(); s.buffer = buf;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); if (sweep) f.frequency.linearRampToValueAtTime(freq + sweep, t + dur); f.Q.value = 0.8;
  const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + Math.min(0.03, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.02);
}

function kick(dest: AudioNode, t: number, gain: number) {
  const a = audioCtx()!;
  const o = a.createOscillator(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  const g = a.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.32);
}

function schedule(tr: Track, out: AudioNode) {
  const a = audioCtx()!;
  const eighth = 60 / tr.bpm / 2;
  while (nextTime < a.currentTime + 0.15) {
    const bar = Math.floor(step / 8) % tr.chords.length;
    const pos = step % 8;
    const swingOff = pos % 2 === 1 ? eighth * tr.swing : 0;
    const t = nextTime + swingOff;
    const chord = tr.chords[bar];
    // аккомпанемент: аккорд на «1» и синкопа на «2и»
    if (pos === 0) chord.forEach((n, i) => voice(out, t + i * 0.012, n, eighth * 3.2, tr.piano, 0.07));
    if (pos === 3 && Math.random() < 0.6) chord.slice(1).forEach((n, i) => voice(out, t + i * 0.01, n, eighth * 1.4, tr.piano, 0.045));
    // бас: шагающий по долям
    if (pos % 2 === 0) {
      const root = tr.bass[bar]; const walk = [0, 7, 12, 10][pos / 2];
      bassNote(out, t, root + (pos === 0 ? 0 : walk), eighth * 1.8);
    }
    // ударные
    if (tr.drums === 'brush') {
      noiseHit(out, t, eighth * 1.6, 3200, pos % 2 === 0 ? 0.05 : 0.025, 'bandpass', -1200);
      if (pos === 2 || pos === 6) noiseHit(out, t, 0.18, 1800, 0.09, 'bandpass');
      if (pos === 0) kick(out, t, 0.25);
    } else if (tr.drums === 'soft') {
      if (pos === 0 || pos === 5) kick(out, t, 0.35);
      if (pos === 2 || pos === 6) noiseHit(out, t, 0.14, 2200, 0.08, 'bandpass');
      noiseHit(out, t, 0.05, 8000, pos % 2 ? 0.018 : 0.03, 'highpass');
    }
    // мелодия: случайное блуждание по ладу, чаще на сильных долях
    if (Math.random() < tr.melody * (pos % 2 === 0 ? 1.3 : 0.7) && bar % 4 !== 3) {
      lastMel = Math.max(0, Math.min(tr.scale.length * 2 - 1, lastMel + [-2, -1, 1, 2, 0][Math.floor(Math.random() * 5)]));
      const deg = lastMel % tr.scale.length, oct = Math.floor(lastMel / tr.scale.length);
      voice(out, t, tr.tonic + tr.scale[deg] + 12 * oct - 12, eighth * (Math.random() < 0.3 ? 2 : 1), tr.piano === 'organ' ? 'bell' : tr.piano, 0.055);
    }
    nextTime += eighth;
    step++;
  }
}

/** Включить трек (плавная смена). null — тишина. */
export function playMusic(name: string | null) {
  if (name === current) return;
  const a = audioCtx(); if (!a) return;
  const bus = musicBus()!;
  // плавно гасим предыдущий
  if (trackGain) { const old = trackGain; old.gain.cancelScheduledValues(a.currentTime); old.gain.setValueAtTime(old.gain.value, a.currentTime); old.gain.linearRampToValueAtTime(0, a.currentTime + 1.2); setTimeout(() => old.disconnect(), 1500); }
  clearInterval(timer); current = name; trackGain = null;
  if (!name || !TRACKS[name]) return;
  const tr = TRACKS[name];
  const g = a.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(1, a.currentTime + 1.5);
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = tr.tone;
  const comp = a.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
  g.connect(lp); lp.connect(comp); comp.connect(bus);
  trackGain = g; nextTime = a.currentTime + 0.1; step = 0; lastMel = 2;
  timer = window.setInterval(() => schedule(tr, g), 25);
}

export function currentMusic() { return current; }

/* ---------------- джинглы ---------------- */

export type Jingle = 'paid' | 'violation' | 'left' | 'move' | 'win' | 'lose' | 'arrest';

export function jingle(kind: Jingle) {
  const a = audioCtx(); if (!a) return;
  const bus = musicBus()!;
  const g = a.createGain(); g.gain.value = 0.9; g.connect(bus);
  const t = a.currentTime + 0.05;
  const seq = (notes: number[], step: number, dur: number, kindV: Track['piano'] = 'rhodes', vel = 0.12) => notes.forEach((n, i) => voice(g, t + i * step, n, dur, kindV, vel));
  switch (kind) {
    case 'paid': seq(ch('C5', 'E5', 'G5', 'C6'), 0.09, 0.3, 'bell', 0.1); break;
    case 'move': seq(ch('G4', 'C5', 'E5', 'G5', 'C6'), 0.12, 0.4, 'rhodes', 0.1); bassNote(g, t, m('C2'), 1.2); break;
    case 'left': seq(ch('E4', 'D4', 'B3'), 0.18, 0.5, 'rhodes', 0.09); break;
    case 'violation': seq(ch('A3', 'C4', 'Eb4'), 0.0, 1.4, 'rhodes', 0.08); bassNote(g, t, m('F#1'), 1.6); seq(ch('Bb4', 'A4', 'G#4'), 0.35, 0.5, 'bell', 0.07); break;
    case 'arrest': seq(ch('D3', 'F3', 'Ab3', 'B3'), 0, 2.4, 'organ', 0.12); bassNote(g, t, m('D1'), 2.4); kick(g, t, 0.6); kick(g, t + 0.6, 0.5); break;
    case 'win': [ch('C4', 'E4', 'G4', 'C5'), ch('F4', 'A4', 'C5', 'F5'), ch('G4', 'B4', 'D5', 'G5'), ch('C5', 'E5', 'G5', 'C6')].forEach((c, i) => c.forEach((n) => voice(g, t + i * 0.32, n, i === 3 ? 1.8 : 0.4, 'rhodes', 0.08))); bassNote(g, t, m('C2'), 0.4); bassNote(g, t + 0.96, m('C2'), 1.6); break;
    case 'lose': seq(ch('E4', 'D4', 'C4', 'B3', 'A3'), 0.28, 0.5, 'rhodes', 0.09); bassNote(g, t + 1.1, m('A1'), 1.6); break;
  }
}
