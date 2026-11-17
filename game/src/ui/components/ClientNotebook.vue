<script setup lang="ts">
import { computed } from 'vue';
import { clientProfile } from '../../core/profile';
import type { Order } from '../../core/types';
const props = defineProps<{ order: Order; multiplier?: number }>();
const profile = computed(() => clientProfile(props.order, props.multiplier ?? 1));
const ratio = (n: number) => '×' + n.toFixed(2).replace('.', ',');
const percent = (n: number) => `${Math.round(n * 100)} %`;
const range = (a: number, b: number, format: (n: number) => string) => Math.abs(a - b) < 0.001 ? format(a) : `${format(a)}–${format(b)}`;
</script>

<template>
  <details class="notebook">
    <summary>Блокнот мастера <span>записей: {{ profile.facts.length }}</span></summary>
    <p v-if="!profile.hasEvidence">Надёжных выводов пока нет. Осмотрите предметы и расспросите клиента.</p>
    <ul v-else><li v-for="fact in profile.facts" :key="fact.label"><b>{{ fact.label }}: {{ fact.value }}</b><small>{{ fact.source }}</small></li></ul>
    <template v-if="multiplier !== undefined && (order.sk?.reading ?? 0) >= 3 && order.reactions.length === 0">
      <p><b>Оценка предела: {{ range(...profile.limit, ratio) }}</b><br>Выше этого предела обычный клиент попросит снизить цену. Неизвестные признаки расширяют диапазон.</p>
      <p><b>Шанс заметить наценку: {{ range(...profile.notice, percent) }}</b><br>Даже в пределах цены обнаруженная наценка может вызвать отказ. Проверяющий ведёт себя иначе.</p>
    </template>
    <p v-else-if="multiplier !== undefined && (order.sk?.reading ?? 0) >= 3 && order.reactions.length">Клиент уже возразил. Его новая граница цены неизвестна: предыдущая оценка больше не гарантирует согласия.</p>
  </details>
</template>

<style scoped>
.notebook { margin-top: 12px; padding: 9px 11px; border: 2px solid var(--ink); background: #f4efda; color: var(--graphite); font-size: 16px; }
summary { cursor: pointer; color: var(--ink-dark); font-weight: 800; }
summary span { float: right; color: var(--graphite-soft); font-weight: 600; }
ul { padding-left: 18px; margin: 8px 0 0; }
li { margin: 5px 0; }
small { display: block; color: var(--graphite-soft); font-size: 14px; }
p { margin: 8px 0 0; line-height: 1.3; }
</style>
