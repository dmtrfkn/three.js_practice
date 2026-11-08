<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, nextTick, watch } from 'vue';
import { game, act } from '../../game/store';
import { inspectionLeft } from '../../core/campaign';
import { ALL_ITEMS, NEUTRALS } from '../../core/content';
import { ICON } from '../icons';
import type { RoomScene } from '../../scene/RoomScene';
import { t as dt, TOUCH } from '../device';

const props = defineProps<{ scene: RoomScene | null }>();
const o = computed(() => game.value!.order!);
const now = ref(Date.now());
let t = 0;
onMounted(() => { t = window.setInterval(() => (now.value = Date.now()), 200); });
onBeforeUnmount(() => clearInterval(t));
const left = computed(() => inspectionLeft(o.value, now.value));
const secs = computed(() => Math.ceil(left.value));
const urgent = computed(() => secs.value <= 10);

const card = computed(() => {
  const id = o.value.openCard; if (!id) return null;
  const d = ALL_ITEMS[id];
  if (d) return { title: d.title, fact: d.card };
  const n = NEUTRALS[id];
  return { title: n.name, fact: `Перед вами ${n.nameAcc}.` };
});
const closeBtn = ref<HTMLButtonElement | null>(null);
watch(card, async (v) => { if (v) { await nextTick(); closeBtn.value?.focus(); } });
const hint = computed(() => {
  const n = o.value.inspected.length;
  if (left.value <= 0) return 'время вышло — дочитайте карточку';
  if (n === 0) return dt('тяните мышью — оглядеться · нажмите на предмет', 'ведите пальцем — оглядеться · тап по предмету');
  return `осмотрено предметов: ${n} · ${dt('нажмите', 'тапните')} на клиента, чтобы начать разговор`;
});
const label = (id: string) => ALL_ITEMS[id]?.title ?? NEUTRALS[id]?.name ?? id;
function focusItem(id: string) { props.scene?.lookAtItem(id); props.scene?.highlight(id); }
</script>

<template>
  <div class="layer">
    <div class="timer chip dark" :class="{ urgent }" role="timer" aria-live="off">
      <span v-html="ICON.timer" />осмотр <b>0:{{ String(secs).padStart(2, '0') }}</b>
    </div>
    <div class="hint-line">{{ hint }}</div>
    <div class="actions">
      <span class="sr-list" aria-label="Предметы в комнате">
        <button v-for="(it, i) in o.items" :key="it.id" type="button" class="sr-item" @focus="focusItem(it.id)" @blur="scene?.highlight(null)" @click="act.openItem(it.id)">
          предмет {{ i + 1 }}<span v-if="o.inspected.includes(it.id)">: {{ label(it.id) }}</span>
        </button>
      </span>
      <button class="btn" type="button" :disabled="!!o.openCard" @click="act.toDialogue()"><span v-html="ICON.chat" />{{ TOUCH ? 'Поговорить' : 'Поговорить с клиентом' }}</button>
    </div>

    <div v-if="card" class="note-bg">
      <div class="note" role="dialog" aria-modal="true" :aria-label="card.title">
        <h3>{{ card.title }}</h3>
        <div class="fact">{{ card.fact }}</div>
        <div class="meta"><span v-html="ICON.chat" style="width:16px;height:16px;display:inline-block" />в разговоре появится вопрос об этом</div>
        <div class="row" style="margin-top:12px">
          <button ref="closeBtn" class="btn" type="button" @click="act.closeCard()">Закрыть <span class="kbd">Esc</span></button>
          <span v-if="left <= 0" class="lbl">время вышло — после закрытия начнётся разговор</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer { position: absolute; right: 16px; top: 66px; font-size: 15px; }
.timer b { font-size: 20px; }
.timer.urgent { background: var(--stamp); }
.timer.urgent b { color: #fff; }
.actions { position: absolute; right: 18px; bottom: 18px; display: flex; gap: 10px; align-items: center; }
.note-bg { position: absolute; inset: 0; background: rgba(8,10,12,.25); }
@media (max-width: 720px) {
  .timer { top: auto; right: auto; left: 8px; bottom: max(12px, env(safe-area-inset-bottom)); font-size: 13px; }
  .timer b { font-size: 17px; }
  .hint-line { bottom: calc(max(12px, env(safe-area-inset-bottom)) + 44px); }
  .actions { right: 8px; bottom: max(8px, env(safe-area-inset-bottom)); }
}
@media (max-height: 520px) and (orientation: landscape) { .timer { top: 48px; right: 10px; } .actions { bottom: 8px; right: 10px; } }
.sr-list { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.sr-list:focus-within { position: static; width: auto; height: auto; overflow: visible; clip: auto; display: flex; gap: 6px; }
.sr-item { font: 700 13px var(--f-main); border: 0; border-radius: 10px; padding: 8px 10px; background: var(--paper); color: var(--graphite); cursor: pointer; }
</style>
