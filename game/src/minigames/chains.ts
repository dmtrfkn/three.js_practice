import type { MinigameType } from '../core/content';
import type { MiniType } from './minigames';

/** Одни и те же заказ и неисправность дают одинаковые этапы при повторах. */
export function repairChain(type: MinigameType, seed: number, deviceId = ''): [MiniType, MiniType, MiniType] {
  const mix = (n: number) => { let x=(seed ^ n) >>> 0; x=Math.imul(x ^ (x >>> 16),0x7feb352d); x=Math.imul(x ^ (x >>> 15),0x846ca68b); return (x ^ (x >>> 16)) >>> 0; };
  const diagnostic: MiniType[] = ['diagnose','symptoms','disassemble','hidden'];
  if (['washer','dishwasher','coffee'].includes(deviceId)) diagnostic.push('leak');
  if (['microwave','washer','fridge','speaker','dishwasher','aircon','vr','coffee','robovac','printer','projector'].includes(deviceId)) diagnostic.push('code');
  if (['speaker','vr','robovac','printer'].includes(deviceId)) diagnostic.push('service');
  const repairs: Record<MinigameType, MiniType[]> = {
    swap: ['swap'], wires: ['wires','pipes','solder'], calib: ['calib','double'], clean: ['clean'],
  };
  const fixes = [...repairs[type]];
  if(type==='swap' && deviceId!=='tennis') fixes.push('colors','solder');
  if (type==='swap' && deviceId==='tennis') fixes.push('belt');
  if (type==='clean' && deviceId==='laptop') fixes.push('paste');
  if ((deviceId==='speaker' && type==='wires') || (deviceId==='vr' && type==='calib') || (deviceId==='robovac' && type==='calib') || (deviceId==='printer' && type==='wires')) fixes.push('firmware');
  const final: MiniType[] = ['assemble','check'];
  return [diagnostic[mix(71)%diagnostic.length], fixes[mix(149)%fixes.length], final[mix(211)%final.length]];
}
