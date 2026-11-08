import { chromium } from 'playwright';
// usage: node tools/shots.mjs outDir url1 name1 url2 name2 ...
const [,, out, ...rest] = process.argv;
const b = await chromium.launch({ args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport:{ width:1280, height:720 } });
const errs = [];
p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('pageerror: '+e.message));
for (let i=0;i<rest.length;i+=2){
  await p.goto(rest[i], { waitUntil:'load' });
  await p.waitForFunction(() => (window).__ready === true, null, { timeout: 30000 }).catch(()=>errs.push('timeout '+rest[i]));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/${rest[i+1]}.png` });
}
console.log(errs.slice(0,20).join('\n') || 'no errors');
await b.close();
