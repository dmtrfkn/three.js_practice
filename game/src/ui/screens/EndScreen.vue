<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { game, newGame, abandon } from '../../game/store';
import { LOCATIONS, PARAMS } from '../../core/params';
import { rub, signed } from '../format';
import { ICON } from '../icons';
import { sfx } from '../../audio/sfx';

const c = computed(() => game.value!);
const win = computed(() => c.value.ending === 'win');
const paid = computed(() => c.value.history.filter((h) => h.outcome === 'paid').length);
const total = computed(() => c.value.history.reduce((a, h) => a + h.payment, 0));
const fines = computed(() => c.value.history.reduce((a, h) => a + h.fine, 0));
const inspectors = computed(() => c.value.history.filter((h) => h.role === 'inspector').length);
const title = computed(() => ({ win: 'Своя мастерская!', arrest: 'Арест', money: 'План не выполнен', rep: 'Не хватило репутации' }[c.value.ending ?? 'money']));
const text = computed(() => ({
  win: 'Вы накопили на собственную мастерскую и сохранили доброе имя. Теперь клиенты сами приходят к вам — со своими чайниками и проверяющими.',
  arrest: 'Второе нарушение. Служба контроля бытовых услуг передала материалы дальше — практика закрыта.',
  money: `Квота в локации «${LOCATIONS[c.value.locIdx].name}» не набрана, вызовы закончились. Честность похвальна, но план есть план.`,
  rep: `Денег на мастерскую хватает, но репутация ${signed(c.value.rep)} — ниже нужных +${PARAMS.winRep}. Банк не даёт аренду мастеру с такими отзывами.`,
}[c.value.ending ?? 'money']));
onMounted(() => sfx(win.value ? 'success' : 'stamp'));
</script>

<template>
  <div class="layer end scroll">
    <div class="paper sheet" :class="{ win }">
      <div class="big-stamp" :class="{ ok: win }" style="right:34px;bottom:96px">{{ win ? 'ОТКРЫТО' : c.ending === 'arrest' ? 'АРЕСТ' : 'ЗАКРЫТО' }}</div>
      <div class="lbl">Итог кампании</div>
      <h1>{{ title }}</h1>
      <p class="text">{{ text }}</p>
      <div class="stats">
        <div><span class="lbl">Дошли до</span><b>{{ LOCATIONS[c.locIdx].name }}</b></div>
        <div><span class="lbl">Баланс</span><b class="mono">{{ rub(c.money) }}</b></div>
        <div><span class="lbl">Репутация</span><b class="mono">{{ signed(c.rep) }}</b></div>
        <div><span class="lbl">Оплаченных заказов</span><b class="mono">{{ paid }} из {{ c.history.length }}</b></div>
        <div><span class="lbl">Заработано</span><b class="mono">{{ rub(total) }}</b></div>
        <div><span class="lbl">Штрафы</span><b class="mono">{{ fines ? '−' + rub(fines) : '—' }}</b></div>
        <div><span class="lbl">Встречено проверяющих</span><b class="mono">{{ inspectors }}</b></div>
      </div>
      <div class="row" style="margin-top:20px">
        <button class="btn big" type="button" @click="newGame()"><span v-html="ICON.arrow" />Новая кампания</button>
        <button class="btn ghost" type="button" @click="abandon()">В главное меню</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.end { display: grid; place-items: center; padding: 20px; }
.sheet { width: min(680px, 100%); padding: 34px 34px 30px; overflow: hidden; }
h1 { margin: 4px 0 8px; font-weight: 900; font-size: clamp(32px, 5vw, 48px); line-height: 1.05; }
.text { font-size: 17px; max-width: 52ch; }
.stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px 18px; margin-top: 18px; }
.stats div { display: grid; gap: 2px; padding: 8px 0; border-bottom: 1px dotted #aab2b8; }
.stats b { font-size: 18px; }
.end { overflow: auto; }
@media (max-width: 720px) { .sheet { padding: 22px 18px; } .stats { grid-template-columns: 1fr 1fr; } .text { font-size: 15px; } }
</style>
