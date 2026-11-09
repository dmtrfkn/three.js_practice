<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { game, act } from '../../game/store';
import { STEPS, phaseOf, phaseIndex, type Step, type Target } from '../tutorial';
import type { RoomScene } from '../../scene/RoomScene';
import { LOCATIONS } from '../../core/params';
import { sfx } from '../../audio/sfx';

const props = defineProps<{ scene: RoomScene | null }>();
const c = computed(() => game.value);
const phase = computed(() => phaseOf(c.value));
const active = computed(() => phase.value !== 'off');

/** Текущий шаг с учётом того, что игрок мог уйти вперёд по этапам. */
const idx = computed(() => {
  const g = c.value; if (!g || !active.value) return -1;
  let i = g.tutorialStep ?? 0;
  const cur = phaseIndex(phase.value);
  while (i < STEPS.length) {
    const s = STEPS[i];
    if (phaseIndex(s.phase) < cur) { i++; continue; }
    if (s.phase === phase.value && s.done?.(g)) { i++; continue; }
    break;
  }
  return i;
});
const step = computed<Step | null>(() => {
  const i = idx.value; if (i < 0 || i >= STEPS.length) return null;
  const s = STEPS[i];
  return s.phase === phase.value ? s : null;   // шаг следующего этапа ждёт, пока игрок туда дойдёт
});
watch(idx, (i) => { const g = c.value; if (g && i >= 0 && i !== g.tutorialStep) act.tutorialStep(i); });
watch(() => step.value?.id, (id, prev) => { if (id && prev) sfx('paper'); });

const html = computed(() => {
  const s = step.value; if (!s || !c.value) return '';
  let t = s.text(c.value);
  if (s.id === 'goal') t = `Чтобы переехать в следующий район, нужно набрать на счету квоту — здесь ${LOCATIONS[c.value.locIdx].quota.toLocaleString('ru-RU')} ₽ — за три вызова. Заявок пять, брать можно любые три. Баланс и квота показаны на этой бумажке.`;
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
});
const last = computed(() => idx.value === STEPS.length - 1);

function next() {
  if (!c.value) return;
  sfx('click');
  if (last.value) { act.skipTutorial(); return; }
  act.tutorialStep(idx.value + 1);
}
function skip() { act.skipTutorial(); }

/* ---------- позиция цели ---------- */
interface Rect { x: number; y: number; w: number; h: number }
const rect = ref<Rect | null>(null);
const vw = ref(window.innerWidth), vh = ref(window.innerHeight);
let raf = 0;

function findTarget(t: Target | undefined): Rect | null {
  if (!t) return null;
  if ('css' in t) {
    const els = Array.from(document.querySelectorAll(t.css)) as HTMLElement[];
    const el = els.find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }
  const o = c.value?.order; const sc = props.scene; if (!o || !sc) return null;
  let id: string | null = null;
  if ('client' in t) id = '__client';
  else if (t.item === 'unopened') id = o.items.find((i) => !o.inspected.includes(i.id))?.id ?? null;
  else id = o.items.find((i) => i.kind === t.item)?.id ?? null;
  if (!id) return null;
  const p = sc.screenPos(id); if (!p) return null;
  const size = id === '__client' ? 150 : 96;
  return { x: p.x - size / 2, y: p.y - size / 2, w: size, h: size };
}

function loop() {
  raf = requestAnimationFrame(loop);
  vw.value = window.innerWidth; vh.value = window.innerHeight;
  if (bubbleEl.value) bubbleH.value = bubbleEl.value.offsetHeight;
  const r = step.value ? findTarget(step.value.target) : null;
  const visible = r && r.x + r.w > 0 && r.y + r.h > 0 && r.x < vw.value && r.y < vh.value;
  rect.value = visible ? r : null;
}
onMounted(() => { raf = requestAnimationFrame(loop); });
onBeforeUnmount(() => cancelAnimationFrame(raf));

// камера сама поворачивается к нужному предмету
watch(() => step.value?.id, () => {
  const t = step.value?.target; const sc = props.scene; const o = c.value?.order;
  if (!t || !sc || !o || 'css' in t) return;
  if ('client' in t) { sc.focusClient(true); return; }
  const id = t.item === 'unopened' ? o.items.find((i) => !o.inspected.includes(i.id))?.id : o.items.find((i) => i.kind === t.item)?.id;
  if (id) sc.lookAtItem(id);
});

const PAD = 8;
const bubbleEl = ref<HTMLElement | null>(null);
const bubbleH = ref(230);
const ring = computed(() => rect.value && { left: rect.value.x - PAD + 'px', top: rect.value.y - PAD + 'px', width: rect.value.w + PAD * 2 + 'px', height: rect.value.h + PAD * 2 + 'px' });
const mobile = computed(() => vw.value < 720 || vh.value < 520);
const bubble = computed(() => {
  const W = Math.min(380, vw.value - 24), r = rect.value;
  if (!r) return { style: mobile.value ? { left: '12px', right: '12px', bottom: '12px', maxHeight: '60dvh' } : { left: `calc(50% - ${W / 2}px)`, top: '18%', width: W + 'px' }, arrow: '' };
  if (mobile.value) {
    // на телефоне: самая большая свободная область вокруг цели, плашка её не перекрывает
    const m = 8, top0 = 44, x0 = r.x - PAD, y0 = r.y - PAD, x1 = r.x + r.w + PAD, y1 = r.y + r.h + PAD;
    const regions = [
      { k: 'above', area: vw.value * (y0 - top0), st: { left: m + 'px', right: m + 'px', top: top0 + 'px', maxHeight: Math.max(0, y0 - top0 - m) + 'px' }, ok: y0 - top0 > 110 },
      { k: 'below', area: vw.value * (vh.value - y1), st: { left: m + 'px', right: m + 'px', top: y1 + m + 'px', maxHeight: Math.max(0, vh.value - y1 - 2 * m) + 'px' }, ok: vh.value - y1 > 110 },
      { k: 'left', area: x0 * (vh.value - top0), st: { left: m + 'px', width: Math.max(0, x0 - 2 * m) + 'px', top: top0 + 'px', maxHeight: vh.value - top0 - m + 'px' }, ok: x0 > 200 },
      { k: 'right', area: (vw.value - x1) * (vh.value - top0), st: { left: x1 + m + 'px', width: Math.max(0, vw.value - x1 - 2 * m) + 'px', top: top0 + 'px', maxHeight: vh.value - top0 - m + 'px' }, ok: vw.value - x1 > 200 },
    ].filter((x) => x.ok).sort((p, q) => q.area - p.area);
    if (regions.length) return { style: regions[0].st, arrow: '' };
    return { style: { left: m + 'px', right: m + 'px', bottom: m + 'px', maxHeight: '38dvh' }, arrow: '' };
  }
  const H = bubbleH.value;
  const spaceBelow = vh.value - (r.y + r.h), spaceAbove = r.y, spaceRight = vw.value - (r.x + r.w), spaceLeft = r.x;
  let left: number, top: number, arrow: string;
  if (spaceBelow > H + 30) { top = r.y + r.h + PAD + 16; left = r.x + r.w / 2 - W / 2; arrow = 'up'; }
  else if (spaceAbove > H + 30) { top = r.y - PAD - 16 - H; left = r.x + r.w / 2 - W / 2; arrow = 'down'; }
  else if (spaceLeft > W + 30) { left = r.x - PAD - 16 - W; top = r.y + r.h / 2 - H / 2; arrow = 'right'; }
  else if (spaceRight > W + 30) { left = r.x + r.w + PAD + 16; top = r.y + r.h / 2 - H / 2; arrow = 'left'; }
  else { left = vw.value / 2 - W / 2; top = 70; arrow = ''; }
  left = Math.max(12, Math.min(vw.value - W - 12, left)); top = Math.max(60, Math.min(vh.value - H - 12, top));
  return { style: { left: left + 'px', top: top + 'px', width: W + 'px' }, arrow };
});
</script>

<template>
  <div v-if="step" class="tut" aria-live="polite">
    <div v-if="ring" class="ring" :style="ring" />
    <div v-else-if="!step.wait" class="dim" />
    <div ref="bubbleEl" class="bubble sticky" :class="['arrow-' + bubble.arrow, { mobile }]" :style="bubble.style" role="dialog" :aria-label="step.title">
      <div class="head">
        <span class="badge">обучение</span>
        <button type="button" class="skip" @click="skip">Пропустить обучение</button>
      </div>
      <h4>{{ step.title }}</h4>
      <p v-html="html" />
      <div class="foot">
        <span v-if="step.wait" class="wait">↳ сделайте это, и обучение продолжится</span>
        <button v-else type="button" class="btn" @click="next">{{ last ? 'Начать работу' : 'Далее' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tut { position: fixed; inset: 0; z-index: 60; pointer-events: none; }
.dim { position: absolute; inset: 0; background: rgba(10,12,15,.45); }
.ring { position: absolute; border-radius: 14px; box-shadow: 0 0 0 3px var(--sticker), 0 0 0 200vmax rgba(10,12,15,.5); transition: left .2s, top .2s, width .2s, height .2s; animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 50% { box-shadow: 0 0 0 6px rgba(241,208,75,.7), 0 0 0 200vmax rgba(10,12,15,.5); } }
.bubble { position: absolute; pointer-events: auto; padding: 14px 16px 14px; font-family: var(--f-main); font-size: 15px; line-height: 1.45; color: #2a2207; transform: rotate(-.6deg); border-radius: 4px; max-height: 70dvh; overflow: auto; }
.bubble.mobile { font-size: 13.5px; padding: 10px 12px; transform: none; }
.bubble.mobile h4 { font-size: 16px; margin: 4px 0 2px; }
.head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.badge { font: 900 11px var(--f-main); letter-spacing: .08em; text-transform: uppercase; background: #2a2207; color: var(--sticker); border-radius: 6px; padding: 2px 7px; }
.skip { border: 0; background: none; font: 700 12px var(--f-main); color: #6a5a1a; text-decoration: underline; cursor: pointer; padding: 4px; }
h4 { margin: 8px 0 4px; font: 900 18px var(--f-main); }
p { margin: 0; }
p :deep(b) { font-weight: 800; }
.foot { display: flex; justify-content: flex-end; margin-top: 10px; }
.wait { font-family: var(--f-hand); font-size: 18px; color: #6a5a1a; }
.bubble::after { content: ""; position: absolute; border: 12px solid transparent; }
.arrow-up::after { top: -24px; left: calc(50% - 12px); border-bottom-color: var(--sticker); }
.arrow-down::after { bottom: -24px; left: calc(50% - 12px); border-top-color: var(--sticker); }
.arrow-left::after { left: -24px; top: calc(50% - 12px); border-right-color: var(--sticker); }
.arrow-right::after { right: -24px; top: calc(50% - 12px); border-left-color: var(--sticker); }
@media (prefers-reduced-motion: reduce) { .ring { animation: none; } }
</style>
