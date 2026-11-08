<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { drawPortrait, type Appearance } from '../../scene/client';
import { LOOKS } from '../../scene/decor';
import type { Level } from '../../core/params';

const props = defineProps<{ a: Appearance; mood: Level; locId: string }>();
const cv = ref<HTMLCanvasElement | null>(null);
function draw() { if (cv.value) { const L = LOOKS[props.locId]; drawPortrait(cv.value, props.a, props.mood, L.wallLow, L.wallHigh); } }
onMounted(draw);
watch(() => [props.mood, props.a], draw);
</script>

<template>
  <div class="portrait"><canvas ref="cv" width="300" height="400" aria-label="Портрет клиента" /></div>
</template>

<style scoped>
.portrait { border-radius: 14px; overflow: hidden; aspect-ratio: 3/4; box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); }
canvas { width: 100%; height: 100%; display: block; }
</style>
