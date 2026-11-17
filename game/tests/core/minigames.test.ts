import { describe, expect, it } from 'vitest';
import { EXTRA_TYPES, makeExtra, actExtra, type ExtraModel } from '../../src/minigames/extra-model';
import { repairChain } from '../../src/minigames/chains';
import type { MinigameType } from '../../src/core/content';

function solve(m: ExtraModel) {
  switch (m.type) {
    case 'colors': case 'leak': case 'code': actExtra(m,m.answer); break;
    case 'pipes': m.values.forEach((_,i)=>{while(!m.done && ((i===0||i===3)?m.values[i]%2===0:m.values[i]!==m.targets[i])) actExtra(m,i);}); break;
    case 'hidden': m.order.forEach(i=>actExtra(m,i)); break;
    case 'solder': case 'disassemble': case 'firmware': case 'service': m.order.forEach(i=>actExtra(m,i)); break;
    case 'paste': for(let j=0;j<3;j++) for(let i=0;i<3;i++) actExtra(m,i); break;
    case 'belt': while(!m.done) actExtra(m,m.values[0]>3?1:0); break;
    case 'double': while(m.values[0]!==3) actExtra(m,m.values[0]<3?1:0); while(!m.done) actExtra(m,m.values[1]<3?3:2); break;
    case 'symptoms': actExtra(m,m.answer+3); break;
    case 'check': m.labels.forEach((_,i)=>actExtra(m,i)); break;
  }
}

describe('ремонтные головоломки', () => {
  it('каждый тип решаем в разных вариантах и регионах', () => {
    for(const type of EXTRA_TYPES) for(let seed=1; seed<=30; seed++) {const m=makeExtra(type,seed,seed%5); solve(m); expect(m.done,`${type}, seed ${seed}`).toBe(true);}
  });
  it('неправильный ответ считается ошибкой', () => {
    for(const type of ['colors','leak','code'] as const) {const m=makeExtra(type,42); expect(actExtra(m,(m.answer+1)%m.labels.length)).toBe('error'); expect(m.done).toBe(false);}
  });
  it('все типы встречаются в цепочках заказов', () => {
    const types=new Set<string>(); for(let seed=1;seed<300;seed++) for(const fault of ['swap','wires','calib','clean'] as MinigameType[]) for(const device of ['kettle','washer','speaker','tennis','laptop']) for(const stage of repairChain(fault,seed,device)) types.add(stage);
    for(const type of EXTRA_TYPES) expect(types.has(type),type).toBe(true);
  });
});
