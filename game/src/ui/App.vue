<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { RoomScene } from '../scene/RoomScene';
import { game, ui, act, settings, toast } from '../game/store';
import { startAmbient, stopAmbient, sfx, unlockAudio } from '../audio/sfx';
import { playMusic, jingle } from '../audio/music';
import { LOCATIONS } from '../core/params';
import MenuScreen from './screens/MenuScreen.vue';
import BoardScreen from './screens/BoardScreen.vue';
import InspectHud from './screens/InspectHud.vue';
import DialogPanel from './screens/DialogPanel.vue';
import DiagnosisPanel from './screens/DiagnosisPanel.vue';
import PricePanel from './screens/PricePanel.vue';
import RepairPanel from './screens/RepairPanel.vue';
import ResultPanel from './screens/ResultPanel.vue';
import MoveScreen from './screens/MoveScreen.vue';
import EndScreen from './screens/EndScreen.vue';
import TopHud from './components/TopHud.vue';
import SettingsModal from './components/SettingsModal.vue';

const canvas = ref<HTMLCanvasElement | null>(null);
let scene: RoomScene | null = null;
const sceneReady = ref(false);
const c = game;
const order = computed(() => c.value?.order ?? null);
const stage = computed(() => order.value?.stage ?? null);
const inOrder = computed(() => ui.screen === 'game' && c.value?.status === 'order' && !!order.value);

onMounted(() => {
  scene = new RoomScene(canvas.value!);
  scene.sensitivity = settings.sensitivity;
  scene.events = {
    onItemClick: (id) => { if (stage.value === 'inspect') act.openItem(id); },
    onClientClick: () => { if (stage.value === 'inspect' && !order.value?.openCard) act.toDialogue(); },
  };
  (window as any).__scene = scene;
});
onBeforeUnmount(() => { scene?.dispose(); stopAmbient(); });
watch(() => settings.sensitivity, (v) => { if (scene) scene.sensitivity = v; });

// собрать сцену, когда появился новый заказ (или загрузили сохранение)
watch(() => (inOrder.value ? order.value!.offerId : null), async (id) => {
  if (!id || !scene) { sceneReady.value = false; return; }
  sceneReady.value = false;
  await nextTick();
  scene.build(order.value!);
  scene.setCamera(0, -4);
  startAmbient(LOCATIONS[order.value!.locIdx].id);
  sceneReady.value = true;
  if (order.value!.stage === 'inspect') act.startInspection();
  applyStage();
}, { immediate: true });

function applyStage() {
  if (!scene || !order.value) return;
  const st = order.value.stage;
  scene.interactive = st === 'inspect' && !order.value.openCard;
  if (st === 'dialogue' || st === 'price') scene.focusClient(true);
  else if (st === 'diagnosis' || st === 'repair') scene.focusDevice();
  if (st === 'result' && (order.value.outcome === 'left' || order.value.outcome === 'complaint')) scene.client?.react('leave');
}
watch([stage, () => order.value?.openCard], applyStage);
watch(() => order.value?.mood, (m) => { if (m !== undefined) scene?.setMood(m); });
watch(() => order.value?.reactions.length, (n, prev) => {
  if (!n || !order.value || n === prev) return;
  const r = order.value.reactions[n - 1];
  const cl = scene?.client; if (!cl) return;
  if (r.kind === 'accept' || r.kind === 'acceptSecond') cl.react('nod');
  else if (r.kind === 'soft' || r.kind === 'hard') cl.react('cross');
  else cl.react('shake');
});
watch(() => order.value?.repaired, (v) => { if (v) scene?.client?.react('happy'); });
watch(() => ui.screen, (s) => { if (s === 'menu') stopAmbient(); });

// музыка: меню и доска заявок — свой трек; в квартире — только звуки комнаты
const musicTrack = computed(() => {
  if (ui.screen === 'menu') return 'menu';
  const g = c.value; if (!g) return 'menu';
  if (g.status === 'board' || g.status === 'mustMove') return LOCATIONS[g.locIdx].id;
  return null;
});
function applyMusic() { playMusic(musicTrack.value); }
watch(musicTrack, applyMusic);
onMounted(() => unlockAudio(applyMusic));
watch(() => (inOrder.value ? null : 'out'), (v) => { if (v) stopAmbient(); });
// джинглы итогов
watch(() => order.value?.outcome, (o) => {
  if (!o || !order.value) return;
  if (o === 'paid') setTimeout(() => jingle(order.value?.violation ? 'violation' : 'paid'), order.value.violation ? 1700 : 900);
  else { jingle('left'); sfx('steps'); }
});
watch(() => c.value?.status, (s, prev) => {
  if (s === 'victory') jingle('win');
  else if (s === 'gameover') jingle(c.value?.ending === 'arrest' ? 'arrest' : 'lose');
  else if (s === 'board' && prev === 'mustMove') jingle('move');
});
watch(() => c.value?.locIdx, (n, p) => { if (p !== undefined && n !== undefined && n > p && c.value?.status === 'board') jingle('move'); });
watch(() => order.value?.mood, (m, p) => { if (m !== undefined && p !== undefined && m < p) sfx('moodDown'); });

// таймер осмотра
let tick = 0;
onMounted(() => { tick = window.setInterval(() => { if (stage.value === 'inspect') act.tick(); }, 250); });
onBeforeUnmount(() => clearInterval(tick));

// клавиатура: Esc закрывает карточку / настройки
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (ui.settingsOpen) { ui.settingsOpen = false; return; }
    if (order.value?.openCard) { act.closeCard(); return; }
    if (ui.confirmOffer) { ui.confirmOffer = null; return; }
  }
}
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));

const dim = computed(() => !inOrder.value);
// подсказка для телефона в портретной ориентации
import { TOUCH } from './device';
const portrait = ref(typeof window !== 'undefined' && window.innerHeight > window.innerWidth);
const rotateHintClosed = ref(false);
try { rotateHintClosed.value = localStorage.getItem('mnd.rotateHint') === '1'; } catch { /* */ }
onMounted(() => window.addEventListener('resize', () => (portrait.value = window.innerHeight > window.innerWidth)));
watch(stage, (s) => { if (s === 'inspect' && TOUCH) setTimeout(() => { rotateHintClosed.value = true; }, 7000); });
function closeRotate() { rotateHintClosed.value = true; try { localStorage.setItem('mnd.rotateHint', '1'); } catch { /* */ } }
void toast;
</script>

<template>
  <div class="app">
    <div class="desk-bg" />
    <canvas ref="canvas" class="scene" :class="{ dim, interactive: stage === 'inspect' }" :style="{ visibility: inOrder ? 'visible' : 'hidden' }" aria-label="3D-сцена комнаты клиента" />
    <div class="vignette" v-if="inOrder" />
    <div class="grain" />

    <MenuScreen v-if="ui.screen === 'menu'" />

    <template v-else-if="c">
      <BoardScreen v-if="c.status === 'board'" />
      <MoveScreen v-else-if="c.status === 'mustMove'" />
      <EndScreen v-else-if="c.status === 'gameover' || c.status === 'victory'" />
      <template v-else-if="inOrder && sceneReady">
        <TopHud />
        <InspectHud v-if="stage === 'inspect'" :scene="scene" />
        <DialogPanel v-else-if="stage === 'dialogue'" :scene="scene" />
        <DiagnosisPanel v-else-if="stage === 'diagnosis'" />
        <PricePanel v-else-if="stage === 'price'" :scene="scene" />
        <RepairPanel v-else-if="stage === 'repair'" />
        <ResultPanel v-else-if="stage === 'result'" />
      </template>
    </template>

    <div v-if="TOUCH && portrait && inOrder && sceneReady && stage === 'inspect' && !rotateHintClosed" class="rotate-tip sticky" role="note">
      Удобнее держать телефон горизонтально
      <button type="button" aria-label="Скрыть подсказку" @click="closeRotate">✕</button>
    </div>
    <SettingsModal v-if="ui.settingsOpen" />
    <div v-if="ui.toast" class="toast chip dark" role="status">{{ ui.toast }}</div>
  </div>
</template>

<style scoped>
.rotate-tip { position: absolute; left: 50%; top: 92px; transform: translateX(-50%) rotate(-1deg); z-index: 30; display: flex; gap: 10px; align-items: center; font-size: 17px; white-space: nowrap; }
.rotate-tip button { border: 0; background: rgba(0,0,0,.12); border-radius: 8px; width: 26px; height: 26px; cursor: pointer; font-weight: 900; color: #3a2f06; }
</style>
