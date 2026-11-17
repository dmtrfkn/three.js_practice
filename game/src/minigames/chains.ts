import type { MinigameType } from '../core/content';
import type { MiniType } from './minigames';
import type { AdvancedBType } from './advanced-b';

/** Механические и гидравлические операции привязаны к устройствам, где они уместны. */
const mechanical: Record<string, AdvancedBType[]> = {
  'microwave:wires': ['spring_calibrate'],
  'laptop:clean': ['heat_sink', 'fan_airflow'],
  'washer:clean': ['pump_prime', 'drain_path', 'hose_clamp', 'gasket_seal', 'filter_flow'],
  'washer:calib': ['float_switch'],
  'fridge:calib': ['spring_calibrate'],
  'dishwasher:clean': ['pump_prime', 'drain_path', 'hose_clamp', 'gasket_seal', 'detergent_dose', 'filter_flow'],
  'aircon:clean': ['fan_airflow', 'bearing_fit'],
  'coffee:calib': ['pressure_valve', 'pump_prime', 'hose_clamp', 'gasket_seal'],
  'coffee:clean': ['filter_flow'],
  'tennis:swap': ['bearing_fit', 'gear_mesh', 'shaft_align', 'spring_calibrate'],
  'robovac:clean': ['impeller_balance', 'bearing_fit', 'gear_mesh', 'fan_airflow'],
  'printer:swap': ['gear_mesh', 'shaft_align', 'spring_calibrate'],
  'projector:clean': ['heat_sink', 'fan_airflow', 'impeller_balance'],
};

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
  fixes.push(...(mechanical[`${deviceId}:${type}`] ?? []));
  if(type==='swap' && deviceId!=='tennis') fixes.push('colors','solder');
  if (type==='swap' && deviceId==='tennis') fixes.push('belt');
  if (type==='clean' && deviceId==='laptop') fixes.push('paste');
  if ((deviceId==='speaker' && type==='wires') || (deviceId==='vr' && type==='calib') || (deviceId==='robovac' && type==='calib') || (deviceId==='printer' && type==='wires')) fixes.push('firmware');
  const final: MiniType[] = ['assemble','check'];
  return [diagnostic[mix(71)%diagnostic.length], fixes[mix(149)%fixes.length], final[mix(211)%final.length]];
}
