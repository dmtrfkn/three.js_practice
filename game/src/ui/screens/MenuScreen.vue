<script setup lang="ts">
import { ref } from 'vue';
import { canContinue, continueGame, newGame, ui } from '../../game/store';
import { LOCATIONS } from '../../core/params';
import { ICON } from '../icons';
import { rub } from '../format';
import { sfx } from '../../audio/sfx';

const confirmNew = ref(false);
function start() { sfx('click'); if (canContinue.value) confirmNew.value = true; else newGame(); }
</script>

<template>
  <div class="menu layer scroll">
    <section class="title-sheet paper">
      <div class="logo-row">
        <div class="logo-mark" aria-hidden="true" v-html="ICON.wrench" />
        <div>
          <h1>Мастер на день</h1>
          <div class="sub hand">выездной ремонт · честно, но не всегда</div>
        </div>
      </div>
      <p class="pitch">Вы — частный мастер. Осмотрите квартиру, расспросите клиента и назначьте цену ремонта. Накиньте сверху — заработаете больше. Только среди клиентов попадаются проверяющие.</p>
      <div class="actions">
        <button v-if="canContinue" class="btn big" type="button" @click="sfx('click'); continueGame()"><span v-html="ICON.arrow" />Продолжить</button>
        <button class="btn big" :class="{ ghost: canContinue }" type="button" @click="start">Новая игра</button>
        <button class="btn ghost" type="button" @click="sfx('click'); ui.settingsOpen = true"><span v-html="ICON.gear" />Настройки</button>
      </div>
      <div class="stamp-corner stamp-mark">курсовой проект · 2026</div>
    </section>

    <aside class="route">
      <div class="route-title hand">путь мастера</div>
      <ol>
        <li v-for="(l, i) in LOCATIONS" :key="l.id" :style="{ '--i': i }">
          <span class="dot" />
          <span class="nm">{{ l.name }}</span>
          <span class="q mono">{{ i < 4 ? 'квота ' + rub(l.quota) : rub(l.quota) + ' и репутация +10' }}</span>
        </li>
        <li class="goal"><span class="dot" /><span class="nm">Своя мастерская</span></li>
      </ol>
      <div class="sticky rules">
        <b>Три правила</b><br>
        1. Цена по прайсу — всегда «да».<br>
        2. Наценку замечают знающие.<br>
        3. Второе нарушение — арест.
      </div>
    </aside>

    <div v-if="confirmNew" class="modal-bg" @click.self="confirmNew = false">
      <div class="paper modal" role="dialog" aria-modal="true">
        <h3>Начать заново?</h3>
        <p>Текущая кампания будет перезаписана.</p>
        <div class="row" style="justify-content:flex-end">
          <button class="btn ghost" type="button" @click="confirmNew = false">Назад</button>
          <button class="btn stamp" type="button" @click="confirmNew = false; newGame()">Начать заново</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu { display: grid; grid-template-columns: minmax(0, 620px) minmax(0, 360px); gap: 40px; align-content: center; justify-content: center; padding: 24px; overflow: auto; }
.title-sheet { align-self: center; padding: 38px 40px 34px; transform: rotate(-.6deg); background-image: repeating-linear-gradient(180deg, transparent 0 31px, rgba(30,60,140,.10) 31px 32px); }
.logo-row { display: flex; gap: 18px; align-items: center; }
.logo-mark { width: 72px; height: 72px; border-radius: 18px; background: var(--sticker); color: var(--graphite); display: grid; place-items: center; transform: rotate(-5deg); box-shadow: 0 7px 0 var(--sticker-edge), 0 16px 26px rgba(0,0,0,.3); flex: none; }
.logo-mark :deep(svg) { width: 40px; height: 40px; stroke-width: 2.4; }
h1 { margin: 0; font-weight: 900; font-size: clamp(36px, 5vw, 56px); line-height: 1; letter-spacing: -.01em; }
.sub { font-size: 22px; color: var(--ink); margin-top: 6px; }
.pitch { font-size: 17px; max-width: 52ch; margin: 22px 0 26px; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; }
.stamp-corner { position: absolute; right: 26px; top: 20px; }
.route { align-self: center; }
.route-title { font-size: 26px; color: var(--sticker); margin-bottom: 8px; transform: rotate(-2deg); }
ol { list-style: none; margin: 0 0 26px; padding: 0 0 0 6px; position: relative; }
ol::before { content: ""; position: absolute; left: 13px; top: 12px; bottom: 12px; border-left: 2px dashed var(--desk-line); }
li { position: relative; display: grid; grid-template-columns: 22px 1fr; column-gap: 12px; padding: 7px 0; animation: rise .5s calc(var(--i, 6) * 80ms) both; }
@keyframes rise { from { opacity: 0; transform: translateY(6px); } }
.dot { width: 16px; height: 16px; border-radius: 50%; background: var(--desk-2); box-shadow: inset 0 0 0 3px var(--chalk-dim); margin-top: 3px; position: relative; z-index: 1; }
.goal .dot { background: var(--sticker); box-shadow: none; }
.nm { font-weight: 800; font-size: 17px; }
.q { grid-column: 2; font-size: 13px; color: var(--chalk-dim); }
.rules { font-size: 19px; transform: rotate(1.5deg); max-width: 300px; }
@media (max-width: 860px) { .menu { grid-template-columns: 1fr; align-content: center; padding: 16px; } .route { display: none; } .title-sheet { padding: 26px 22px 24px; transform: none; } .logo-mark { width: 54px; height: 54px; border-radius: 14px; } .logo-mark :deep(svg) { width: 30px; height: 30px; } .sub { font-size: 18px; } .pitch { font-size: 15px; margin: 16px 0 18px; } .stamp-corner { display: none; } .actions .btn { flex: 1 1 auto; justify-content: center; } }
</style>
