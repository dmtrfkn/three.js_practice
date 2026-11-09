// Реактивная обёртка над ядром: каждое действие вызывает функцию ядра и сразу сохраняет игру.
import { reactive, ref, watch } from 'vue';
import * as core from '../core/campaign';
import type { Campaign } from '../core/types';
import { loadCampaign, saveCampaign, hasSave, clearSave, loadSettings, saveSettings, type Settings } from '../core/save';
import { sfx, setVolume, setMusicVolume } from '../audio/sfx';

export type Screen = 'menu' | 'game';

export const ui = reactive({
  screen: 'menu' as Screen,
  settingsOpen: false,
  helpOpen: false,
  confirmOffer: null as string | null,
  confirmMove: false,
  toast: '' as string,
  lastAnswer: '' as string,
  lastReaction: null as null | { text: string; tone: number; kind: string },
  showReveal: false,
});

export const settings = reactive<Settings>(loadSettings());
watch(settings, (s) => { saveSettings({ ...s }); setVolume(s.volume); setMusicVolume(s.music); }, { deep: true });
setVolume(settings.volume);
setMusicVolume(settings.music);

export const game = ref<Campaign | null>(null);
export const canContinue = ref(hasSave());

function persist() { if (game.value) saveCampaign(game.value); canContinue.value = true; }

let toastTimer = 0;
export function toast(msg: string) { ui.toast = msg; clearTimeout(toastTimer); toastTimer = window.setTimeout(() => (ui.toast = ''), 3200); }

export function newGame(seed?: number) {
  game.value = reactive(core.newCampaign(seed)) as Campaign;
  ui.screen = 'game';
  persist();
}

export function continueGame() {
  const c = loadCampaign();
  if (!c) { newGame(); return; }
  game.value = reactive(c) as Campaign;
  ui.screen = 'game';
  persist();
}

export function toMenu() { ui.screen = 'menu'; canContinue.value = hasSave() && !!game.value && game.value.status !== 'gameover' && game.value.status !== 'victory'; }

export function abandon() { clearSave(); game.value = null; canContinue.value = false; ui.screen = 'menu'; }

/* ------------- действия ------------- */
const g = () => game.value!;

export const act = {
  takeOffer(id: string) { core.takeOffer(g(), id); ui.confirmOffer = null; ui.lastAnswer = ''; ui.lastReaction = null; ui.showReveal = false; sfx('door'); persist(); },
  startInspection() { core.startInspection(g(), Date.now()); persist(); },
  openItem(id: string) { if (core.openItem(g(), id, Date.now())) { sfx('paper'); persist(); } },
  closeCard() { core.closeCard(g(), Date.now()); sfx('paperClose'); persist(); },
  tick() { const before = g().order?.stage; core.tickInspection(g(), Date.now()); if (g().order?.stage !== before) persist(); },
  toDialogue() { core.toDialogue(g()); sfx('click'); persist(); },
  ask(qid: string) { const a = core.ask(g(), qid); if (a) { ui.lastAnswer = a; sfx('speech'); persist(); } },
  continueDialogue() { core.continueDialogue(g()); ui.lastAnswer = ''; if (g().order?.stage === 'diagnosis') sfx('scan'); persist(); },
  toPrice() { core.toPrice(g()); sfx('click'); persist(); },
  propose(m: number) {
    const r = core.propose(g(), m);
    const o = g().order!;
    const text = o.formal ? r.line.formal : r.line.conv;
    ui.lastReaction = { text, tone: o.mood, kind: r.kind };
    sfx(r.kind === 'accept' || r.kind === 'acceptSecond' ? 'ok' : r.kind === 'complaint' ? 'stamp' : 'no');
    persist();
    return r;
  },
  beginAttempt() { core.beginAttempt(g()); persist(); },
  failAttempt() { core.failAttempt(g()); sfx('fail'); persist(); },
  succeedAttempt() { core.succeedAttempt(g()); sfx('success'); persist(); },
  finishOrder() { core.finishOrder(g()); ui.lastReaction = null; ui.showReveal = false; sfx('click'); persist(); },
  tickSound(urgent: boolean) { sfx(urgent ? 'tickUrgent' : 'tick'); },
  move() { core.moveNext(g()); ui.confirmMove = false; sfx('truck'); persist(); },
  workshop() { core.openWorkshop(g()); persist(); },
  markTutorial() { g().tutorialSeen = true; persist(); },
};

// для автотестов и отладки
(window as any).__game = { game, ui, act, core, newGame };
