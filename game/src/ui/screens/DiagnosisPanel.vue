<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { game, act } from '../../game/store';
import { DEVICES } from '../../core/content';
import { ICON } from '../icons';
import { rub } from '../format';
import DeviceIcon from '../components/DeviceIcon.vue';

const o = computed(() => game.value!.order!);
const dev = computed(() => DEVICES[o.value.deviceId]);
const fault = computed(() => dev.value.faults[o.value.faultIdx]);
const done = ref(false);
onMounted(() => setTimeout(() => (done.value = true), 1400));
const typeName = { swap: 'замена детали', wires: 'прозвонка цепи', calib: 'калибровка', clean: 'разборка и чистка' } as const;
</script>

<template>
  <div class="layer">
    <div class="paper side diag" role="region" aria-label="Диагностика">
      <div class="spread"><span class="lbl">Автоматическая диагностика</span><span class="mono lbl">№ {{ String(o.no).padStart(4, '0') }}</span></div>
      <div class="dev">
        <div class="ico"><DeviceIcon :id="o.deviceId" /></div>
        <div>
          <h3>{{ dev.name }}</h3>
          <div class="sym">«{{ fault.symptom }}»</div>
        </div>
      </div>
      <div class="scan" :class="{ done }">
        <div class="bar"><i /></div>
        <div v-if="!done" class="mono lbl">сканирование…</div>
      </div>
      <template v-if="done">
        <div class="res">
          <div class="row-l"><span>Неисправность</span><b>{{ fault.name }}</b></div>
          <div class="row-l"><span>Ремонт</span><b>{{ typeName[fault.type] }}</b></div>
          <div class="row-l price"><span>Рыночная цена ремонта</span><b class="mono">{{ rub(o.P) }}</b></div>
        </div>
        <div class="row" style="justify-content:flex-end;margin-top:14px">
          <button class="btn" type="button" @click="act.toPrice()" autofocus><span v-html="ICON.money" />Назначить цену</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.diag { width: min(480px, calc(100vw - 36px)); }
.dev { display: flex; gap: 14px; align-items: center; margin: 12px 0; }
.ico { width: 86px; height: 70px; display: grid; place-items: center; background: var(--paper-2); border-radius: 10px; flex: none; }
h3 { margin: 0; font-weight: 900; font-size: 22px; }
.sym { font-family: var(--f-hand); color: var(--ink); font-size: 19px; }
.bar { height: 8px; border-radius: 4px; background: var(--paper-2); overflow: hidden; }
.bar i { display: block; height: 100%; width: 0; background: var(--ink); animation: scan 1.3s ease-out forwards; }
@keyframes scan { to { width: 100%; } }
.scan.done .bar i { background: var(--ok); }
.res { margin-top: 12px; display: grid; gap: 4px; animation: fade .3s; }
.row-l { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px dotted #aab2b8; }
.row-l b { text-align: right; }
.price b { font-size: 22px; color: var(--ink); }
</style>
