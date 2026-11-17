import { describe, expect, it } from 'vitest';
import { ADVANCED_B_TYPES, actAdvancedB, makeAdvancedB, type AdvancedState } from '../../src/minigames/advanced-b';

function solve(state: AdvancedState): number {
  let decisions=0;
  while(!state.done && decisions<100) {
    const task=state.tasks[state.stage];
    if(task.kind==='choice') {actAdvancedB(state,task.choices.findIndex(c=>c.correct));decisions++;}
    else if(task.kind==='inspection') {
      for(let j=0;j<task.probes.length;j++){actAdvancedB(state,j);decisions++;}
      actAdvancedB(state,task.probes.length+task.choices.findIndex(c=>c.correct));decisions++;
    } else if(task.kind==='gauge') {
      while(task.value<task.low){actAdvancedB(state,1);decisions++;}
      while(task.value>task.high){actAdvancedB(state,0);decisions++;}
      actAdvancedB(state,2);decisions++;
    } else if(task.kind==='sequence') {
      for(const index of task.next){actAdvancedB(state,index);decisions++;}
    } else if(task.kind==='coupled') {
      while(task.values[0]<task.targets[0]){actAdvancedB(state,1);decisions++;}
      while(task.values[0]>task.targets[0]){actAdvancedB(state,0);decisions++;}
      while(task.values[1]<task.targets[1]){actAdvancedB(state,3);decisions++;}
      while(task.values[1]>task.targets[1]){actAdvancedB(state,2);decisions++;}
      actAdvancedB(state,4);decisions++;
    } else if(task.kind==='valves') {
      for(let j=0;j<task.values.length;j++)if(task.values[j]!==task.targets[j]){actAdvancedB(state,j);decisions++;}
      actAdvancedB(state,task.values.length);decisions++;
    } else if(task.kind==='allocation') {
      for(let j=0;j<3;j++)while(task.values[j]<task.targets[j]){actAdvancedB(state,j);decisions++;}
      actAdvancedB(state,6);decisions++;
    } else {
      for(const move of [0,2,5,2,0,2,6]) {actAdvancedB(state,move);decisions++;}
    }
  }
  return decisions;
}

describe('механические и гидравлические задания',()=>{
  it('все 15 типов решаемы для разных вариантов и требуют нескольких действий',()=>{
    for(const type of ADVANCED_B_TYPES)for(let seed=1;seed<=100;seed++){
      const state=makeAdvancedB(type,seed);
      expect(state.tasks.length, type).toBeGreaterThanOrEqual(3);
      expect(solve(state),`${type}/${seed}`).toBeGreaterThanOrEqual(3);
      expect(state.done,`${type}/${seed}`).toBe(true);
      expect(state.errors,`${type}/${seed}`).toBe(0);
    }
  });
  it('диагностика требует замеров, а неправильные решения не пропускают этап',()=>{
    const state=makeAdvancedB('drain_path',23), first=state.tasks[0];
    if(first.kind!=='inspection')throw new Error('expected inspection');
    expect(actAdvancedB(state,first.probes.length+first.choices.findIndex(c=>c.correct))).toBe('error');
    expect(state.stage).toBe(0);expect(state.errors).toBe(1);
    expect(solve(state)).toBeGreaterThan(3);expect(state.done).toBe(true);
  });
  it('настройка связана: первая ручка влияет на обе величины',()=>{
    const state=makeAdvancedB('shaft_align',3);const first=state.tasks[0];
    if(first.kind!=='inspection')throw new Error('expected inspection');
    first.probes.forEach((_,idx)=>actAdvancedB(state,idx));
    actAdvancedB(state,first.probes.length+first.choices.findIndex(c=>c.correct));
    const task=state.tasks[state.stage];if(task.kind!=='coupled')throw new Error('expected coupled');
    actAdvancedB(state,1);expect(task.values).toEqual([1,1]);
    actAdvancedB(state,3);expect(task.values).toEqual([1,2]);
    expect(actAdvancedB(state,4)).toBe('error');expect(state.stage).toBe(1);
    solve(state);expect(state.done).toBe(true);
  });
  it('не допускает опасное соединение и перерасход запаса',()=>{
    const pump=makeAdvancedB('pump_prime',1), line=pump.tasks[2];if(line.kind!=='valves')throw new Error('expected valves');
    pump.stage=2;pump.actions=['Вход','Выход','Выпуск','Проверить'];
    actAdvancedB(pump,0);expect(actAdvancedB(pump,2)).toBe('error');expect(line.values).toEqual([true,false,false]);
    const rotor=makeAdvancedB('impeller_balance',1), weights=rotor.tasks[2];if(weights.kind!=='allocation')throw new Error('expected allocation');
    rotor.stage=2;rotor.actions=['a+','b+','c+','a-','b-','c-','Проверить'];
    for(let k=0;k<weights.budget;k++)actAdvancedB(rotor,0);
    expect(actAdvancedB(rotor,0)).toBe('error');expect(weights.values[0]).toBe(weights.budget);
    actAdvancedB(rotor,3);expect(weights.values[0]).toBe(weights.budget-1);
  });
  it('экран не превышает восемь действий и варианты меняются от seed',()=>{
    for(const type of ADVANCED_B_TYPES){const state=makeAdvancedB(type,1);expect(state.actions.length,type).toBeLessThanOrEqual(8);}
    const starts=new Set(Array.from({length:30},(_,seed)=>makeAdvancedB('hose_clamp',seed).detail));
    expect(starts.size).toBeGreaterThan(1);
  });
});
