// Проверка реальных pointer-событий на каждом этапе новых заданий.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const url = process.argv[2] || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ headless: true });
const errors = [];
await mkdir('/private/tmp/master-advanced', { recursive: true });

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  const types = await page.evaluate(async () => (await import('/src/minigames/advanced-b.ts')).ADVANCED_B_TYPES);
  for (const type of types) {
    await page.evaluate(async ({ type, portrait }) => {
      window.__testMini?.destroy();
      document.body.innerHTML = `<canvas id="test" width="${portrait ? 600 : 900}" height="${portrait ? 760 : 560}" style="width:100%;height:auto;touch-action:none"></canvas>`;
      const { createMini } = await import('/src/minigames/minigames.ts');
      window.__testDone = false; window.__testErrors = 0;
      window.__testMini = createMini(type, document.querySelector('#test'), { label: 'тест', deviceName: 'тест', parts: 3, wires: 3, hits: 2, zone: .3, period: 2, screws: 3, dirt: 2, seed: 111, difficulty: 2 }, { onError: () => window.__testErrors++, onSuccess: () => window.__testDone = true });
    }, { type, portrait: viewport.width < viewport.height });
    if (['pump_prime', 'shaft_align', 'impeller_balance'].includes(type)) {
      await page.waitForTimeout(100);
      await page.screenshot({ path: `/private/tmp/master-advanced/${viewport.width}-${type}.png` });
    }
    for (let guard = 0; guard < 140; guard++) {
      const next = await page.evaluate(() => {
        const mini = window.__testMini, state = mini.model;
        if (state.done) return null;
        const task = state.tasks[state.stage]; let index = -1;
        if (task.kind === 'choice') index = task.choices.findIndex(c => c.correct);
        if (task.kind === 'inspection') { const unseen = task.visited.indexOf(false); index = unseen >= 0 ? unseen : task.probes.length + task.choices.findIndex(c => c.correct); }
        if (task.kind === 'gauge') index = task.value < task.low ? 1 : task.value > task.high ? 0 : 2;
        if (task.kind === 'sequence') index = task.next[task.position];
        if (task.kind === 'coupled') index = task.values[0] < task.targets[0] ? 1 : task.values[0] > task.targets[0] ? 0 : task.values[1] < task.targets[1] ? 3 : task.values[1] > task.targets[1] ? 2 : 4;
        if (task.kind === 'valves') { const i = task.values.findIndex((v, k) => v !== task.targets[k]); index = i < 0 ? task.values.length : i; }
        if (task.kind === 'allocation') { const i = task.values.findIndex((v, k) => v < task.targets[k]); index = i < 0 ? 6 : i; }
        if (task.kind === 'transfer') {
          const [a, b] = task.values;
          index = a === 4 || b === 4 ? 6 : a === 0 ? 0 : b === 3 ? 5 : 2;
        }
        const box = mini.boxes()[index]; if (!box) throw new Error(`No action ${index} for ${state.type} / ${task.kind}`);
        const rect = mini.cv.getBoundingClientRect();
        return { x: rect.left + (box.x + box.w / 2) * rect.width / mini.w, y: rect.top + (box.y + box.h / 2) * rect.height / mini.h };
      });
      if (!next) break;
      await page.mouse.click(next.x, next.y);
    }
    await page.waitForFunction(() => window.__testDone, null, { timeout: 5000 }).catch(() => errors.push(`${type} ${viewport.width}: задание не завершилось`));
    const count = await page.evaluate(() => window.__testErrors);
    if (count) errors.push(`${type} ${viewport.width}: ${count} ошибок`);
  }
  await page.close();
}
await browser.close();
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('15 многошаговых заданий на двух размерах: успешно');
