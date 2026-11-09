// Промо-скриншоты для itch.io и README. Нужен запущенный dev-сервер игры.
// node tools/promo.mjs http://localhost:5199/ promo/screens
import { chromium } from 'playwright';
const [,, url, out] = process.argv;
const b = await chromium.launch({ args: ['--use-angle=metal'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const shot = async (n, w = 900) => { await p.waitForTimeout(w); await p.screenshot({ path: `${out}/${n}.png` }); };
const G = (fn, arg) => p.evaluate(fn, arg);
await p.goto(url); await G(() => localStorage.clear()); await p.reload(); await p.waitForSelector('text=Новая игра');
await shot('01_menu', 1200);
await G(() => { window.__game.newGame(31); window.__game.game.value.tutorialSeen = true; });
await shot('02_board');
// хелпер: перейти в локацию и взять заказ
const order = async (loc, idx, preset, mutate) => {
  await G(([loc, idx, preset, mutate]) => {
    const g = window.__game; const c = g.game.value;
    if (c.order) { c.order = null; c.status = 'board'; }
    while (c.locIdx < loc) { c.money = 1e6; g.core.moveNext(c); }
    c.status = 'board'; c.callsUsed = 0; c.money = [3500, 21000, 30000, 61000, 120000][loc]; c.rep = 4; c.violations = 0; c.tutorialSeen = true;
    c.offers.forEach((o) => (o.taken = false));
    g.act.takeOffer(c.offers[idx].id);
    const o = c.order; o.presetIdx = preset; if (mutate) new Function('o', mutate)(o);
    c.order = { ...o, offerId: o.offerId + '-p' + Math.random() };
  }, [loc, idx, preset, mutate]);
  await p.waitForFunction(() => window.__game.game.value.order?.inspectEndsAt != null);
  await p.waitForTimeout(1500);
};
const visibleItem = async () => G(() => { const o = window.__game.game.value.order; for (const it of o.items) { const s = window.__scene.screenPos(it.id); if (s && s.x > 200 && s.x < 1080 && s.y > 150 && s.y < 600) return it.id; } return o.items[1].id; });
// хрущёвка: осмотр с карточкой
await order(1, 2, 1, "o.mood = 1;");
await G(() => window.__scene.setCamera(8, -6)); await p.waitForTimeout(600);
const id1 = await visibleItem(); await G((id) => window.__game.act.openItem(id), id1);
await shot('03_khr_inspect_card');
// общежитие: осмотр
await order(0, 1, 0, "o.mood = 2;"); await G(() => window.__scene.setCamera(-10, -5)); await shot('04_dorm_inspect', 1200);
// новостройка: разговор
await order(2, 2, 1, "o.formal = true;");
await G(() => { const A = window.__game.act; A.toDialogue(); A.ask('base_knowledge'); A.continueDialogue(); A.ask('base_urgency'); }); await shot('05_new_dialog', 1400);
// элитный ЖК: отказ на цену
await order(3, 4, 0, "o.client.knowledge = 2; o.client.budget = 1; o.role = 'regular'; o.mood = 1;");
await G(() => { const A = window.__game.act; const c = window.__game.game.value; A.toDialogue(); A.ask('base_knowledge'); A.continueDialogue(); A.ask('base_urgency'); A.continueDialogue(); A.toPrice(); c.rng.s = 11; });
await p.waitForTimeout(500);
await G(() => { const i = document.querySelector('.tape input'); i.value = '1.75'; i.dispatchEvent(new Event('input', { bubbles: true })); });
await p.click('button:has-text("Предложить цену")'); await shot('06_elite_refusal', 1400);
// офис: протокол инспектора
await order(4, 2, 1, "o.role = 'inspector'; o.formal = true;");
await G(() => { const A = window.__game.act; A.toDialogue(); A.ask('base_knowledge'); A.continueDialogue(); A.ask('base_urgency'); A.continueDialogue(); A.toPrice(); A.propose(1.55); A.beginAttempt(); A.succeedAttempt(); });
await shot('07_office_protocol', 3000);
// миниигра: прозвонка в общежитии
await order(0, 3, 1, "o.deviceId = 'microwave'; o.faultIdx = 0;");
await G(() => { const A = window.__game.act; A.toDialogue(); A.ask('base_knowledge'); A.continueDialogue(); A.ask('base_urgency'); A.continueDialogue(); A.toPrice(); A.propose(1.0); });
await p.waitForTimeout(600); await p.click('.intro .btn'); await shot('08_minigame', 1400);
// элитный ЖК: общий вид
await order(3, 1, 1, ""); await G(() => window.__scene.setCamera(18, -3)); await shot('09_elite_room', 1400);
console.log(errs.join('\n') || 'no errors'); await b.close();
