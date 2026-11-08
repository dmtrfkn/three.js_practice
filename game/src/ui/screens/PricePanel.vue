<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { game, ui, act } from '../../game/store';
import { PARAMS } from '../../core/params';
import { TONE } from '../../core/content';
import { ICON } from '../icons';
import { rub, mult } from '../format';
import Portrait from '../components/Portrait.vue';
import { LOCATIONS } from '../../core/params';
import type { RoomScene } from '../../scene/RoomScene';

const props = defineProps<{ scene: RoomScene | null }>();
const o = computed(() => game.value!.order!);
const prev = computed(() => o.value.reactions[o.value.reactions.length - 1] ?? null);
const second = computed(() => !!prev.value);
const maxM = computed(() => (second.value ? +(prev.value!.m - PARAMS.slider.step).toFixed(2) : PARAMS.slider.max));
const m = ref(second.value ? Math.min(1, maxM.value) : 1);
watch(maxM, (v) => { if (m.value > v) m.value = Math.max(PARAMS.slider.min, v); });
const price = computed(() => Math.round(o.value.P * m.value));
const pct = (x: number) => ((x - PARAMS.slider.min) / (PARAMS.slider.max - PARAMS.slider.min)) * 100;
const canOffer = computed(() => !second.value || m.value <= maxM.value + 1e-9);
const ticks = computed(() => { const a: number[] = []; for (let x = PARAMS.slider.min; x <= PARAMS.slider.max + 1e-9; x += 0.05) a.push(+x.toFixed(2)); return a; });
const reaction = computed(() => (second.value && ui.lastReaction ? ui.lastReaction : null));
const app = computed(() => props.scene?.appearance ?? null);
const locId = computed(() => LOCATIONS[o.value.locIdx].id);
function offer() { if (!canOffer.value) return; act.propose(m.value); }
function onInput(e: Event) { const v = +(e.target as HTMLInputElement).value; m.value = Math.min(v, maxM.value); (e.target as HTMLInputElement).value = String(m.value); }
</script>

<template>
  <div class="layer">
    <div class="paper side price" role="region" aria-label="Назначение цены">
      <div class="spread"><span class="lbl">Наряд · {{ o.client.name }}</span><span class="mono">по прайсу {{ rub(o.P) }}</span></div>

      <div v-if="reaction" class="said">
        <Portrait v-if="app" class="mini-portrait" :a="app" :mood="o.mood" :loc-id="locId" />
        <div class="bubble"><span class="tone hand">{{ TONE[o.mood] }}</span>{{ reaction.text }}</div>
      </div>

      <div class="sum-row">
        <span class="big">{{ rub(price) }}</span>
        <span class="mult hand">{{ mult(m) }}</span>
      </div>

      <div class="tape-wrap">
        <div class="tape">
          <div class="ticks">
            <i v-for="t in ticks" :key="t" :class="{ major: Math.round(t * 100) % 25 === 0 }" :style="{ left: pct(t) + '%' }" />
          </div>
          <div class="nums mono"><span v-for="n in [0.75, 1, 1.25, 1.5, 1.75, 2]" :key="n" :style="{ left: pct(n) + '%' }">{{ n.toFixed(2).replace('.', ',') }}</span></div>
          <div class="market" :style="{ left: pct(1) + '%' }"><span class="hand">по прайсу</span></div>
          <div v-if="second" class="blocked" :style="{ left: pct(maxM) + '%' }" />
          <div class="cursor" :style="{ left: pct(m) + '%' }" />
          <input type="range" :min="PARAMS.slider.min" :max="PARAMS.slider.max" :step="PARAMS.slider.step" :value="m" aria-label="Множитель цены" @input="onInput">
        </div>
      </div>
      <div class="lbl">← → меняют цену на один шаг{{ second ? ' · второе предложение должно быть ниже первого' : '' }}</div>

      <div class="row" style="margin-top:14px;justify-content:space-between">
        <span class="lbl" v-if="second">Это последняя попытка: при отказе клиент уйдёт.</span>
        <span class="lbl" v-else>Цену после согласия изменить нельзя.</span>
        <button class="btn" type="button" :disabled="!canOffer" @click="offer"><span v-html="ICON.money" />Предложить цену</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.price { width: min(560px, calc(100vw - 36px)); }
.said { display: flex; gap: 12px; align-items: center; margin: 12px 0 4px; animation: fade .3s; }
.mini-portrait { width: 64px; flex: none; }
.bubble { background: var(--paper-2); border-radius: 12px; padding: 10px 12px; font-size: 16px; }
.tone { color: var(--ink); margin-right: 6px; font-size: 18px; }
.sum-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; }
.big { font-weight: 900; font-size: clamp(32px, 9vw, 46px); line-height: 1; color: var(--ink); font-variant-numeric: tabular-nums; }
.mult { font-size: 28px; color: var(--ink); }
.tape-wrap { margin: 18px 0 8px; }
.tape-wrap:focus-within .tape { outline: 3px solid var(--sticker); outline-offset: 3px; }
.tape { position: relative; height: 78px; border-radius: 10px; background: linear-gradient(#f5d64f, #e9c437); box-shadow: inset 0 -6px 0 rgba(0,0,0,.08), 0 6px 0 #b8961f; overflow: hidden; }
.ticks i { position: absolute; top: 0; width: 1px; height: 14px; background: var(--graphite); }
.ticks i.major { width: 2px; height: 26px; }
.nums span { position: absolute; top: 30px; transform: translateX(-50%); font-size: 11px; font-weight: 700; color: var(--graphite); }
.nums span:first-child { transform: none; margin-left: 3px; }
.nums span:last-child { transform: translateX(-100%); margin-left: -3px; }
.market { position: absolute; top: 0; bottom: 0; width: 3px; background: var(--ink); }
.market span { position: absolute; bottom: 4px; left: 7px; white-space: nowrap; font-size: 17px; color: var(--ink); }
.blocked { position: absolute; top: 0; bottom: 0; right: 0; background: repeating-linear-gradient(45deg, rgba(42,45,51,.18) 0 6px, transparent 6px 12px); margin-left: 4px; }
.cursor { position: absolute; top: -2px; bottom: -2px; width: 0; pointer-events: none; transition: left .08s; }
.cursor::before { content: ""; position: absolute; left: -2px; top: 0; bottom: 0; width: 4px; background: var(--stamp); }
.cursor::after { content: ""; position: absolute; left: -10px; top: -2px; border: 10px solid transparent; border-top-color: var(--stamp); }
@media (max-width: 720px), (max-height: 520px) { .tape { height: 66px; } .tape-wrap { margin: 12px 0 6px; } .sum-row { margin-top: 6px; } }
input[type=range] { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: ew-resize; }
</style>
