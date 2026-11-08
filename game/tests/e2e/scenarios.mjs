// Сценарии: инспектор с нарушением, отказ клиента, переезд, финал. Используют отладочный доступ window.__game.
import { chromium } from 'playwright';
const [,, url = 'http://localhost:5199/', out = '.'] = process.argv;
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1366, height: 800 } });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
const shot = async (n, w = 700) => { await p.waitForTimeout(w); await p.screenshot({ path: `${out}/${n}.png` }); };
await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload();
await p.waitForSelector('text=Новая игра');
await p.evaluate(() => { window.__game.newGame(4242); window.__game.game.value.tutorialSeen = true; });
// 1) инспектор
await p.evaluate(() => { const G = window.__game; const c = G.game.value; c.callIndex = 3; G.act.takeOffer(c.offers[4].id); const o = c.order; o.role = 'inspector'; o.formal = true; });
await p.waitForFunction(() => window.__game.game.value.order.inspectEndsAt != null);
await p.waitForTimeout(800);
// открыть видимый предмет
const ids = await p.evaluate(() => window.__game.game.value.order.items.map((i) => i.id));
for (const id of ids) { const pos = await p.evaluate((i) => window.__scene.screenPos(i), id); if (pos && pos.x > 60 && pos.x < 1300 && pos.y > 80 && pos.y < 760) { await p.mouse.move(pos.x, pos.y); await p.waitForTimeout(200); await shot('s1_hover', 100); await p.mouse.down(); await p.mouse.up(); break; } }
await shot('s1_card', 500);
await p.keyboard.press('Escape');
await p.evaluate(() => { const A = window.__game.act; A.toDialogue(); });
await p.evaluate(() => { const A = window.__game.act; const o = window.__game.game.value.order; A.ask('base_knowledge'); A.continueDialogue(); A.ask('base_urgency'); A.continueDialogue(); A.toPrice(); A.propose(1.6); A.beginAttempt(); A.succeedAttempt(); });
await shot('s2_protocol', 2600);
await p.click('button:has-text("К заявкам")');
await shot('s3_board_after_violation');
// 2) отказ и уход
await p.evaluate(() => { const G = window.__game; const c = G.game.value; G.act.takeOffer(c.offers.find((o) => !o.taken).id); const o = c.order; o.role = 'regular'; o.client.budget = 0; o.client.knowledge = 2; o.client.scandal = false; });
await p.waitForFunction(() => window.__game.game.value.order?.inspectEndsAt != null);
await p.evaluate(() => { const A = window.__game.act; A.toDialogue(); A.ask('base_knowledge'); A.continueDialogue(); A.ask('base_urgency'); A.continueDialogue(); A.toPrice(); });
await p.waitForTimeout(500);
await p.evaluate(() => { const g = window.__game.game.value; g.rng.s = 7; }); // фиксируем броски
await p.evaluate(() => { const i = document.querySelector('.tape input'); i.value = '1.9'; i.dispatchEvent(new Event('input', { bubbles: true })); });
await p.click('button:has-text("Предложить цену")');
await shot('s4_refusal');
await p.evaluate(() => { const i = document.querySelector('.tape input'); i.value = '1.5'; i.dispatchEvent(new Event('input', { bubbles: true })); });
await p.click('button:has-text("Предложить цену")');
await shot('s5_left', 1500);
await p.click('button:has-text("К заявкам")');
// 3) экран переезда: третий вызов с деньгами
await p.evaluate(() => { const G = window.__game; const c = G.game.value; c.money = 12000; G.act.takeOffer(c.offers.find((o) => !o.taken).id); const A = G.act; A.toDialogue(); A.ask('base_knowledge'); A.continueDialogue(); A.ask('base_urgency'); A.continueDialogue(); A.toPrice(); A.propose(1.0); A.beginAttempt(); A.succeedAttempt(); A.finishOrder(); });
await shot('s6_move');
await p.click('button:has-text("Переехать")');
await shot('s7_board_khr');
// 4) комнаты всех локаций (осмотр)
for (const li of [1, 2, 3, 4]) {
  await p.evaluate((li) => { const G = window.__game; const c = G.game.value; while (c.locIdx < li) { c.money = 1e6; G.core.moveNext(c); } c.money = 0; c.callsUsed = 0; c.violations = 0; G.act.takeOffer(c.offers[2].id); }, li);
  await p.waitForFunction(() => window.__game.game.value.order?.inspectEndsAt != null);
  await shot('s8_loc' + li, 1500);
  await p.evaluate(() => { const A = window.__game.act; A.toDialogue(); A.ask('base_knowledge'); A.continueDialogue(); A.ask('base_urgency'); A.continueDialogue(); A.toPrice(); A.propose(1.0); A.beginAttempt(); A.succeedAttempt(); A.finishOrder(); });
}
// 5) финал
await p.evaluate(() => { const G = window.__game; const c = G.game.value; c.money = 160000; c.rep = 12; c.status = 'board'; G.act.workshop(); });
await shot('s9_victory', 1000);
console.log(errs.slice(0, 20).join('\n') || 'no errors');
await b.close();
