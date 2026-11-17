import { describe, it, expect } from 'vitest';
import { ADVANCED_A_IDS, makeAdvancedA, actAdvancedA } from '../../src/minigames/advanced-a';
describe('многошаговая электротехника',()=>{
 it('15 задач решаемы и переживают ошибку',()=>{expect(ADVANCED_A_IDS).toHaveLength(15); for(const id of ADVANCED_A_IDS) for(const seed of [1,2,3]){const s=makeAdvancedA(id,seed);if(id==='voltage_drop'){const wrong=(s.fault!+1)%3;expect(actAdvancedA(s,wrong)).toBe('ok');expect(actAdvancedA(s,3+wrong)).toBe('error');expect(actAdvancedA(s,s.fault!)).toBe('ok');expect(actAdvancedA(s,3+s.fault!)).toBe('ok');expect(actAdvancedA(s,0)).toBe('done');continue;}if(['diode_bridge','capacitor_esr','transistor_bias','relay_contacts','voltage_divider','thermistor_curve','opamp_clip','logic_probe','i2c_bus','crystal_clock','led_driver'].includes(id))continue;const wrong=(s.correct+1)%s.actions.length;expect(actAdvancedA(s,wrong)).toBe('error');expect(s.step).toBe(0);let steps=0;while(!s.done){actAdvancedA(s,s.correct);steps++;}expect(steps).toBeGreaterThanOrEqual(3);expect(s.errors).toBe(1);}});
});

it('интерактивные измерения, безопасность и регулировка решаемы',()=>{
 for(let seed=1;seed<=8;seed++){
  const d=makeAdvancedA('diode_bridge',seed); expect(actAdvancedA(d,1)).toBe('error'); actAdvancedA(d,0);actAdvancedA(d,1);actAdvancedA(d,2);actAdvancedA(d,d.fault!);actAdvancedA(d,4+d.fault!);actAdvancedA(d,0);expect(actAdvancedA(d,1)).toBe('error');actAdvancedA(d,0);expect(actAdvancedA(d,1)).toBe('done');
  const c=makeAdvancedA('capacitor_esr',seed);actAdvancedA(c,0);actAdvancedA(c,1);actAdvancedA(c,2);actAdvancedA(c,0);actAdvancedA(c,1);actAdvancedA(c,2);expect(actAdvancedA(c,1)).toBe('error');actAdvancedA(c,0);actAdvancedA(c,0);actAdvancedA(c,1);expect(actAdvancedA(c,2)).toBe('done');
  const t=makeAdvancedA('transistor_bias',seed) as any;expect(actAdvancedA(t,3)).toBe('error');while(t.value!==3)actAdvancedA(t,t.value<3?2:1);actAdvancedA(t,0);actAdvancedA(t,3);actAdvancedA(t,0);actAdvancedA(t,1);expect(actAdvancedA(t,2)).toBe('done');
 }
});

it('реле, делитель, термодатчик и усилитель требуют измерений и настройки',()=>{
 for(let seed=1;seed<=8;seed++){
  const r=makeAdvancedA('relay_contacts',seed);expect(actAdvancedA(r,3)).toBe('info');actAdvancedA(r,1);actAdvancedA(r,2);expect(actAdvancedA(r,r.fault?4:3)).toBe('error');actAdvancedA(r,r.fault?3:4);actAdvancedA(r,0);actAdvancedA(r,1);expect(actAdvancedA(r,2)).toBe('done');
  const d=makeAdvancedA('voltage_divider',seed) as any;actAdvancedA(d,0);actAdvancedA(d,d.fault?2:1);actAdvancedA(d,d.fault?4:3);while(d.value!==2)actAdvancedA(d,d.value<2?1:0);actAdvancedA(d,2);expect(actAdvancedA(d,3)).toBe('done');
  const t=makeAdvancedA('thermistor_curve',seed);actAdvancedA(t,0);actAdvancedA(t,2);actAdvancedA(t,1);actAdvancedA(t,2);actAdvancedA(t,t.fault?3:4);actAdvancedA(t,0);actAdvancedA(t,1);expect(actAdvancedA(t,2)).toBe('done');
  const a=makeAdvancedA('opamp_clip',seed) as any;actAdvancedA(a,0);actAdvancedA(a,1);while(a.value!==3)actAdvancedA(a,a.value>3?2:3);actAdvancedA(a,4);actAdvancedA(a,0);actAdvancedA(a,1);expect(actAdvancedA(a,2)).toBe('done');
 }
});

it('логика, шина, генератор и подсветка проходят диагностику и проверку',()=>{
 for(let seed=1;seed<=8;seed++){
  const l=makeAdvancedA('logic_probe',seed);actAdvancedA(l,0);actAdvancedA(l,1);actAdvancedA(l,2);actAdvancedA(l,3);expect(actAdvancedA(l,l.fault?5:4)).toBe('error');actAdvancedA(l,l.fault?4:5);actAdvancedA(l,0);actAdvancedA(l,1);expect(actAdvancedA(l,2)).toBe('done');
  const b=makeAdvancedA('i2c_bus',seed);actAdvancedA(b,0);actAdvancedA(b,1+b.fault!);actAdvancedA(b,3);actAdvancedA(b,4+b.fault!);actAdvancedA(b,0);actAdvancedA(b,1);expect(actAdvancedA(b,2)).toBe('done');
  const c=makeAdvancedA('crystal_clock',seed) as any;actAdvancedA(c,0);actAdvancedA(c,1);actAdvancedA(c,2);actAdvancedA(c,3);while(c.value!==3)actAdvancedA(c,c.value>3?0:1);actAdvancedA(c,2);actAdvancedA(c,3);actAdvancedA(c,0);actAdvancedA(c,1);expect(actAdvancedA(c,2)).toBe('done');
  const d=makeAdvancedA('led_driver',seed);expect(actAdvancedA(d,2)).toBe('error');actAdvancedA(d,0);actAdvancedA(d,2);actAdvancedA(d,3);actAdvancedA(d,4+d.fault!);actAdvancedA(d,0);actAdvancedA(d,1);expect(actAdvancedA(d,2)).toBe('done');
 }
});
