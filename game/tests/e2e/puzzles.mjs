// Проверка фактических pointer-событий и переходов этапов ремонта.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
await mkdir('/private/tmp/master-puzzles', {recursive:true});
const browser=await chromium.launch({headless:true}); const url=process.argv[2]||'http://127.0.0.1:5179/'; const errors=[];
async function pos(page,i) { return page.evaluate(i=>{const m=window.__testMini||window.__repairMini,b=m.boxes()[i],r=m.cv.getBoundingClientRect();return{x:r.left+(b.x+b.w/2)*r.width/m.w,y:r.top+(b.y+b.h/2)*r.height/m.h}},i); }
async function click(page,i,drag=false){const p=await pos(page,i);if(drag)await page.mouse.move(p.x,p.y,{steps:8});else await page.mouse.click(p.x,p.y);}
async function solve(page){
 const m=await page.evaluate(()=>JSON.parse(JSON.stringify((window.__testMini||window.__repairMini).model)));
 if(['colors','leak','code'].includes(m.type))await click(page,m.answer);
 if(m.type==='pipes')for(let i=0;i<4;i++){let value=m.values[i];while((i===0||i===3)?value%2===0:value!==m.targets[i]){await click(page,i);value=(value+1)%4;}}
 if(['hidden','disassemble','firmware','service'].includes(m.type))for(const i of m.order)await click(page,i);
 if(m.type==='solder'){const p=await pos(page,m.order[0]);await page.mouse.move(p.x,p.y);await page.mouse.down();for(const i of m.order.slice(1))await click(page,i,true);await page.mouse.up();}
 if(m.type==='paste')for(let n=0;n<3;n++)for(let i=0;i<3;i++)await click(page,i);
 if(m.type==='belt')for(let n=0;n<Math.abs(m.values[0]-3);n++)await click(page,m.values[0]>3?1:0);
 if(m.type==='double'){for(let n=0;n<Math.abs(m.values[0]-3);n++)await click(page,m.values[0]<3?1:0);for(let n=0;n<10;n++){const v=await page.evaluate(()=>(window.__testMini||window.__repairMini).model.values[1]);if(v===3)break;await click(page,v<3?3:2);}}
 if(m.type==='symptoms'){await click(page,m.answer);await click(page,m.answer+3);}
 if(m.type==='check')for(let i=0;i<m.labels.length;i++)await click(page,i);
}
for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
 const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
 const types=await page.evaluate(async()=>(await import('/src/minigames/extra-model.ts')).EXTRA_TYPES);
 for(const type of types){
  await page.evaluate(async({type,portrait})=>{window.__testMini?.destroy();document.body.innerHTML='<canvas id="test" width="'+(portrait?600:900)+'" height="'+(portrait?760:560)+'" style="width:100%;height:auto;touch-action:none"></canvas>';const {createMini}=await import('/src/minigames/minigames.ts');window.__testDone=false;window.__testErrors=0;window.__testMini=createMini(type,document.querySelector('#test'),{label:'тест',deviceName:'тест',parts:3,wires:3,hits:2,zone:.3,period:2,screws:3,dirt:2,seed:111,difficulty:2},{onError:()=>window.__testErrors++,onSuccess:()=>window.__testDone=true});},{type,portrait:viewport.width<viewport.height});
  if (['colors','leak','solder','double'].includes(type)) await page.screenshot({path:`/private/tmp/master-puzzles/${viewport.width}-${type}.png`});
  await solve(page);await page.waitForFunction(()=>window.__testDone,{timeout:5000}); const count=await page.evaluate(()=>window.__testErrors);if(count)errors.push(`${type} ${viewport.width}: ${count} ошибок`);
 }
 for(const type of ['swap','wires','calib','clean','diagnose','assemble']) {
  await page.evaluate(async({type,portrait})=>{window.__testMini?.destroy();document.body.innerHTML='<canvas id="test" width="'+(portrait?600:900)+'" height="'+(portrait?760:560)+'" style="width:100%;height:auto;touch-action:none"></canvas>';const {createMini}=await import('/src/minigames/minigames.ts');window.__testDone=false;window.__testErrors=0;window.__testMini=createMini(type,document.querySelector('#test'),{label:'тест',deviceName:'тест',parts:3,wires:3,hits:2,zone:.3,period:2,screws:3,dirt:2,seed:111,difficulty:2},{onError:()=>window.__testErrors++,onSuccess:()=>window.__testDone=true});},{type,portrait:viewport.width<viewport.height});
  const point=async(x,y)=>page.evaluate(({x,y})=>{const m=window.__testMini,r=m.cv.getBoundingClientRect();return{x:r.left+x*r.width/m.w,y:r.top+y*r.height/m.h}},{x,y});
  const at=async(x,y)=>{const q=await point(x,y);await page.mouse.click(q.x,q.y);};
  if(type==='swap') {const d=await page.evaluate(()=>{const m=window.__testMini;return{p:m.parts.find(p=>p.ok),s:m.slot}});const a=await point(d.p.x+100,d.p.y+24),b=await point(d.s.x+d.s.w/2,d.s.y+d.s.h/2);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up();}
  if(type==='wires'){const d=await page.evaluate(()=>{const m=window.__testMini,w=m.wires.find(w=>w.broken);return{lx:m.lx,rx:m.rx,ay:m.ys[w.a],by:m.ys[w.b]}});await at(d.lx,d.ay);await at(d.rx,d.by);}
  if(type==='calib') for(let i=0;i<2;i++){await page.waitForFunction(()=>{const m=window.__testMini;return !m.stopped && Math.abs(m.value()-m.zone)<m.p.zone*.35},null,{timeout:5000});await at(100,100);await page.waitForTimeout(600);}
  if(type==='clean'){const screws=await page.evaluate(()=>window.__testMini.screws.map(({x,y})=>({x,y})));for(const p of screws)await at(p.x,p.y);await page.waitForTimeout(700);const dirt=await page.evaluate(()=>window.__testMini.dirt.map(({x,y})=>({x,y})));for(const d of dirt){const p=await point(d.x,d.y);await page.mouse.move(p.x,p.y);await page.mouse.down();for(let i=0;i<35;i++)await page.mouse.move(p.x+(i%2),p.y);await page.mouse.up();}}
  if(type==='diagnose')for(let i=0;i<3;i++)await click(page,0);
  if(type==='assemble'){const order=await page.evaluate(()=>window.__testMini.order);for(let n=1;n<=4;n++)await click(page,order.indexOf(n));}
  if(type==='clean')await page.screenshot({path:`/private/tmp/master-puzzles/${viewport.width}-${type}.png`});
  await page.waitForFunction(()=>window.__testDone,{timeout:8000});const count=await page.evaluate(()=>window.__testErrors);if(count)errors.push(`${type} ${viewport.width}: ${count} ошибок`);
 }
 await page.close();
}
const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
await page.evaluate(async()=>{const g=window.__game;g.newGame(14);const c=g.game.value;c.tutorialSeen=true;g.act.takeOffer(c.offers.find(o=>o.deviceId==='laptop').id);const o=c.order;o.stage='repair';o.agreedPrice=1000;o.agreedM=1;o.partClass='normal';const {repairChain}=await import('/src/minigames/chains.ts');const {DEVICES}=await import('/src/core/content.ts');for(let n=1;n<1000;n++){o.no=n;const chain=repairChain(DEVICES[o.deviceId].faults[o.faultIdx].type,n*977+o.locIdx*131+o.faultIdx*67,o.deviceId);if(chain[2]==='check' && !['clean','swap','wires','calib'].includes(chain[1]))break;}});
await page.locator('button:has-text("Начать ремонт")').click();for(let stage=0;stage<3;stage++){await page.waitForFunction(i=>document.querySelector('.bench-top')?.textContent.includes(`(${i+1}/3)`),stage);await solve(page);if(stage<2)await page.waitForFunction(i=>document.querySelector('.bench-top')?.textContent.includes(`(${i+2}/3)`),stage,{timeout:5000});}await page.waitForFunction(()=>window.__game.game.value.order.stage==='result',{timeout:5000});await page.close();await browser.close();if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('20 головоломок на двух размерах и цепочка из трёх этапов: успешно');
