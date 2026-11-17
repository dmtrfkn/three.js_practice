<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Appearance } from '../../scene/client';
import { drawPixelPortrait } from '../../scene2d/people';
import { LOOKS } from '../../scene2d/rooms';
import type { Level } from '../../core/params';

const props = defineProps<{ a: Appearance; mood: Level; locId: string; talking?: boolean }>();
const cv = ref<HTMLCanvasElement | null>(null);
let raf = 0; const t0 = performance.now();
function draw() { if (cv.value) { const L = LOOKS[props.locId] ?? LOOKS.dorm; drawPixelPortrait(cv.value, props.a, props.mood, L.wallLow, L.wall, !!props.talking, (performance.now() - t0) / 1000); } }
// портрет живой: моргание, дыхание, губы при разговоре
function loop() { raf = requestAnimationFrame(loop); draw(); }
onMounted(() => { raf = requestAnimationFrame(loop); });
onBeforeUnmount(() => cancelAnimationFrame(raf));
watch(() => [props.mood, props.a], draw);
</script>

<template>
  <div class="portrait"><canvas ref="cv" width="300" height="400" aria-label="Портрет клиента" /></div>
</template>

<style scoped>
.portrait { border-radius: 14px; overflow: hidden; aspect-ratio: 3/4; box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); }
canvas { width: 100%; height: 100%; display: block; image-rendering: pixelated; }
</style>
