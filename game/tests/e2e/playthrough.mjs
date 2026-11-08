// Сквозной прогон одного заказа через интерфейс с фиксацией скриншотов каждого этапа.
// node tests/e2e/playthrough.mjs <url> <outDir> [m=1.0] [seed]
import { chromium } from 'playwright';
const [,, url = 'http://localhost:5199/', out = '.', mArg = '1.0', seedArg = ''] = process.argv;
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1366, height: 800 } });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
const shot = async (n) => { await p.waitForTimeout(600); await p.screenshot({ path: `${out}/${n}.png` }); };
await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload();
await p.waitForSelector('text=Новая игра'); await shot('01_menu');
if (seedArg) await p.evaluate((s) => window.__game.newGame(+s), seedArg); else await p.click('text=Новая игра');
await p.waitForSelector('text=Первый день'); await shot('02_tutorial');
await p.click('text=Понятно'); await shot('03_board');
await p.locator('article.order').nth(2).click(); await shot('04_confirm');
await p.click('button:has-text("Поехать")');
await p.waitForFunction(() => window.__game.game.value?.order?.inspectEndsAt != null, null, { timeout: 20000 });
await p.waitForTimeout(1500); await shot('05_inspect');
const ids = await p.evaluate(() => window.__game.game.value.order.items.map((i) => i.id));
for (const id of ids.slice(0, 2)) {
  const pos = await p.evaluate((i) => window.__scene.screenPos(i), id);
  if (pos) { await p.mouse.move(pos.x, pos.y); await p.waitForTimeout(150); await p.mouse.down(); await p.mouse.up(); }
  await p.waitForTimeout(400);
  if (id === ids[0]) await shot('06_card');
  await p.keyboard.press('Escape');
}
const cpos = await p.evaluate(() => window.__scene.screenPos('__client'));
await p.mouse.click(cpos.x, cpos.y);
await p.waitForTimeout(800); await shot('07_dialog');
for (let k = 0; k < 2; k++) { await p.locator('.qs button').first().click(); await p.waitForTimeout(300); if (k === 0) await shot('08_answer'); await p.click('button:has-text("Продолжить")'); }
await p.waitForTimeout(1800); await shot('09_diagnosis');
await p.click('button:has-text("Назначить цену")'); await p.waitForTimeout(500);
await p.evaluate((m) => { const i = document.querySelector('.tape input'); i.value = m; i.dispatchEvent(new Event('input', { bubbles: true })); }, mArg);
await shot('10_price');
await p.click('button:has-text("Предложить цену")'); await p.waitForTimeout(800);
let st = await p.evaluate(() => window.__game.game.value.order?.stage);
if (st === 'price') { await shot('11_refusal'); await p.evaluate(() => { const i = document.querySelector('.tape input'); i.value = '1'; i.dispatchEvent(new Event('input', { bubbles: true })); }); await p.click('button:has-text("Предложить цену")'); await p.waitForTimeout(800); st = await p.evaluate(() => window.__game.game.value.order?.stage); }
if (st === 'repair') {
  await shot('12_repair_intro');
  await p.click('.intro .btn'); await p.waitForTimeout(1200); await shot('13_minigame');
  await p.evaluate(() => window.__game.act.succeedAttempt());
  await p.waitForTimeout(2500); await shot('14_result');
} else { await shot('14_result'); }
await p.click('button:has-text("К заявкам"), button:has-text("Чем всё")'); await p.waitForTimeout(600); await shot('15_board_after');
console.log(errs.slice(0, 20).join('\n') || 'no errors');
await b.close();
