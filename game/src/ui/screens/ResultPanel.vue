<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { game, ui, act } from '../../game/store';
import { DEVICES, LINES, TONE } from '../../core/content';
import { LOCATIONS, PARAMS } from '../../core/params';
import { rub, signed, mult } from '../format';
import { ICON } from '../icons';
import { sfx } from '../../audio/sfx';

const c = computed(() => game.value!);
const o = computed(() => c.value.order!);
const dev = computed(() => DEVICES[o.value.deviceId]);
const fault = computed(() => dev.value.faults[o.value.faultIdx]);
const reveal = computed(() => o.value.role === 'inspector' && o.value.violation);
const quietInspector = computed(() => o.value.role === 'inspector' && !o.value.violation && o.value.outcome === 'paid');
const printed = ref(false);
const stamped = ref(false);
const thanks = computed(() => (o.value.formal ? LINES.thanks.formal : LINES.thanks.conv));
const last = computed(() => o.value.reactions[o.value.reactions.length - 1]);
const lastLine = computed(() => last.value ? (o.value.formal ? last.value.line.formal : last.value.line.conv) : '');
const arrest = computed(() => c.value.violations >= PARAMS.maxViolations);
const date = new Date().toLocaleDateString('ru-RU');
onMounted(() => {
  if (o.value.outcome === 'paid') { setTimeout(() => { printed.value = true; sfx('print'); }, 300); setTimeout(() => sfx('cash'), 2000); }
  if (reveal.value) setTimeout(() => { stamped.value = true; sfx('stamp'); }, 1700);
  if (o.value.outcome === 'complaint') setTimeout(() => { stamped.value = true; sfx('stamp'); }, 500);
});
void ui; void LOCATIONS;
</script>

<template>
  <div class="layer result">
    <!-- клиент ушёл -->
    <div v-if="o.outcome !== 'paid'" class="paper side gone" :class="{ shake: stamped }">
      <div class="lbl">Заказ № {{ String(o.no).padStart(4, '0') }} · {{ dev.name }}</div>
      <div class="said"><span class="tone hand">{{ TONE[o.mood] }}</span>{{ lastLine }}</div>
      <h3>{{ o.outcome === 'complaint' ? 'Клиент написал жалобу' : 'Клиент ушёл без ремонта' }}</h3>
      <div class="lines">
        <div class="l"><span>Оплата</span><b class="mono">0 ₽</b></div>
        <div class="l"><span>Репутация</span><b class="mono neg">{{ signed(o.repDelta) }}</b></div>
        <div v-if="o.outcome === 'complaint'" class="l"><span>Шанс проверки на следующем вызове</span><b class="mono neg">+{{ PARAMS.complaintInspectorBonus }} п.п.</b></div>
      </div>
      <div v-if="stamped && o.outcome === 'complaint'" class="big-stamp" style="right:30px;top:60px">ЖАЛОБА</div>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" type="button" @click="act.finishOrder()" autofocus>К заявкам <span v-html="ICON.arrow" /></button></div>
    </div>

    <template v-else>
      <div class="desk-row">
        <div class="receipt-col">
          <div class="printer" aria-hidden="true" />
          <div class="receipt" :class="{ on: printed }">
            <div class="c">ИП МАСТЕР НА ДЕНЬ<br>ремонт бытовой техники</div>
            <hr>
            <div class="l"><span>ЗАКАЗ</span><span>№ {{ String(o.no).padStart(4, '0') }}</span></div>
            <div class="l"><span>Дата</span><span>{{ date }}</span></div>
            <div class="l"><span>Клиент</span><span>{{ o.client.name }}</span></div>
            <div>{{ dev.name }}</div>
            <div class="small">{{ fault.name.toLowerCase() }}</div>
            <hr>
            <div class="l"><span>По прайсу</span><span>{{ rub(o.P) }}</span></div>
            <div class="l"><span>Согласовано {{ mult(o.agreedM!) }}</span><span>{{ rub(o.agreedPrice!) }}</span></div>
            <div class="l"><span>Попыток ремонта</span><span>{{ o.attempts }}</span></div>
            <div v-if="o.failures > 0" class="l"><span>Снижение оплаты</span><span>−20 %</span></div>
            <div class="l tot"><span>ИТОГО</span><span>{{ rub(o.payment) }}</span></div>
            <hr>
            <div class="l"><span>Репутация</span><span>{{ signed(o.repDelta - (o.violation ? PARAMS.inspectorRepPenalty : 0)) }}</span></div>
            <div class="c" style="margin-top:6px">СПАСИБО! ЖДЁМ СНОВА</div>
            <div class="bar" />
          </div>
        </div>

        <div v-if="reveal" class="paper protocol" :class="{ shake: stamped }">
          <div class="who"><span class="hand say">«{{ LINES.inspectorReveal }}»</span></div>
          <div class="gerb">
            <div><h3>Протокол о нарушении</h3><div class="num mono">№ {{ 40 + o.no }}-ПР · Служба контроля бытовых услуг</div></div>
            <div class="num mono">{{ LOCATIONS[o.locIdx].address }}</div>
          </div>
          <table class="ptable">
            <tr><td>Рыночная цена ремонта</td><td>{{ rub(o.P) }}</td></tr>
            <tr><td>Согласованная цена ({{ mult(o.agreedM!) }})</td><td>{{ rub(o.agreedPrice!) }}</td></tr>
            <tr><td>Фактически получено</td><td>{{ rub(o.payment) }}</td></tr>
            <tr><td>Штраф: 2 × ({{ rub(o.agreedPrice!) }} − {{ rub(o.P) }})</td><td>−{{ rub(o.fine) }}</td></tr>
            <tr><td>Репутация</td><td>{{ signed(o.repDelta) }}</td></tr>
            <tr class="sum"><td>Выявлено нарушений</td><td>{{ c.violations }} из {{ PARAMS.maxViolations }}</td></tr>
          </table>
          <div class="sig"><div class="line hand">Инспектор {{ o.client.name }}</div></div>
          <div v-if="stamped" class="big-stamp" style="left:30%;top:46%">{{ arrest ? 'АРЕСТ' : 'НАРУШЕНИЕ' }}</div>
        </div>

        <div v-else class="paper thanks">
          <div class="lbl">{{ o.client.name }}</div>
          <div class="said"><span class="tone hand">{{ TONE[o.mood] }}</span>{{ quietInspector ? LINES.inspectorQuiet : thanks }}</div>
          <div class="lines">
            <div class="l"><span>Получено</span><b class="mono pos">+{{ rub(o.payment) }}</b></div>
            <div class="l"><span>Репутация</span><b class="mono" :class="o.repDelta >= 0 ? 'pos' : 'neg'">{{ signed(o.repDelta) }}</b></div>
            <div class="l"><span>Баланс</span><b class="mono">{{ rub(c.money) }}</b></div>
          </div>
          <p v-if="o.objected" class="lbl">Клиент возражал против цены — бонус к репутации меньше.</p>
          <p v-if="o.agreedM! <= 0.9" class="lbl">Скидка понравилась клиенту: +3 к репутации.</p>
        </div>
      </div>
      <div class="cont"><button class="btn big" type="button" @click="act.finishOrder()" autofocus>{{ arrest ? 'Чем всё закончилось' : 'К заявкам' }} <span v-html="ICON.arrow" /></button></div>
    </template>
  </div>
</template>

<style scoped>
.result { background: rgba(10,12,15,.35); }
.gone { width: min(520px, calc(100vw - 36px)); overflow: hidden; }
.gone h3 { margin: 12px 0 8px; font-size: 22px; font-weight: 900; }
.said { background: var(--paper-2); border-radius: 12px; padding: 9px 12px; margin-top: 10px; }
.tone { color: var(--ink); font-size: 18px; margin-right: 6px; }
.lines { display: grid; gap: 2px; margin-top: 10px; }
.l { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; border-bottom: 1px dotted #aab2b8; }
.neg { color: var(--stamp); } .pos { color: var(--ok); }
.desk-row { position: absolute; inset: 70px 16px 90px; display: flex; gap: 26px; justify-content: center; align-items: flex-start; overflow: auto; }
.receipt-col { display: flex; flex-direction: column; align-items: center; width: 300px; flex: none; }
.printer { width: 100%; height: 30px; border-radius: 12px 12px 4px 4px; background: linear-gradient(#3b4049, #2a2e35); box-shadow: inset 0 -6px 0 #1b1e23, 0 8px 18px rgba(0,0,0,.35); position: relative; z-index: 1; }
.printer::after { content: ""; position: absolute; left: 24px; right: 24px; bottom: 4px; height: 5px; border-radius: 3px; background: #101215; }
.receipt { width: 86%; margin-top: -12px; background: var(--thermal); color: var(--thermal-ink); font-family: var(--f-mono); font-size: 13px; line-height: 1.5; padding: 0 16px; overflow: hidden; max-height: 0; transition: max-height 1.8s steps(24, end), padding .2s;
  -webkit-mask: linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat, radial-gradient(circle 5px at 7px 100%, transparent 98%, #000) bottom/14px 8px repeat-x;
  mask: linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat, radial-gradient(circle 5px at 7px 100%, transparent 98%, #000) bottom/14px 8px repeat-x; box-shadow: 0 14px 24px rgba(0,0,0,.3); }
.receipt.on { max-height: 640px; padding: 22px 16px 26px; }
.receipt .c { text-align: center; }
.receipt hr { border: 0; border-top: 1px dashed #9a9ca1; margin: 8px 0; }
.receipt .l { border: 0; padding: 0; }
.receipt .small { font-size: 12px; }
.receipt .tot { font-size: 16px; color: #222; }
.receipt .bar { height: 34px; margin-top: 10px; background: repeating-linear-gradient(90deg, #333 0 2px, transparent 2px 3px, #333 3px 4px, transparent 4px 7px, #333 7px 10px, transparent 10px 11px); }
.thanks { width: min(380px, 100%); padding: 22px; margin-top: 40px; transform: rotate(.8deg); }
.protocol { width: min(560px, 100%); padding: 22px 26px 26px; overflow: hidden; }
.who { margin-bottom: 12px; }
.say { font-size: 20px; color: var(--ink); }
.gerb { display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; border-bottom: 2px solid var(--graphite); padding-bottom: 10px; margin-bottom: 12px; }
.gerb h3 { margin: 0; font-weight: 900; font-size: 21px; }
.num { font-size: 12px; color: var(--graphite-soft); }
.ptable { width: 100%; border-collapse: collapse; font-size: 15px; }
.ptable td { padding: 7px 0; border-bottom: 1px dotted #aab2b8; }
.ptable td:last-child { text-align: right; font-family: var(--f-mono); white-space: nowrap; }
.ptable tr.sum td { font-weight: 800; border-bottom: 0; padding-top: 12px; }
.ptable tr.sum td:last-child { color: var(--stamp); font-size: 18px; }
.sig { margin-top: 16px; }
.sig .line { border-bottom: 1px solid var(--graphite); font-size: 24px; color: var(--ink); padding: 0 6px 2px; max-width: 320px; }
.cont { position: absolute; right: 18px; bottom: 18px; }
@media (max-width: 860px) { .desk-row { flex-direction: column; align-items: center; inset: 56px 8px 72px; gap: 14px; } .thanks { margin-top: 0; transform: none; } .protocol { padding: 16px; } .ptable { font-size: 13px; } .cont { left: 8px; right: 8px; bottom: max(8px, env(safe-area-inset-bottom)); } .cont .btn { width: 100%; justify-content: center; } }
@media (max-height: 520px) and (orientation: landscape) { .desk-row { inset: 48px 8px 8px; gap: 14px; } .receipt-col { width: 240px; } .thanks { margin-top: 0; } .cont { bottom: 8px; right: 10px; } }
</style>
