import type { AdvancedState } from './advanced-a';
type Result = 'ok'|'error'|'done'|'info';
type State = AdvancedState & { phase:number; readings:number[]; value:number; target:number; fault:number; budget:number; repaired:boolean; message:string; meter:number };
export const ELECTRIC_B_TYPES=['relay_contacts','voltage_divider','thermistor_curve','opamp_clip'];
export function setupElectricB(s:AdvancedState,seed:number):void {Object.assign(s,{phase:0,readings:[],value:seed%2?1:5,target:3,fault:seed%2,budget:6,repaired:false,message:''});drawElectricB(s as State);}
export function drawElectricB(s:State):void {
 if(s.type==='relay_contacts'){
  if(s.phase===0){s.instruction='Найдите причину отказа реле';s.detail=`Доступно ${s.budget} проверок. ${s.readings.includes(0)?'Катушка щёлкает при подаче питания. ':''}${s.readings.includes(1)?`Сопротивление замкнутых контактов: ${s.fault?'18 Ом':'0,1 Ом'}. `:''}${s.readings.includes(2)?`На нагрузке ${s.fault?'0':'12'} В.`:''}`;s.actions=['Проверить катушку','Измерить контакты','Измерить нагрузку','Заменить контакты','Заменить нагрузку'];}
  else{s.instruction='Проверьте ремонт под нагрузкой';s.detail=`${s.readings.includes(3)?'Падение на контактах в норме. ':''}${s.readings.includes(4)?'Нагрузка работает.':''}`;s.actions=['Замерить падение','Включить нагрузку','Завершить'];}return;
 }
 if(s.type==='voltage_divider'){
  if(s.phase===0){s.instruction='Найдите неисправность делителя';s.detail=`Питание 12 В. ${s.readings.includes(0)?`Напряжение в средней точке ${s.fault?'11,9':'0,1'} В. `:''}${s.readings.includes(1)?`Верхний резистор: ${s.fault?'10 кОм':'обрыв'}. `:''}${s.readings.includes(2)?`Нижний резистор: ${s.fault?'обрыв':'10 кОм'}.`:''} Замеров: ${s.budget}.`;s.actions=['Напряжение точки','Проверить верхний','Проверить нижний','Заменить верхний','Заменить нижний'];}
  else{s.instruction='Подберите сопротивление и проверьте выход';s.detail=`Верхний 10 кОм; заменяемый нижний: ${s.value*5} кОм. Средняя точка должна давать 6 В.`;s.actions=['Уменьшить на 5 кОм','Увеличить на 5 кОм','Измерить выход','Завершить'];}return;
 }
 if(s.type==='thermistor_curve'){
  if(s.phase===0){s.instruction='Исследуйте датчик при разных температурах';s.detail=`Температура: ${s.value===0?'холодный':'тёплый'}. ${s.readings.includes(0)?'Холодный: 10 кОм. ':''}${s.readings.includes(1)?`Тёплый: ${s.fault?'обрыв':'4 кОм'}.`:''} Замеров: ${s.budget}.`;s.actions=['Охладить','Нагреть','Измерить сопротивление','Заменить датчик','Оставить датчик'];}
  else{s.instruction='Проверьте датчик после ремонта';s.detail=`${s.readings.includes(2)?'На холоде показание в норме. ':''}${s.readings.includes(3)?'При нагреве сопротивление уменьшается.':''}`;s.actions=['Измерить холодным','Измерить тёплым','Завершить'];}return;
 }
 if(s.phase===0){s.instruction='Найдите источник искажений';s.detail=`${s.readings.includes(0)?'На входе синус чистый. ':''}${s.readings.includes(1)?'На выходе срезаны вершины. ':''}Усиление: ${s.value}. Проверок: ${s.budget}.`;s.actions=['Посмотреть вход','Посмотреть выход','Снизить усиление','Повысить усиление','Подать сигнал'];}
 else{s.instruction='Проверьте результат на двух уровнях сигнала';s.detail=`${s.readings.includes(2)?'Малый сигнал без искажений. ':''}${s.readings.includes(3)?'Большой сигнал без искажений.':''}`;s.actions=['Малый сигнал','Большой сигнал','Завершить'];}
}
export function actElectricB(s:State,i:number):Result {
 const info=(m:string):Result=>{s.message=m;return 'info';};const fail=(m:string):Result=>{s.errors++;s.message=m;return 'error';};const ok=(m:string):Result=>{s.message=m;drawElectricB(s);return 'ok';};const done=():Result=>{s.done=true;return 'done';};
 const measure=(id:number):Result=>{if(s.readings.includes(id))return info('Это измерение уже выполнено.');if(s.budget<=0)return info('Лимит проверок исчерпан.');s.budget--;s.readings.push(id);return ok('Результат записан.');};
 if(s.type==='relay_contacts'){
  if(s.phase===0){if(i<3)return measure(i);if(!s.readings.includes(1)||!s.readings.includes(2))return info('Сначала измерьте контакты и нагрузку.');if(i!==(s.fault?3:4))return fail('Эта деталь исправна.');s.phase=1;s.repaired=true;return ok('Неисправная деталь заменена.');}if(i<2){s.readings.push(i+3);return ok('Проверка выполнена.');}return s.readings.includes(3)&&s.readings.includes(4)?done():info('Нужны обе проверки.');
 }
 if(s.type==='voltage_divider'){
  if(s.phase===0){if(i<3)return measure(i);if(!s.readings.includes(0)||!s.readings.includes(i-2))return info('Измерьте среднюю точку и выбранный резистор.');if(i!==(s.fault?4:3))return fail('Выбран исправный резистор.');s.phase=1;s.value=s.variant?1:3;s.meter=-1;return ok('Выберите номинал замены.');}if(i<2){s.value=Math.max(1,Math.min(5,s.value+(i===0?-1:1)));return ok('Номинал изменён.');}if(i===2){s.meter=s.value;s.message=`Измерено ${Math.round(12*s.value/(2+s.value)*10)/10} В.`;return 'ok';}if(s.value!==2||s.meter!==2)return fail('Нужны 10 кОм и проверка средней точки.');return done();
 }
 if(s.type==='thermistor_curve'){
  if(s.phase===0){if(i<2){s.value=i;return ok(i?'Датчик нагрет.':'Датчик охлаждён.');}if(i===2)return measure(s.value);if(!s.readings.includes(0)||!s.readings.includes(1))return info('Измерьте холодный и тёплый датчик.');if(i!==(s.fault?3:4))return fail('Решение не соответствует измерениям.');s.phase=1;return ok(s.fault?'Датчик заменён.':'Датчик исправен.');}if(i<2){s.readings.push(i+2);return ok('Измерение записано.');}return s.readings.includes(2)&&s.readings.includes(3)?done():info('Проверьте обе температуры.');
 }
 if(s.phase===0){if(i<2)return measure(i);if(i===2||i===3){s.value=Math.max(1,Math.min(5,s.value+(i===2?-1:1)));return ok('Усиление изменено.');}if(!s.readings.includes(0)||!s.readings.includes(1))return info('Сравните вход и выход.');if(s.value!==3)return fail('Настройте усиление до 3.');s.phase=1;return ok('Рабочая точка настроена.');}if(i<2){s.readings.push(i+2);return ok('Сигнал проверен.');}return s.readings.includes(2)&&s.readings.includes(3)?done():info('Проверьте оба уровня сигнала.');
}
