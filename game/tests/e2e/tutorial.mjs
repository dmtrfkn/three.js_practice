// Прогон обучения на первом заказе: node tests/e2e/tutorial.mjs <url> <out> [mobile]
import { chromium, devices } from 'playwright';
const [,, url = 'http://localhost:5199/', out = '.', mode = 'desktop'] = process.argv;
const mob = mode === 'mobile';
const b = await chromium.launch({ args: ['--use-angle=metal'] });
const ctx = await b.newContext(mob ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent } : { viewport: { width: 1366, height: 800 } });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
let n = 0;
const shot = async (name, w = 600) => { await p.waitForTimeout(w); await p.screenshot({ path: `${out}/${mode}_${String(++n).padStart(2, '0')}_${name}.png` }); };
const title = () => p.locator('.tut h4').textContent().catch(() => null);
const nextBtn = async () => { await p.locator('.tut .btn').click(); await p.waitForTimeout(300); };
await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload();
await p.click('text=Новая игра'); await p.waitForSelector('.tut');
for (let i = 0; i < 5; i++) { await shot('board_' + (await title())); await nextBtn(); }
await shot('board_' + (await title()));
await p.locator('article.order').nth(2).click(); await p.click('button:has-text("Поехать")');
await p.waitForFunction(() => window.__game.game.value?.order?.stage === 'inspect'); await p.waitForTimeout(1500);
await shot('inspect_' + (await title())); await nextBtn();
await shot('inspect_' + (await title())); await nextBtn();
await shot('inspect_' + (await title()), 900);
const rid = await p.evaluate(() => window.__game.game.value.order.items.find((i) => i.kind === 'reliable').id);
const pos = await p.evaluate((i) => window.__scene.screenPos(i), rid);
await p.mouse.move(pos.x, pos.y); await p.waitForTimeout(150); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(500);
await shot('inspect_' + (await title()));
await p.click('button:has-text("Закрыть")');
await shot('inspect_' + (await title())); await nextBtn();
await shot('inspect_' + (await title()), 900); await nextBtn();
await shot('inspect_' + (await title()));
await p.click('.actions .btn'); await p.waitForTimeout(900);
await shot('dialog_' + (await title())); await nextBtn();
await shot('dialog_' + (await title()));
await p.locator('.qs button').first().click(); await p.waitForTimeout(500);
await shot('dialog_' + (await title())); await nextBtn();
await p.click('button:has-text("Продолжить")'); await p.locator('.qs button').first().click(); await p.click('button:has-text("Продолжить")');
await p.waitForTimeout(1900); await shot('diag_' + (await title()));
await p.click('button:has-text("Назначить цену")'); await p.waitForTimeout(600);
for (let i = 0; i < 4; i++) { await shot('price_' + (await title())); await nextBtn(); }
await p.evaluate(() => { const i = document.querySelector('.tape input'); i.value = '1.3'; i.dispatchEvent(new Event('input', { bubbles: true })); });
await shot('price_' + (await title()));
await p.click('.price .btn'); await p.waitForTimeout(700);
if (await p.evaluate(() => window.__game.game.value.order.stage) === 'price') { await shot('price_' + (await title())); await nextBtn(); await p.evaluate(() => { const i = document.querySelector('.tape input'); i.value = '1'; i.dispatchEvent(new Event('input', { bubbles: true })); }); await p.click('.price .btn'); await p.waitForTimeout(700); }
if (await p.evaluate(() => window.__game.game.value.order.stage) === 'repair') {
  await shot('repair_' + (await title())); await p.click('.intro .btn'); await p.waitForTimeout(1000);
  await shot('repair_' + (await title())); await nextBtn();
  await p.evaluate(() => window.__game.act.succeedAttempt());
}
await shot('result_' + (await title()), 2500); await nextBtn();
await shot('result_' + (await title()));
await p.locator('.cont .btn, .gone .btn').first().click(); await p.waitForTimeout(600);
await shot('done_' + (await title())); await nextBtn();
const st = await p.evaluate(() => ({ seen: window.__game.game.value.tutorialSeen, coach: !!document.querySelector('.tut') }));
console.log(JSON.stringify(st), errs.join('\n') || 'no errors'); await b.close();
