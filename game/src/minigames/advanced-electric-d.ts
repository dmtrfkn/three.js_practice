import type { AdvancedState } from './advanced-a';
type Result='ok'|'error'|'done'|'info';
type State=AdvancedState & { phase:number; readings:number[]; value:number; fault:number; budget:number; message:string; powered:boolean; installed:boolean; limit:boolean };
export const ELECTRIC_D_TYPES=['audio_ground','sensor_pullup','reverse_polarity'];
export function setupElectricD(s:AdvancedState,seed:number):void{Object.assign(s,{phase:0,readings:[],value:0,fault:seed%2,budget:9,message:'',powered:true,installed:false,limit:false});drawElectricD(s as State);}
function drawElectricD(s:State):void{
 if(s.type==='audio_ground'){
  if(s.phase===0){s.instruction='Определите источник гула';s.detail=`${s.readings.includes(0)?'Источник отключён, гул сохраняется. ':''}${s.readings.includes(1)?`Пульсации питания: ${s.fault?'высокие':'в норме'}. `:''}${s.readings.includes(2)?`Земля корпуса: ${s.fault?'исправна':'плохой контакт'}.`:''} Проверок ${s.budget}.`;s.actions=['Отключить источник','Измерить пульсации','Проверить землю','Заменить фильтр','Восстановить землю'];}
  else{s.instruction='Сравните результат под нагрузкой';s.detail=`${s.readings.includes(3)?'Пульсации в норме. ':''}${s.readings.includes(4)?'Гул отсутствует.':''}`;s.actions=['Измерить пульсации','Прослушать канал','Завершить'];}return;
 }
 if(s.type==='sensor_pullup'){
  if(s.phase===0){s.instruction='Локализуйте обрыв датчика';s.detail=`${s.readings.includes(0)?'На плате питания 5 В. ':''}${s.readings.includes(1)?`На разъёме датчика ${s.fault?'0':'5'} В. `:''}${s.readings.includes(2)?`Сигнальный провод: ${s.fault?'целый':'обрыв'}.`:''} Проверок ${s.budget}.`;s.actions=['Питание на плате','Питание на датчике','Прозвонить сигнал','Починить питание','Починить сигнал'];}
  else{s.instruction='Проверьте питание и движение датчика';s.detail=`${s.readings.includes(3)?'Питание датчика восстановлено. ':''}${s.readings.includes(4)?'При движении сигнал меняется.':''}`;s.actions=['Измерить питание','Подвигать датчик','Завершить'];}return;
 }
 if(s.phase===0){s.instruction='Подготовьте вход к безопасной диагностике';s.detail=`Питание ${s.powered?'подключено':'отключено'}. ${s.readings.includes(0)?`Предохранитель: ${s.fault?'перегорел':'исправен'}. `:''}${s.readings.includes(1)?`Защитный диод: ${s.fault?'пробой':'исправен'}. `:''}${s.readings.includes(2)?`MOSFET: ${s.fault?'исправен':'пробой'}.`:''}`;s.actions=['Отключить питание','Проверить предохранитель','Проверить диод','Проверить MOSFET','Заменить диод','Заменить MOSFET'];}
 else if(s.phase===1){s.instruction='Первое включение после ремонта';s.detail=`Ограничение тока ${s.limit?'установлено':'не установлено'}. Напряжение ${s.value} В, цель 12 В. ${s.readings.includes(3)?'Потребление в норме.':''}`;s.actions=['Ограничить ток','Повысить на 4 В','Измерить потребление','Проверить защиту'];}
 else{s.instruction='Завершите проверку входа';s.detail=`${s.readings.includes(4)?'Полярность проверена. ':''}${s.readings.includes(5)?'Прибор работает под нагрузкой.':''}`;s.actions=['Проверить полярность','Проверить нагрузку','Завершить'];}
}
export function actElectricD(s:State,i:number):Result{
 const fail=(m:string):Result=>{s.errors++;s.message=m;return 'error';};const info=(m:string):Result=>{s.message=m;return 'info';};const ok=(m:string):Result=>{s.message=m;drawElectricD(s);return 'ok';};const done=():Result=>{s.done=true;return 'done';};
 const measure=(id:number):Result=>{if(s.readings.includes(id))return info('Уже проверено.');if(s.budget<=0)return info('Лимит проверок исчерпан.');s.budget--;s.readings.push(id);return ok('Результат записан.');};
 if(s.type==='audio_ground'){
  if(s.phase===0){if(i<3){if(i>0&&!s.readings.includes(0))return info('Сначала исключите источник сигнала.');return measure(i);}if(!s.readings.includes(1)||!s.readings.includes(2))return info('Сравните питание и землю.');if(i!==(s.fault?3:4))return fail('Эта часть исправна.');s.phase=1;return ok('Причина гула устранена.');}if(i<2)return measure(i+3);return s.readings.includes(3)&&s.readings.includes(4)?done():info('Нужны измерение и прослушивание.');
 }
 if(s.type==='sensor_pullup'){
  if(s.phase===0){if(i<3){if(i>0&&!s.readings.includes(0))return info('Сначала измерьте питание на плате.');return measure(i);}if(!s.readings.includes(1)||!s.readings.includes(2))return info('Проверьте оба провода.');if(i!==(s.fault?3:4))return fail('Этот провод исправен.');s.phase=1;return ok('Обрыв восстановлен.');}if(i<2)return measure(i+3);return s.readings.includes(3)&&s.readings.includes(4)?done():info('Проверьте питание и сигнал.');
 }
 if(s.phase===0){if(i===0){if(!s.powered)return info('Питание уже отключено.');s.powered=false;return ok('Питание отключено.');}if(s.powered)return fail('Сначала отключите питание.');if(i<4)return measure(i-1);if(![0,1,2].every(n=>s.readings.includes(n)))return info('Проверьте предохранитель, диод и MOSFET.');if(i!==(s.fault?4:5))return fail('Элемент исправен.');s.installed=true;s.phase=1;return ok(s.fault?'Диод и предохранитель заменены.':'MOSFET заменён.');}
 if(s.phase===1){if(i===0){s.limit=true;return ok('Ток ограничен.');}if(i===1){if(!s.limit)return fail('Сначала ограничьте ток.');s.value=Math.min(12,s.value+4);s.readings=s.readings.filter(n=>n!==3);return ok(`Питание ${s.value} В.`);}if(i===2){if(!s.limit||s.value!==12)return info('Установите ограничение и подайте 12 В.');return measure(3);}if(!s.readings.includes(3))return info('Измерьте потребление при 12 В.');s.phase=2;return ok('Вход работает нормально.');}if(i<2)return measure(i+4);return s.readings.includes(4)&&s.readings.includes(5)?done():info('Проверьте полярность и нагрузку.');
}
