<script setup lang="ts">
import { computed } from 'vue';
import { game, ui, act } from '../../game/store';
import { availableQuestions } from '../../core/campaign';
import { ALL_ITEMS, BASE_QUESTIONS, TONE } from '../../core/content';
import { LOCATIONS, PARAMS } from '../../core/params';
import { ICON } from '../icons';
import Portrait from '../components/Portrait.vue';
import type { RoomScene } from '../../scene/RoomScene';

const props = defineProps<{ scene: RoomScene | null }>();
const o = computed(() => game.value!.order!);
const qs = computed(() => availableQuestions(o.value));
const left = computed(() => PARAMS.questionsToAsk - o.value.asked.length);
const qText = (id: string) => id === 'base_urgency' ? BASE_QUESTIONS.urgency.q : id === 'base_knowledge' ? BASE_QUESTIONS.knowledge.q : (ALL_ITEMS[id]?.question ?? 'Что это?');
const openQ = computed(() => o.value.openAnswer);
// ответ восстанавливается и после загрузки
import { answerText } from '../../core/campaign';
const answer = computed(() => (openQ.value ? answerText(o.value, openQ.value) : ''));
const app = computed(() => props.scene?.appearance ?? null);
const locId = computed(() => LOCATIONS[o.value.locIdx].id);
void ui;
</script>

<template>
  <div class="layer">
    <div class="paper side dialog" role="region" aria-label="Разговор с клиентом">
      <div class="grid">
        <div class="left">
          <Portrait v-if="app" :a="app" :mood="o.mood" :loc-id="locId" />
          <div class="name">{{ o.client.name }}</div>
        </div>
        <div class="right">
          <div class="spread">
            <span class="lbl">Разговор</span>
            <span class="left-q hand">осталось вопросов: {{ left }}</span>
          </div>
          <div class="log">
            <template v-for="id in o.asked" :key="id">
              <div class="q">{{ qText(id) }}</div>
              <div v-if="id === openQ" class="a"><span class="tone hand">{{ TONE[o.mood] }}</span>{{ answer }}</div>
              <div v-else class="a past">{{ answerText(o, id) }}</div>
            </template>
          </div>
          <div v-if="openQ" class="row" style="margin-top:12px">
            <button class="btn" type="button" @click="act.continueDialogue()" autofocus>Продолжить <span v-html="ICON.arrow" /></button>
          </div>
          <div v-else class="qs">
            <button v-for="q in qs" :key="q.id" type="button" @click="act.ask(q.id)"><span v-html="ICON.q" />{{ q.text }}</button>
          </div>
        </div>
      </div>
      <p class="lbl foot">Заметок нет — запоминайте ответы сами.</p>
    </div>
  </div>
</template>

<style scoped>
.dialog { width: min(640px, calc(100vw - 36px)); }
.grid { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 18px; }
.name { font-weight: 800; text-align: center; margin-top: 6px; }
.left-q { font-size: 19px; color: var(--stamp); }
.log { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.q { align-self: flex-start; max-width: 95%; background: var(--paper-2); border-radius: 12px 12px 12px 4px; padding: 9px 12px; font-weight: 700; font-size: 15px; }
.a { padding: 2px 0 2px 14px; border-left: 3px solid var(--ink-soft); font-size: 16px; animation: fade .3s; }
.a.past { color: var(--graphite-soft); border-left-color: var(--paper-edge); font-size: 14px; }
.tone { display: block; color: var(--ink); font-size: 18px; margin-bottom: 2px; }
.qs { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.qs button { text-align: left; font: 600 15px var(--f-main); color: var(--graphite); background: transparent; border: 2px dashed var(--paper-edge); border-radius: 12px; padding: 10px 12px; cursor: pointer; display: flex; gap: 10px; align-items: center; }
.qs button:hover { border-color: var(--ink-soft); background: rgba(30,60,140,.05); }
.qs button :deep(svg) { width: 18px; height: 18px; flex: none; color: var(--ink); }
.foot { margin: 14px 0 0; }
@media (max-width: 720px), (max-height: 520px) { .grid { grid-template-columns: 64px minmax(0, 1fr); gap: 12px; } .name { font-size: 12px; } .qs button { font-size: 14px; padding: 9px 10px; } .a { font-size: 15px; } .foot { display: none; } }
</style>
