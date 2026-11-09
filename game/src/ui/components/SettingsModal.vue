<script setup lang="ts">
import { settings, ui } from '../../game/store';
import { sfx } from '../../audio/sfx';
</script>

<template>
  <div class="modal-bg" @click.self="ui.settingsOpen = false">
    <div class="paper modal" role="dialog" aria-modal="true" aria-labelledby="set-title">
      <h3 id="set-title">Настройки</h3>
      <label class="set" for="vol">
        <span class="spread"><span>Общая громкость</span><b class="mono">{{ Math.round(settings.volume * 100) }} %</b></span>
        <input id="vol" type="range" min="0" max="1" step="0.1" v-model.number="settings.volume" @change="sfx('click')">
      </label>
      <label class="set" for="mus">
        <span class="spread"><span>Музыка</span><b class="mono">{{ Math.round(settings.music * 100) }} %</b></span>
        <input id="mus" type="range" min="0" max="1" step="0.1" v-model.number="settings.music">
      </label>
      <label class="set" for="sens">
        <span class="spread"><span>Чувствительность камеры</span><b class="mono">×{{ settings.sensitivity.toFixed(1).replace('.', ',') }}</b></span>
        <input id="sens" type="range" min="0.5" max="2" step="0.1" v-model.number="settings.sensitivity">
      </label>
      <p class="lbl">Музыка звучит в меню и на доске заявок, в квартире клиента — только звуки комнаты. Озвучки реплик нет. Настройки сохраняются между запусками.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" @click="ui.settingsOpen = false">Готово</button></div>
    </div>
  </div>
</template>

<style scoped>
.set { display: grid; gap: 6px; margin: 14px 0; font-weight: 700; }
input[type=range] { width: 100%; accent-color: var(--ink); }
</style>
