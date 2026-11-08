import '@fontsource/nunito/400.css'; import '@fontsource/nunito/600.css'; import '@fontsource/nunito/700.css'; import '@fontsource/nunito/800.css'; import '@fontsource/nunito/900.css'; import '@fontsource/neucha/400.css'; import '@fontsource/pt-mono/400.css';
import { RoomScene } from './scene/RoomScene';
import { newCampaign, takeOffer, moveNext } from './core/campaign';
const q = new URLSearchParams(location.search);
await Promise.all([document.fonts.load('800 20px Nunito'), document.fonts.load('700 20px Nunito'), document.fonts.load('900 20px Nunito'), document.fonts.load('20px Neucha'), document.fonts.load('20px "PT Mono"')]).catch(() => {});
const c = newCampaign(+(q.get('seed') ?? 3));
const loc = +(q.get('loc') ?? 0);
for (let i = 0; i < loc; i++) { c.money = 1e6; moveNext(c); }
const pick = q.get('offer') ? +q.get('offer')! : 0;
const o = takeOffer(c, c.offers[pick].id);
if (q.get('preset')) o.presetIdx = +q.get('preset')! as 0 | 1;
if (q.get('items')) { const ids = q.get('items')!.split(','); o.items = ids.map((id, i) => ({ id, kind: 'neutral', slot: i as 0, formalVariant: 0 })); }
if (q.get('device')) o.deviceId = q.get('device')!;
const s = new RoomScene(document.getElementById('c') as HTMLCanvasElement);
s.build(o);
s.setCamera(+(q.get('yaw') ?? 0), +(q.get('pitch') ?? -4));
(window as any).__ready = true;
