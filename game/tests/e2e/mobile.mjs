// Проверка адаптива: iPhone в портрете и ландшафте, сенсорный ввод.
// Примечание: page.tap() в текущей сборке Playwright роняет headless-браузер на macOS, поэтому
// используется клик мышью в контексте с hasTouch/isMobile (pointer: coarse и мобильная вёрстка сохраняются).
import { chromium, devices } from 'playwright';
const [,, url = 'http://localhost:5199/', out = '.'] = process.argv;
const b = await chromium.launch({ args: ['--use-angle=metal'] });
const errs = [];
for (const [tag, vp] of [['p', { width: 390, height: 844 }], ['l', { width: 844, height: 390 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(tag + ' ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(tag + ' ' + m.text()); });
  const shot = async (n, w = 700) => { await p.waitForTimeout(w); await p.screenshot({ path: `${out}/m${tag}_${n}.png` }); };
  await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.waitForSelector('text=Новая игра'); await shot('01_menu');
  await p.click('text=Новая игра'); await p.waitForSelector('text=Пропустить обучение'); await p.click('text=Пропустить обучение'); await shot('02_board');
  await p.locator('article.order').nth(2).click(); await p.click('button:has-text("Поехать")');
  await p.waitForFunction(() => window.__game.game.value?.order?.inspectEndsAt != null); await shot('03_inspect', 1500);
  // тап по видимому предмету
  const ids = await p.evaluate(() => window.__game.game.value.order.items.map((i) => i.id));
  let opened = false;
  for (const id of ids) { const pos = await p.evaluate((i) => window.__scene.screenPos(i), id); if (pos && pos.x > 20 && pos.x < vp.width - 20 && pos.y > 60 && pos.y < vp.height - 60) { await p.mouse.click(pos.x, pos.y); await p.waitForTimeout(400); opened = await p.evaluate(() => !!window.__game.game.value.order.openCard); if (opened) break; } }
  if (!opened) errs.push(tag + ': tap did not open any item');
  await shot('04_card', 300);
  await p.click('button:has-text("Закрыть")');
  await p.click('.actions .btn'); await shot('05_dialog');
  await p.locator('.qs button').first().click(); await shot('06_answer', 400); await p.click('button:has-text("Продолжить")');
  await p.locator('.qs button').first().click(); await p.click('button:has-text("Продолжить")');
  await shot('07_diag', 1800); await p.click('button:has-text("Назначить цену")'); await shot('08_price');
  await p.click('button:has-text("Предложить цену")'); await p.waitForTimeout(500);
  if (await p.evaluate(() => window.__game.game.value.order.stage) === 'repair') {
    await shot('09_repair'); await p.click('.intro .btn'); await shot('10_mini', 1200);
    await p.evaluate(() => window.__game.act.succeedAttempt()); await shot('11_result', 2500);
  }
  await p.evaluate(() => { const G = window.__game; const c = G.game.value; if (c.order) G.act.finishOrder(); c.money = 9000; G.act.takeOffer(c.offers.find((o) => !o.taken).id); const A = G.act; A.toDialogue(); A.ask('base_knowledge'); A.continueDialogue(); A.ask('base_urgency'); A.continueDialogue(); A.toPrice(); A.propose(1.6); });
  await p.waitForTimeout(400);
  if (await p.evaluate(() => window.__game.game.value.order?.stage) === 'price') await shot('12_refusal');
  await p.evaluate(() => { const G = window.__game; const c = G.game.value; const o = c.order; if (o && o.stage === 'price') G.act.propose(0.75); if (c.order?.stage === 'repair') { G.act.beginAttempt(); G.act.succeedAttempt(); } G.act.finishOrder(); c.callsUsed = 3; c.money = 9000; c.status = 'mustMove'; });
  await shot('13_move');
  await p.evaluate(() => { const G = window.__game; const c = G.game.value; c.status = 'gameover'; c.ending = 'arrest'; });
  await shot('14_end');
  await ctx.close();
}
console.log(errs.join('\n') || 'no errors');
await b.close();
