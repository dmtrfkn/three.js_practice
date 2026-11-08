<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { game, ui, act } from '../../game/store';
import { DEVICES, TONE } from '../../core/content';
import { PARAMS, MINIGAME_DIFFICULTY as MD } from '../../core/params';
import { createMini, type Mini } from '../../minigames/minigames';
import { ICON } from '../icons';
import { rub } from '../format';
import { TOUCH } from '../device';
const portrait = typeof window !== 'undefined' && window.innerWidth < window.innerHeight;
const CW = portrait ? 600 : 900, CH = portrait ? 760 : 560;

const o = computed(() => game.value!.order!);
const dev = computed(() => DEVICES[o.value.deviceId]);
const fault = computed(() => dev.value.faults[o.value.faultIdx]);
const limit = computed(() => MD.maxErrors[fault.value.type]);
const cv = ref<HTMLCanvasElement | null>(null);
let mini: Mini | null = null;
const running = ref(false);
const timeLeft = ref<number>(PARAMS.repairSeconds);
const errors = ref(0);
const msg = ref('');
let timer = 0, endAt = 0;
const instr = { swap: 'Перетащите деталь с нужной маркировкой в гнездо. Неверная деталь — искра и ошибка.', wires: 'Ставьте щупы на два конца одного провода. «0 Ом» — провод целый, «OL» на одном проводе — обрыв найден.', calib: TOUCH ? 'Останавливайте стрелку в зелёной зоне тапом. Каждое попадание ускоряет стрелку.' : 'Останавливайте стрелку в зелёной зоне пробелом или кликом. Каждое попадание ускоряет стрелку.', clean: TOUCH ? 'Выкрутите винты по номерам, затем проведите пальцем по грязи и сотрите её.' : 'Выкрутите винты по номерам, затем зажмите кнопку мыши и сотрите всю грязь.' } as const;
const accepted = computed(() => ui.lastReaction && (ui.lastReaction.kind === 'accept' || ui.lastReaction.kind === 'acceptSecond') && o.value.attempts === 0 ? ui.lastReaction : null);

async function start() {
  act.beginAttempt();
  errors.value = 0; msg.value = ''; running.value = true; timeLeft.value = PARAMS.repairSeconds;
  await nextTick();
  const li = o.value.locIdx, f = fault.value;
  mini = createMini(f.type, cv.value!, {
    label: f.calibLabel ?? 'КАЛИБРОВКА', deviceName: dev.value.name, part: f.part,
    parts: MD.swapParts[li], wires: MD.wires[li], hits: MD.calibHits[li], zone: MD.calibZone[li], period: MD.calibPeriod[li], screws: MD.screws[li], dirt: MD.dirt[li],
    seed: o.value.no * 977 + o.value.attempts * 131,
  }, {
    onError: (m) => { errors.value++; msg.value = m; if (errors.value > limit.value) fail('Слишком много ошибок'); },
    onInfo: (m) => { msg.value = m; },
    onSuccess: () => { cleanup(); act.succeedAttempt(); },
  });
  endAt = performance.now() + PARAMS.repairSeconds * 1000;
  timer = window.setInterval(() => { timeLeft.value = Math.max(0, Math.ceil((endAt - performance.now()) / 1000)); if (timeLeft.value <= 0) fail('Время вышло'); }, 100);
}
function cleanup() { clearInterval(timer); mini?.stop(); setTimeout(() => { mini?.destroy(); mini = null; }, 700); running.value = false; }
function fail(reason: string) { if (!running.value) return; msg.value = reason; cleanup(); act.failAttempt(); }
function onKey(e: KeyboardEvent) { if (running.value && (e.key === ' ' || e.key === 'Enter') && fault.value.type === 'calib') { e.preventDefault(); mini?.key(e.key); } }
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); clearInterval(timer); mini?.destroy(); });
</script>

<template>
  <div class="layer">
    <div v-if="!running" class="paper side intro" role="region" aria-label="Ремонт">
      <div v-if="accepted" class="said"><span class="tone hand">{{ TONE[o.mood] }}</span>{{ accepted.text }}</div>
      <div class="spread"><span class="lbl">Ремонт · {{ dev.name }}</span><span class="mono">согласовано {{ rub(o.agreedPrice!) }}</span></div>
      <h3>{{ fault.name }}</h3>
      <p>{{ instr[fault.type] }}</p>
      <div v-if="o.failures > 0" class="sticky warn fail-note">
        {{ msg || 'Попытка не удалась' }}. Оплата снижена до {{ Math.round(PARAMS.failedPaymentFactor * 100) }} % — {{ rub(o.agreedPrice! * PARAMS.failedPaymentFactor) }}. Повторные попытки оплату больше не снижают.
      </div>
      <div class="row" style="justify-content:space-between;margin-top:14px">
        <span class="lbl">{{ PARAMS.repairSeconds }} секунд на попытку · ошибок можно {{ limit }}</span>
        <button class="btn" :class="{ stamp: o.failures > 0 }" type="button" @click="start" autofocus><span v-html="ICON.wrench" />{{ o.failures > 0 ? 'Повторить' : 'Начать ремонт' }}</button>
      </div>
    </div>

    <div v-else class="bench" :style="{ '--ar': CW / CH }">
      <div class="bench-top">
        <span class="chip">{{ dev.name }} · {{ fault.name.toLowerCase() }}</span>
        <span class="chip dark" :class="{ urgent: timeLeft <= 5 }"><span v-html="ICON.timer" /><b>0:{{ String(timeLeft).padStart(2, '0') }}</b></span>
      </div>
      <canvas ref="cv" :width="CW" :height="CH" class="mini" :style="{ aspectRatio: CW + '/' + CH }" aria-label="Миниигра ремонта" />
      <div class="bench-foot">
        <div class="errs" :aria-label="`Ошибки: ${errors} из ${limit + 1}`">
          <i v-for="k in limit + 1" :key="k" :class="{ bad: k <= errors }">{{ k <= errors ? '✕' : '' }}</i>
        </div>
        <span class="msg hand">{{ msg }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intro { width: min(520px, calc(100vw - 36px)); }
.intro h3 { margin: 10px 0 6px; font-size: 22px; font-weight: 900; }
.said { background: var(--paper-2); border-radius: 12px; padding: 9px 12px; margin-bottom: 12px; animation: fade .3s; }
.tone { color: var(--ink); font-size: 18px; margin-right: 6px; }
.fail-note { margin-top: 10px; font-size: 18px; }
.bench { position: absolute; inset: 0; display: grid; place-items: center; align-content: center; gap: 12px; background: rgba(10,12,15,.55); padding: 70px 16px 16px; animation: fade .25s; }
.bench-top, .bench-foot { width: min(900px, 100%); display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.mini { width: min(900px, 100%, calc((100dvh - 150px) * var(--ar, 1.6))); height: auto; border-radius: 18px; box-shadow: 0 30px 60px rgba(0,0,0,.5); cursor: crosshair; touch-action: none; }
.urgent { background: var(--stamp) !important; }
.urgent b { color: #fff !important; }
.errs { display: flex; gap: 6px; }
.errs i { width: 26px; height: 26px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--chalk-dim); display: grid; place-items: center; font-style: normal; font-weight: 900; color: #fff; }
.errs i.bad { background: var(--stamp); box-shadow: none; }
.msg { font-size: 22px; color: var(--sticker); }
@media (max-width: 720px), (max-height: 520px) { .bench { padding: 52px 8px 8px; gap: 8px; } .msg { font-size: 18px; } .bench-top .chip:first-child { max-width: 60vw; overflow: hidden; text-overflow: ellipsis; } .errs i { width: 22px; height: 22px; } }
</style>
