<script setup lang="ts">
import { computed } from 'vue';
import { game, act } from '../../game/store';
import { LOCATIONS } from '../../core/params';
import { DEVICES } from '../../core/content';
import { rub, signed } from '../format';
import { ICON } from '../icons';

const c = computed(() => game.value!);
const loc = computed(() => LOCATIONS[c.value.locIdx]);
const next = computed(() => LOCATIONS[c.value.locIdx + 1]);
const rows = computed(() => c.value.history.filter((h) => h.locIdx === c.value.locIdx));
const income = computed(() => rows.value.reduce((a, h) => a + h.payment, 0));
const fines = computed(() => rows.value.reduce((a, h) => a + h.fine, 0));
</script>

<template>
  <div class="layer move scroll">
    <div class="paper ledger">
      <div class="spread"><h2>Итоги: {{ loc.name }}</h2><span class="hand quota">квота {{ rub(loc.quota) }} выполнена</span></div>
      <table>
        <thead><tr><th>№</th><th>Заказ</th><th>Приход</th><th>Штраф</th><th>Репутация</th></tr></thead>
        <tbody>
          <tr v-for="h in rows" :key="h.no"><td class="mono">{{ String(h.no).padStart(4, '0') }}</td><td>{{ DEVICES[h.deviceId].name }}, {{ h.client }}<span v-if="h.outcome !== 'paid'" class="lbl"> · {{ h.outcome === 'left' ? 'ушёл' : 'жалоба' }}</span></td><td class="mono">{{ rub(h.payment) }}</td><td class="mono neg">{{ h.fine ? '−' + rub(h.fine) : '—' }}</td><td class="mono">{{ signed(h.repDelta) }}</td></tr>
        </tbody>
        <tfoot>
          <tr><td /><td>Итого за локацию</td><td class="mono">{{ rub(income) }}</td><td class="mono neg">{{ fines ? '−' + rub(fines) : '—' }}</td><td /></tr>
          <tr><td /><td>Переезд в «{{ next?.name }}»</td><td /><td class="mono neg">−{{ rub(loc.moveCost) }}</td><td /></tr>
          <tr class="bal"><td /><td>Баланс после переезда</td><td class="mono" colspan="3">{{ rub(c.money - loc.moveCost) }}</td></tr>
        </tfoot>
      </table>
      <div class="row" style="justify-content:space-between;margin-top:16px">
        <span class="lbl">Все вызовы использованы — пора дальше. Следующая квота: {{ rub(next?.quota ?? 0) }}.</span>
        <button class="btn yellow big" type="button" @click="act.move()" autofocus><span v-html="ICON.truck" />Переехать</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.move { display: grid; place-items: center; padding: 20px; }
.ledger { width: min(760px, 100%); padding: 28px 30px; background-image: linear-gradient(90deg, transparent 54px, rgba(163,41,74,.35) 54px 55px, transparent 55px), repeating-linear-gradient(180deg, transparent 0 33px, rgba(30,60,140,.12) 33px 34px); }
h2 { margin: 0; font-weight: 900; font-size: 26px; }
.quota { color: var(--ok); font-size: 22px; }
table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 15px; }
th { text-align: left; font-size: 12px; color: var(--graphite-soft); padding: 6px 4px; border-bottom: 2px solid var(--graphite); }
td { padding: 7px 4px; border-bottom: 1px dotted #aab2b8; }
td.mono { white-space: nowrap; }
.neg { color: var(--stamp); }
tfoot td { font-weight: 700; }
.bal td { font-size: 18px; border-bottom: 0; color: var(--ink); }
.move { overflow: auto; }
@media (max-width: 720px) { .ledger { padding: 18px 14px; background-image: repeating-linear-gradient(180deg, transparent 0 33px, rgba(30,60,140,.12) 33px 34px); } table { font-size: 12.5px; } th:nth-child(1), td:nth-child(1) { display: none; } h2 { font-size: 21px; } }
</style>
