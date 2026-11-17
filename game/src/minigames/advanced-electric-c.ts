import type { AdvancedState } from './advanced-a';
type Result='ok'|'error'|'done'|'info';
type State=AdvancedState & { phase:number; readings:number[]; value:number; fault:number; budget:number; message:string; isolated:number; current:number };
export const ELECTRIC_C_TYPES=['logic_probe','i2c_bus','crystal_clock','led_driver'];
export function setupElectricC(s:AdvancedState,seed:number):void{Object.assign(s,{phase:0,readings:[],value:seed%2?1:5,fault:seed%2,budget:8,message:'',isolated:-1,current:0});drawElectricC(s as State);}
function drawElectricC(s:State):void{
 if(s.type==='logic_probe'){
  if(s.phase===0){s.instruction='Найдите причину постоянного нуля на входе';s.detail=`${s.readings.includes(0)?'При отпущенной кнопке вход 0 В. ':''}${s.readings.includes(1)?'Кнопка отключена, вход остаётся 0 В. ':''}${s.readings.includes(2)?`Подтяжка: ${s.fault?'обрыв':'10 кОм'}. `:''}${s.readings.includes(3)?`Вход относительно земли: ${s.fault?'высокое сопротивление':'короткое замыкание'}.`:''} Проверок ${s.budget}.`;s.actions=['Измерить вход','Отключить кнопку','Проверить подтяжку','Проверить на КЗ','Заменить подтяжку','Устранить КЗ'];}
  else{s.instruction='Проверьте оба состояния кнопки';s.detail=`${s.readings.includes(4)?'Отпущена: высокий уровень. ':''}${s.readings.includes(5)?'Нажата: низкий уровень.':''}`;s.actions=['Проверить отпущенную','Проверить нажатую','Завершить'];}return;
 }
 if(s.type==='i2c_bus'){
  if(s.phase===0){s.instruction='Локализуйте узел, удерживающий шину';s.detail=`Отключён: ${s.isolated<0?'никто':['датчик','дисплей'][s.isolated]}. ${s.readings.includes(0)?'Обе линии в исходном состоянии низкие. ':''}${s.readings.includes(1)?`После отключения датчика шина ${s.fault===0?'восстановилась':'остаётся низкой'}. `:''}${s.readings.includes(2)?`После отключения дисплея шина ${s.fault===1?'восстановилась':'остаётся низкой'}.`:''} Проверок ${s.budget}.`;s.actions=['Проверить обе линии','Отключить датчик','Отключить дисплей','Измерить шину','Заменить датчик','Заменить дисплей'];}
  else{s.instruction='Восстановите шину и проверьте обмен';s.detail=`${s.readings.includes(3)?'SDA/SCL в покое высокие. ':''}${s.readings.includes(4)?'Устройство ответило по адресу.':''}`;s.actions=['Проверить уровни','Опросить адрес','Завершить'];}return;
 }
 if(s.type==='crystal_clock'){
  if(s.phase===0){s.instruction='Проверьте условия запуска генератора';s.detail=`${s.readings.includes(0)?'Питание 3,3 В. ':''}${s.readings.includes(1)?'Сброс снят. ':''}${s.readings.includes(2)?'Колебаний нет. ':''}Проверок ${s.budget}.`;s.actions=['Измерить питание','Проверить сброс','Измерить такт','Заменить кварц'];}
  else if(s.phase===1){s.instruction='Подберите нагрузочную ёмкость';s.detail=`Установлено ${s.value*5} пФ. По схеме необходимо 15 пФ. ${s.readings.includes(3)?'Колебания стабильны при 15 пФ.':''}`;s.actions=['Уменьшить на 5 пФ','Увеличить на 5 пФ','Проверить колебания','Проверить запуск'];}
  else{s.instruction='Убедитесь в стабильном запуске';s.detail=`${s.readings.includes(4)?'Холодный запуск пройден. ':''}${s.readings.includes(5)?'Повторный запуск пройден.':''}`;s.actions=['Холодный запуск','Повторный запуск','Завершить'];}return;
 }
 if(s.phase===0){s.instruction='Найдите неисправную секцию подсветки';s.detail=`Ограничение тока: ${s.current} мА. ${s.readings.includes(0)?`Секция A: ${s.fault===0?'не светится':'светится'}. `:''}${s.readings.includes(1)?`Секция B: ${s.fault===1?'не светится':'светится'}. `:''}Проверок ${s.budget}.`;s.actions=['Установить 20 мА','Установить 100 мА','Проверить секцию A','Проверить секцию B','Заменить секцию A','Заменить секцию B'];}
 else{s.instruction='Проверьте ток и равномерность подсветки';s.detail=`${s.readings.includes(2)?'Ток в норме. ':''}${s.readings.includes(3)?'Свечение равномерное.':''}`;s.actions=['Измерить ток','Проверить свечение','Завершить'];}
}
export function actElectricC(s:State,i:number):Result{
 const fail=(m:string):Result=>{s.errors++;s.message=m;return 'error';};const info=(m:string):Result=>{s.message=m;return 'info';};const ok=(m:string):Result=>{s.message=m;drawElectricC(s);return 'ok';};const done=():Result=>{s.done=true;return 'done';};
 const measure=(id:number):Result=>{if(s.readings.includes(id))return info('Уже измерено.');if(s.budget<=0)return info('Лимит проверок исчерпан.');s.budget--;s.readings.push(id);return ok('Результат записан.');};
 if(s.type==='logic_probe'){
  if(s.phase===0){if(i<4){if(i>1&&!s.readings.includes(1))return info('Сначала отключите кнопку.');return measure(i);}if(!s.readings.includes(2)||!s.readings.includes(3))return info('Нужны результаты обеих проверок.');if(i!==(s.fault?4:5))return fail('Этот элемент исправен.');s.phase=1;return ok('Причина устранена.');}if(i<2)return measure(i+4);return s.readings.includes(4)&&s.readings.includes(5)?done():info('Проверьте оба положения кнопки.');
 }
 if(s.type==='i2c_bus'){
  if(s.phase===0){if(i===0)return measure(0);if(i===1||i===2){s.isolated=i-1;return ok('Узел отключён.');}if(i===3){if(s.isolated<0)return info('Сначала отключите один узел.');return measure(s.isolated+1);}if(!s.readings.includes(s.fault+1))return info('Сначала подтвердите источник измерением.');if(i!==s.fault+4)return fail('Этот узел не удерживает шину.');s.phase=1;return ok('Неисправный узел заменён.');}if(i<2)return measure(i+3);return s.readings.includes(3)&&s.readings.includes(4)?done():info('Проверьте уровни и обмен.');
 }
 if(s.type==='crystal_clock'){
  if(s.phase===0){if(i<3)return measure(i);if(![0,1,2].every(n=>s.readings.includes(n)))return info('Проверьте питание, сброс и такт.');s.phase=1;return ok('Кварц заменён.');}
  if(s.phase===1){if(i<2){s.value=Math.max(1,Math.min(5,s.value+(i===0?-1:1)));s.readings=s.readings.filter(n=>n!==3);return ok('Ёмкость изменена.');}if(i===2){if(s.value!==3)return fail('Колебания нестабильны.');return measure(3);}if(!s.readings.includes(3))return info('Сначала измерьте колебания.');s.phase=2;return ok('Генератор запущен.');}if(i<2)return measure(i+4);return s.readings.includes(4)&&s.readings.includes(5)?done():info('Проверьте оба запуска.');
 }
 if(s.phase===0){if(i<2){s.current=i===0?20:100;return ok('Ограничение тока установлено.');}if(i<4){if(s.current!==20)return fail('Для проверки нужен ограниченный ток 20 мА.');return measure(i-2);}if(!s.readings.includes(0)||!s.readings.includes(1))return info('Сравните обе секции.');if(i!==s.fault+4)return fail('Эта секция исправна.');s.phase=1;return ok('Неисправная секция заменена.');}if(i<2)return measure(i+2);return s.readings.includes(2)&&s.readings.includes(3)?done():info('Проверьте ток и свечение.');
}
