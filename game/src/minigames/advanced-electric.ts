import type { AdvancedState } from './advanced-a';
type Result = 'ok'|'error'|'done'|'info';
export type ElectricState = AdvancedState & { powered: boolean; charged: boolean; meter: number; readings: number[]; installed: boolean; value: number; target: number };
export const ELECTRIC_TYPES = ['diode_bridge','capacitor_esr','transistor_bias'];
export function setupElectric(s:AdvancedState,seed:number):void {Object.assign(s,{powered:true,charged:true,meter:-1,readings:[],installed:false,value:seed%2?1:5,target:3,fault:seed%4,budget:6,step:0});drawElectric(s as ElectricState);}
export function drawElectric(s:ElectricState):void {
 if(s.type==='diode_bridge'){
  if(s.step===0){s.instruction='Обесточьте мост и разрядите конденсатор';s.detail=`Питание: ${s.powered?'включено':'выключено'}; конденсатор: ${s.charged?'заряжен':'разряжен'}.`;s.actions=['Отключить питание','Разрядить конденсатор','Проверить диоды'];}
  else if(s.step===1){s.instruction='Измерьте диоды и отметьте пробитый';s.detail=`Измерено: ${s.readings.map(i=>`D${i+1} ${i===s.fault?'проводит в обе стороны':'проводит в одну сторону'}`).join('; ')||'нет'}. Измерений осталось ${s.budget}.`;s.actions=['Замер D1','Замер D2','Замер D3','Замер D4','Выбрать D1','Выбрать D2','Выбрать D3','Выбрать D4'];}
  else if(s.step===2){s.instruction='Подберите замену для моста';s.detail=`Исходный диод ${s.variant?'2 А, 600 В':'1 А, 400 В'}; запас по току и напряжению допустим.`;s.actions=s.variant?['3 А, 800 В','1 А, 400 В','3 А, 200 В']:['2 А, 600 В','0,5 А, 400 В','2 А, 200 В'];}
  else{s.instruction='Проверьте мост после замены';s.detail='Сначала измерьте переход, затем включайте через ограничитель тока.';s.actions=['Измерить переход','Включить с ограничителем'];}return;
 }
 if(s.type==='capacitor_esr'){
  if(s.step===0){s.instruction='Подготовьте плату к измерению';s.detail=`Питание: ${s.powered?'включено':'выключено'}; конденсатор: ${s.charged?'заряжен':'разряжен'}.`;s.actions=['Отключить питание','Разрядить','Начать измерения'];}
  else if(s.step===1){s.instruction='Измерьте ёмкость и ESR';s.detail=`Ёмкость: ${s.readings.includes(0)?(s.variant?'470 мкФ':'220 мкФ'):'не измерена'}; ESR: ${s.readings.includes(1)?'8 Ом при норме до 0,5 Ом':'не измерен'}.`;s.actions=['Измерить ёмкость','Измерить ESR','Заменить деталь','Оставить деталь'];}
  else if(s.step===2){s.instruction='Установите конденсатор';s.detail='Выводы отмечены + и −. Соблюдайте полярность.';s.actions=['Плюс к плюсу','Плюс к минусу'];}
  else{s.instruction='Проверьте фильтр под нагрузкой';s.detail='После правильной установки проверьте пульсации и температуру.';s.actions=['Измерить пульсации','Проверить температуру','Завершить'];}return;
 }
 if(s.step===0){s.instruction='Измерьте рабочую точку каскада';s.detail=`Регулятор смещения ${s.value}/6. Для симметричного выхода цель 3/6. Замеры: ${s.budget}.`;s.actions=['Измерить выход','Уменьшить смещение','Увеличить смещение','Подать тестовый сигнал'];}
 else{s.instruction='Проверьте выход под сигналом';s.detail=`Смещение ${s.value}/6. ${s.readings.includes(1)?'Верхушка сигнала видна.':''} ${s.readings.includes(2)?'Нижняя часть сигнала видна.':''}`;s.actions=['Проверить верхушку','Проверить низ','Завершить'];}
}
export function actElectric(s:ElectricState,index:number):Result {
 const fail=(message:string):Result=>{s.errors++;s.message=message;return 'error';};
 const next=(message:string):Result=>{s.step++;s.message=message;drawElectric(s);return 'ok';};
 const info=(message:string):Result=>{s.message=message;return 'info';};
 if(s.type==='diode_bridge'||s.type==='capacitor_esr'){
  if(s.step===0){if(index===0){if(!s.powered)return info('Питание уже отключено.');s.powered=false;s.message='Питание отключено.';drawElectric(s);return 'ok';}if(index===1){if(s.powered)return fail('Сначала отключите питание.');if(!s.charged)return info('Конденсатор уже разряжен.');s.charged=false;s.message='Конденсатор разряжен.';drawElectric(s);return 'ok';}if(s.powered||s.charged)return fail('Сначала отключите питание и разрядите конденсатор.');return next('Можно измерять.');}
  if(s.type==='diode_bridge'){
   if(s.step===1){if(index<4){if(s.readings.includes(index))return info('Диод уже проверен.');if(!s.budget)return info('Лимит измерений исчерпан.');s.budget!--;s.readings.push(index);s.message='Результат измерения записан.';drawElectric(s);return 'ok';}const selected=index-4;if(!s.readings.includes(selected))return info('Сначала проверьте этот диод.');if(selected!==s.fault)return fail('Этот диод исправен.');return next('Пробитый диод снят.');}
   if(s.step===2){if(index!==0)return fail('Номинал ниже необходимого.');s.installed=true;return next('Диод установлен.');}
   if(index===0){if(s.readings.includes(4))return info('Переход уже проверен.');s.readings.push(4);s.message='Переход проводит только в одном направлении.';return 'ok';}if(!s.readings.includes(4))return fail('Сначала проверьте переход.');s.done=true;return 'done';
  }
  if(s.step===1){if(index<2){if(s.readings.includes(index))return info('Измерение уже сделано.');s.readings.push(index);s.message='Показание записано.';drawElectric(s);return 'ok';}if(!s.readings.includes(0)||!s.readings.includes(1))return info('Нужны оба измерения.');if(index===3)return fail('Повышенный ESR означает неисправность.');return next('Неисправный конденсатор снят.');}
  if(s.step===2){if(index!==0)return fail('Нарушена полярность.');s.installed=true;return next('Конденсатор установлен.');}
  if(index<2){const marker=index+2;if(s.readings.includes(marker))return info('Уже проверено.');s.readings.push(marker);s.message='Показание в норме.';drawElectric(s);return 'ok';}if(!s.readings.includes(2)||!s.readings.includes(3))return info('Проверьте пульсации и температуру.');s.done=true;return 'done';
 }
 if(s.step===0){if(index===0){if(!s.budget)return info('Лимит измерений исчерпан.');s.budget!--;s.meter=s.value;s.message=`Измерен уровень ${s.value}/6.`;drawElectric(s);return 'ok';}if(index===1||index===2){s.value=Math.max(0,Math.min(6,s.value+(index===1?-1:1)));s.message='Смещение изменено: повторите измерение.';drawElectric(s);return 'ok';}if(s.value!==s.target||s.meter!==s.value)return fail('Настройте и измерьте рабочую точку перед сигналом.');return next('Тестовый сигнал подан.');}
 if(index<2){const marker=index+1;if(s.readings.includes(marker))return info('Уже проверено.');s.readings.push(marker);s.message='Искажений не обнаружено.';drawElectric(s);return 'ok';}if(!s.readings.includes(1)||!s.readings.includes(2))return info('Проверьте обе части сигнала.');s.done=true;return 'done';
}
