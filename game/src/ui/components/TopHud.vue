<script setup lang="ts">
import { computed } from 'vue';
import { game, ui, toMenu } from '../../game/store';
import { LOCATIONS, PARAMS } from '../../core/params';
import { ICON } from '../icons';
import { rub, signed } from '../format';

const c = computed(() => game.value!);
const loc = computed(() => LOCATIONS[c.value.locIdx]);
const call = computed(() => c.value.callsUsed);
</script>

<template>
  <div class="hud">
    <div>
      <span class="chip" title="Баланс"><span v-html="ICON.money" /><b :class="{ neg: c.money < 0 }">{{ rub(c.money) }}</b></span>
      <span class="chip" title="Репутация"><span v-html="ICON.rep" /><b>{{ signed(c.rep) }}</b></span>
      <span class="chip" :class="{ danger: c.violations > 0 }" title="Выявленные нарушения"><span v-html="ICON.violation" /><b>{{ c.violations }}<span class="full"> из </span><span class="short">/</span>{{ PARAMS.maxViolations }}</b></span>
      <span class="chip loc-chip"><span v-html="ICON.house" /><span class="full">{{ loc.name }} · вызов </span><span class="short">выз. </span>{{ call }}/{{ PARAMS.callsPerLocation }}</span>
    </div>
    <div>
      <slot />
      <button class="icon-btn" type="button" aria-label="Настройки" title="Настройки" @click="ui.settingsOpen = true" v-html="ICON.gear" />
      <button class="icon-btn" type="button" aria-label="В меню" title="В меню (игра сохранена)" @click="toMenu()" v-html="ICON.home" />
    </div>
  </div>
</template>

<style scoped>
.short { display: none; }
@media (max-width: 720px) { .full { display: none; } .short { display: inline; } }
@media (max-width: 430px) { .loc-chip { display: none; } }
</style>
