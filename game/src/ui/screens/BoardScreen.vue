<script setup lang="ts">
import { computed, ref } from 'vue';
import { BRANCHES, PARTS, TOOLS, COMPONENTS, componentPrice, componentStock, toolStages, level, nextCost, kitPrice, type ComponentId } from '../../core/progress';
import { game, ui, act, toMenu } from '../../game/store';
import { LOCATIONS, PARAMS } from '../../core/params';
import { DEVICES, URGENCY_HINT, OMENS } from '../../core/content';
import { locationState } from '../../core/campaign';
import { ICON } from '../icons';
import { rub, signed, plural } from '../format';
import DeviceIcon from '../components/DeviceIcon.vue';
import { sfx } from '../../audio/sfx';

const workshopOpen = ref(false);
const selectedComponent = ref<ComponentId>(COMPONENTS[0].id);
const chosenComponent = computed(() => COMPONENTS.find(p => p.id === selectedComponent.value)!);
const c = computed(() => game.value!);
const loc = computed(() => LOCATIONS[c.value.locIdx]);
const st = computed(() => locationState(c.value));
const offers = computed(() => c.value.offers);
const tierMark = (t: number) => '₽'.repeat(t + 1);
const omenText = (o: (typeof offers.value)[number]) => {
  if (!o.omen) return null;
  if (o.omen.type === 'scandal') return OMENS.scandal;
  return OMENS[o.omen.type][o.omen.level];
};
const pending = computed(() => offers.value.find((o) => o.id === ui.confirmOffer) ?? null);
const progress = computed(() => Math.max(0, Math.min(1, c.value.money / st.value.quota)));
const last = computed(() => c.value.history[c.value.history.length - 1] ?? null);
function choose(id: string) { if (st.value.callsLeft <= 0) return; sfx('pin'); sfx('paper'); ui.confirmOffer = id; }
</script>

<template>
  <div class="board layer scroll">
    <div class="hud">
      <div>
        <span class="chip"><span v-html="ICON.money" /><b :class="{ neg: c.money < 0 }">{{ rub(c.money) }}</b></span>
        <span class="chip"><span v-html="ICON.rep" /><span class="t">репутация </span><b>{{ signed(c.rep) }}</b></span>
        <span class="chip" :class="{ danger: c.violations > 0 }"><span v-html="ICON.violation" /><span class="t">нарушений </span><b>{{ c.violations }}</b></span>
      </div>
      <div>
        <button class="icon-btn" type="button" aria-label="Настройки" @click="ui.settingsOpen = true" v-html="ICON.gear" />
        <button class="icon-btn" type="button" aria-label="В меню" @click="toMenu()" v-html="ICON.home" />
      </div>
    </div>

    <div class="wrap">
      <div class="cork">
        <div class="board-top">
          <div>
            <div class="loc-name">{{ loc.name }}</div>
            <div class="hand addr">заявки · {{ loc.address }}</div>
          </div>
          <div class="goal-box paper">
            <div class="spread"><span class="lbl">{{ st.isOffice ? 'до мастерской' : 'квота для переезда' }}</span><b class="mono">{{ rub(c.money) }} / {{ rub(st.quota) }}</b></div>
            <div class="bar"><i :style="{ width: progress * 100 + '%' }" /></div>
            <div class="spread small">
              <span>вызовов осталось: <b>{{ st.callsLeft }}</b> из {{ PARAMS.callsPerLocation }}</span>
              <span v-if="st.isOffice">репутация {{ signed(c.rep) }} / +{{ PARAMS.winRep }}</span>
              <span v-else>переезд {{ rub(loc.moveCost) }}</span>
            </div>
          </div>
        </div>

        <div class="cards">
          <article v-for="(o, i) in offers" :key="o.id" class="order" :class="{ taken: o.taken }" :style="{ '--r': [-2, 1.4, -0.6, 2.2, -1.6][i] + 'deg', '--y': [0, 8, 0, 4, 10][i] + 'px' }"
                   :tabindex="o.taken ? -1 : 0" role="button" :aria-disabled="o.taken" :aria-label="`Заявка ${o.no}: ${DEVICES[o.deviceId].name}, клиент ${o.client.name}`"
                   @click="!o.taken && choose(o.id)" @keydown.enter="!o.taken && choose(o.id)" @mouseenter="!o.taken && sfx('hover')">
            <span class="pin" aria-hidden="true" />
            <span class="stamp-mark tier">{{ tierMark(o.tier) }}</span>
            <div class="no mono">заявка № {{ String(o.no).padStart(4, '0') }}</div>
            <h3>{{ DEVICES[o.deviceId].name }}</h3>
            <div class="who">{{ o.client.name }}</div>
            <div class="ico"><DeviceIcon :id="o.deviceId" /></div>
            <div class="sym">{{ DEVICES[o.deviceId].faults[o.faultIdx].symptom }}.</div>
            <div v-if="o.urgencyHint" class="urg hand">{{ URGENCY_HINT[o.client.urgency] }}</div>
            <div v-if="omenText(o)" class="sticky omen" :class="{ warn: o.omen?.type === 'scandal' }">{{ omenText(o) }}</div>
            <div v-if="o.taken" class="done-stamp">ВЫПОЛНЕНО</div>
          </article>
        </div>

        <div v-if="c.news?.length" class="news paper"><b>Новости</b><p v-for="(notice, i) in c.news" :key="i">{{ notice }}</p></div>
        <div class="board-foot">
          <div v-if="last" class="last hand">прошлый заказ: {{ DEVICES[last.deviceId].name.toLowerCase() }}, {{ last.client }} — {{ last.outcome === 'paid' ? 'оплачено ' + rub(last.payment) : last.outcome === 'left' ? 'клиент ушёл' : 'жалоба' }}{{ last.violation ? ', штраф ' + rub(last.fine) : '' }}</div>
          <div v-else class="last hand">выберите заявку — цена станет известна после диагностики</div>
          <div class="row">
            <button class="btn ghost" type="button" @click="workshopOpen = true"><span v-html="ICON.wrench" />Мастерская</button>
            <button v-if="st.canMove" class="btn yellow" type="button" @click="ui.confirmMove = true"><span v-html="ICON.truck" />Переехать за {{ rub(loc.moveCost) }}</button>
            <button v-if="st.canWin" class="btn ok" type="button" @click="act.workshop()"><span v-html="ICON.wrench" />Открыть мастерскую</button>
          </div>
        </div>
        <div v-if="st.canMove" class="move-note sticky">Вы уже сейчас можете переехать!</div>
      </div>
    </div>

    <div v-if="workshopOpen" class="modal-bg" @click.self="workshopOpen = false">
      <div class="paper modal shop" role="dialog" aria-modal="true" aria-label="Навыки, инструменты и детали">
        <div class="spread"><h3>Мастерская на колёсах</h3><button class="btn ghost" type="button" @click="workshopOpen = false">Закрыть</button></div>
        <p>Баланс: <b>{{ rub(c.money) }}</b>. Вложения помогают в работе, но оставьте деньги на переезд.</p>
        <h4>Навыки</h4>
        <div v-for="branch in BRANCHES" :key="branch.id" class="shop-row">
          <div><b>{{ branch.name }} · {{ level(c, branch.id) }}/3</b><div>{{ branch.levels[level(c, branch.id)].effect }}</div><small v-if="nextCost(c, branch.id) !== null">Следующий уровень: {{ branch.levels[level(c, branch.id) + 1].effect }}</small></div>
          <button class="btn" type="button" :disabled="nextCost(c, branch.id) === null || c.money < nextCost(c, branch.id)!" @click="act.buySkill(branch.id)">{{ nextCost(c, branch.id) === null ? 'Максимум' : rub(nextCost(c, branch.id)!) }}</button>
        </div>
        <h4>Комплекты деталей</h4>
        <div v-for="part in PARTS" :key="part.id" class="shop-row">
          <div><b>{{ part.name }} · в запасе {{ c.parts?.[part.id] ?? 0 }}</b><div>{{ part.about }}</div></div>
          <button class="btn" type="button" :disabled="c.money < kitPrice(c.locIdx, part.id)" @click="act.buyParts(part.id)">Купить {{ rub(kitPrice(c.locIdx, part.id)) }}</button>
        </div>
        <h4>Каталог запасных частей · {{ COMPONENTS.length }} позиций</h4>
        <p>Точная деталь дешевле универсального комплекта, но подходит только к указанной поломке. Выберите качество: подходящая деталь будет использована автоматически.</p>
        <label class="component-select">Деталь
          <select v-model="selectedComponent">
            <option v-for="item in COMPONENTS" :key="item.id" :value="item.id">{{ DEVICES[item.device].name }} — {{ item.name }}</option>
          </select>
        </label>
        <p class="lbl">{{ DEVICES[chosenComponent.device].name }}: {{ DEVICES[chosenComponent.device].faults[chosenComponent.fault].symptom }}.</p>
        <div v-for="part in PARTS" :key="part.id" class="shop-row">
          <div><b>{{ chosenComponent.name }} · {{ part.name }}</b><div>На складе: {{ componentStock(c, selectedComponent, part.id) }} шт.</div><small>{{ part.about }}</small></div>
          <button class="btn" type="button" :disabled="c.money < componentPrice(c.locIdx, selectedComponent, part.id)" @click="act.buyComponent(selectedComponent, part.id)">Купить {{ rub(componentPrice(c.locIdx, selectedComponent, part.id)) }}</button>
        </div>
        <h4>Инструменты · остаются навсегда</h4>
        <div v-for="tool in TOOLS" :key="tool.id" class="shop-row">
          <div><b>{{ tool.name }}</b><div>{{ tool.about }}</div><small v-if="toolStages(tool.id)">Этапы: {{ toolStages(tool.id) }}.</small></div>
          <button class="btn" type="button" :disabled="!!c.tools?.[tool.id] || c.money < tool.cost" @click="act.buyTool(tool.id)">{{ c.tools?.[tool.id] ? 'Куплено' : 'Купить ' + rub(tool.cost) }}</button>
        </div>
      </div>
    </div>

    <div v-if="pending" class="modal-bg" @click.self="ui.confirmOffer = null">
      <div class="paper modal" role="dialog" aria-modal="true">
        <h3>Поехать к клиенту {{ pending.client.name }}?</h3>
        <p>{{ DEVICES[pending.deviceId].name }}: {{ DEVICES[pending.deviceId].faults[pending.faultIdx].symptom.toLowerCase() }}. Вызов будет израсходован, даже если клиент откажется от ремонта.</p>
        <div class="row" style="justify-content:flex-end">
          <button class="btn ghost" type="button" @click="ui.confirmOffer = null">Назад <span class="kbd">Esc</span></button>
          <button class="btn" type="button" @click="act.takeOffer(pending.id)"><span v-html="ICON.arrow" />Поехать</button>
        </div>
      </div>
    </div>

    <div v-if="ui.confirmMove" class="modal-bg" @click.self="ui.confirmMove = false">
      <div class="paper modal" role="dialog" aria-modal="true">
        <h3>Переезд: {{ LOCATIONS[c.locIdx + 1]?.name }}</h3>
        <p>Стоимость переезда {{ rub(loc.moveCost) }}. Оставшиеся вызовы этой локации ({{ st.callsLeft }} {{ plural(st.callsLeft, 'вызов', 'вызова', 'вызовов') }}) будут потеряны.</p>
        <div class="row" style="justify-content:flex-end">
          <button class="btn ghost" type="button" @click="ui.confirmMove = false">Остаться</button>
          <button class="btn yellow" type="button" @click="act.move()"><span v-html="ICON.truck" />Переехать</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board { overflow: auto; }
.shop { width: min(740px, calc(100vw - 24px)); max-height: 90dvh; overflow: auto; }
.shop h4 { margin: 18px 0 5px; }
.shop-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px dotted #aab2b8; padding: 10px 0; }
.shop-row small { color: var(--ink); }
.component-select { display: grid; gap: 4px; font-weight: 700; }
.component-select select { max-width: 100%; padding: 9px; background: var(--paper-2); color: var(--graphite); border: 2px solid var(--graphite); font-size: 15px; }
.shop-row button { flex: none; }
.news { padding: 10px 14px; margin-top: 20px; }
.news p { margin: 4px 0; }
@media (max-width: 620px) { .shop-row { align-items: flex-start; flex-direction: column; } }
.wrap { min-height: 100%; display: grid; place-items: center; padding: 72px 20px 24px; }
.cork { position: relative; width: min(1180px, 100%); border-radius: 22px; padding: 28px 26px 26px; color: #2b1d0f;
  background:
    radial-gradient(circle at 20% 30%, rgba(0,0,0,.12) 0 1.2px, transparent 1.6px) 0 0/9px 11px,
    radial-gradient(circle at 70% 60%, rgba(255,255,255,.08) 0 1px, transparent 1.4px) 0 0/13px 7px,
    radial-gradient(circle at 40% 80%, rgba(0,0,0,.10) 0 1.5px, transparent 2px) 0 0/17px 15px,
    linear-gradient(160deg, #be9563, var(--cork) 45%, #a77d4e);
  box-shadow: inset 0 0 0 10px #5a4127, inset 0 0 0 12px #3e2c1a, inset 0 10px 30px rgba(0,0,0,.35), 0 26px 50px rgba(0,0,0,.45); }
.board-top { display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 22px; }
.loc-name { font-weight: 900; font-size: 30px; line-height: 1; color: #24180c; }
.addr { font-size: 21px; }
.goal-box { padding: 12px 14px; min-width: min(380px, 100%); transform: rotate(.6deg); }
.goal-box .small { font-size: 13px; margin-top: 6px; color: var(--graphite-soft); }
.bar { height: 10px; border-radius: 6px; background: var(--paper-2); margin-top: 8px; overflow: hidden; }
.bar i { display: block; height: 100%; background: repeating-linear-gradient(45deg, var(--ok) 0 8px, #3a9461 8px 16px); transition: width .6s; }
.cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; }
.order { position: relative; background: var(--paper); color: var(--graphite); border-radius: 4px 4px 10px 4px; padding: 22px 14px 14px; box-shadow: 0 2px 0 var(--paper-edge), 0 14px 22px rgba(40,24,8,.35); transform: rotate(var(--r)) translateY(var(--y)); transition: transform .18s ease, box-shadow .18s ease; cursor: pointer; min-width: 0; outline: none; }
.order:hover:not(.taken), .order:focus-visible { transform: rotate(0) translateY(-8px); box-shadow: 0 2px 0 var(--paper-edge), 0 24px 30px rgba(40,24,8,.45); }
.order:focus-visible { outline: 3px solid var(--sticker); }
.order.taken { cursor: default; filter: saturate(.3) brightness(.85); }
.pin { position: absolute; top: -7px; left: 50%; width: 18px; height: 18px; margin-left: -9px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #f07a8f, var(--stamp) 60%, #5c1328); box-shadow: 0 4px 4px rgba(0,0,0,.35); }
.no { font-size: 11px; color: var(--graphite-soft); }
.order h3 { margin: 2px 0 0; font-size: 17px; font-weight: 800; line-height: 1.15; padding-right: 34px; }
.who { font-size: 13px; color: var(--graphite-soft); margin-top: 2px; }
.tier { position: absolute; top: 14px; right: 10px; }
.ico { height: 64px; display: grid; place-items: center; margin: 10px 0 6px; background: var(--paper-2); border-radius: 8px; }
.sym { font-size: 13.5px; line-height: 1.35; min-height: 54px; }
.urg { margin-top: 6px; color: var(--ink); font-size: 18px; line-height: 1.1; }
.omen { margin: 10px -6px -4px auto; width: fit-content; max-width: 100%; font-size: 16px; padding: 7px 9px; transform: rotate(-2.5deg); }
.done-stamp { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%) rotate(-14deg); font: 900 20px var(--f-main); letter-spacing: .06em; color: var(--stamp); border: 3px solid var(--stamp); border-radius: 8px; padding: 2px 10px; opacity: .85; }
.board-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
.last { font-size: 20px; color: #2b1d0f; }
.move-note { position: absolute; right: 30px; top: -18px; transform: rotate(3deg); font-size: 20px; }
.tut ol { padding-left: 20px; margin: 6px 0 12px; display: grid; gap: 8px; }
@media (max-width: 1000px) { .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 720px) { .t { display: none; } }
@media (max-width: 620px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } .wrap { padding: 56px 8px 16px; place-items: start center; } .cork { padding: 18px 12px 16px; border-radius: 16px; } .loc-name { font-size: 24px; } .addr { font-size: 18px; } .goal-box { min-width: 0; width: 100%; } .order { padding: 18px 10px 10px; transform: rotate(calc(var(--r) / 2)); } .order h3 { font-size: 15px; } .sym { font-size: 12.5px; min-height: 0; } .ico { height: 52px; } .move-note { position: static; margin-top: 12px; transform: none; display: inline-block; } .last { font-size: 17px; } }
@media (max-height: 520px) and (orientation: landscape) { .wrap { padding: 50px 10px 12px; place-items: start center; } .cork { padding: 16px; } .board-top { margin-bottom: 14px; } }
</style>
