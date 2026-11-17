/** Механические, тепловые и гидравлические операции. Все варианты воспроизводятся по seed. */
export const ADVANCED_B_TYPES = [
  'pressure_valve', 'pump_prime', 'drain_path', 'hose_clamp', 'gasket_seal',
  'impeller_balance', 'bearing_fit', 'gear_mesh', 'shaft_align', 'fan_airflow',
  'heat_sink', 'spring_calibrate', 'detergent_dose', 'float_switch', 'filter_flow',
] as const;
export type AdvancedBType = typeof ADVANCED_B_TYPES[number];
type Choice = { label: string; correct: boolean };
type Question = { kind: 'choice'; prompt: string; detail: string; choices: Choice[]; success: string };
type Gauge = { kind: 'gauge'; prompt: string; detail: string; name: string; value: number; low: number; high: number; step: number; min: number; max: number; success: string };
type Sequence = { kind: 'sequence'; prompt: string; detail: string; labels: string[]; next: number[]; position: number; success: string };
type Inspection = { kind: 'inspection'; prompt: string; detail: string; probes: string[]; readings: string[]; visited: boolean[]; choices: Choice[]; success: string };
type Coupled = { kind:'coupled'; prompt:string; detail:string; names:[string,string]; values:[number,number]; targets:[number,number]; success:string };
type Valves = { kind:'valves'; prompt:string; detail:string; labels:string[]; values:boolean[]; targets:boolean[]; forbidden?:[number,number]; success:string };
type Allocation = { kind:'allocation'; prompt:string; detail:string; labels:[string,string,string]; values:[number,number,number]; targets:[number,number,number]; budget:number; success:string };
type Transfer = { kind:'transfer'; prompt:string; detail:string; values:[number,number]; target:number; success:string };
type Task = Question | Gauge | Sequence | Inspection | Coupled | Valves | Allocation | Transfer;
export interface AdvancedState {
  type: string; title: string; instruction: string; detail: string; actions: string[]; done: boolean; errors: number; message: string;
  stage: number; tasks: Task[]; seed: number;
}
export type AdvancedAction = 'ok' | 'error' | 'done' | 'info';

function random(seed: number) { let x = seed >>> 0 || 1; return () => { x = (x + 0x6d2b79f5) >>> 0; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle<T>(xs: T[], rng: () => number): T[] { return xs.map(v => ({v, n:rng()})).sort((a,b)=>a.n-b.n).map(x=>x.v); }
function choice(prompt:string, detail:string, correct:string, wrong:string[], success:string, rng:()=>number): Question {
  return {kind:'choice',prompt,detail,choices:shuffle([{label:correct,correct:true}, ...wrong.map(label=>({label,correct:false}))],rng),success};
}
function gauge(prompt:string, detail:string, name:string, value:number, low:number, high:number, success:string, step=1): Gauge {
  return {kind:'gauge',prompt,detail,name,value,low,high,step,min:0,max:10,success};
}
function sequence(prompt:string, detail:string, labels:string[], order:number[], success:string): Sequence {
  return {kind:'sequence',prompt,detail,labels,next:order,position:0,success};
}
function inspect(prompt:string, detail:string, probes:string[], readings:string[], correct:string, wrong:string[], success:string, rng:()=>number): Inspection {
  return {kind:'inspection',prompt,detail,probes,readings,visited:probes.map(()=>false),choices:shuffle([{label:correct,correct:true},...wrong.map(label=>({label,correct:false}))],rng),success};
}
function coupled(prompt:string,detail:string,names:[string,string],targets:[number,number],success:string):Coupled {
  return {kind:'coupled',prompt,detail,names,values:[0,0],targets,success};
}
function valves(prompt:string,detail:string,labels:string[],targets:boolean[],success:string,forbidden?:[number,number]):Valves {
  return {kind:'valves',prompt,detail,labels,values:labels.map(()=>false),targets,success,forbidden};
}
function allocation(prompt:string,detail:string,labels:[string,string,string],targets:[number,number,number],success:string):Allocation {
  return {kind:'allocation',prompt,detail,labels,values:[0,0,0],targets,budget:targets.reduce((a,b)=>a+b,0),success};
}

export function makeAdvancedB(type: AdvancedBType, seed:number): AdvancedState {
  const rng=random(seed+771), variant=Math.floor(rng()*3), delta=variant-1;
  const q=(prompt:string, detail:string, correct:string, wrong:string[], success:string)=>choice(prompt,detail,correct,wrong,success,rng);
  const g=(prompt:string, detail:string, name:string, value:number, low:number, high:number, success:string)=>gauge(prompt,detail,name,value,low,high,success);
  const s=(prompt:string, detail:string, labels:string[], order:number[], success:string)=>sequence(prompt,detail,labels,order,success);
  const i=(prompt:string, detail:string, probes:string[], readings:string[], correct:string, wrong:string[], success:string)=>inspect(prompt,detail,probes,readings,correct,wrong,success,rng);
  const c=(prompt:string,detail:string,names:[string,string],targets:[number,number],success:string)=>coupled(prompt,detail,names,targets,success);
  const v=(prompt:string,detail:string,labels:string[],targets:boolean[],success:string,forbidden?:[number,number])=>valves(prompt,detail,labels,targets,success,forbidden);
  const a=(prompt:string,detail:string,labels:[string,string,string],targets:[number,number,number],success:string)=>allocation(prompt,detail,labels,targets,success);
  let title='', tasks:Task[]=[];
  switch(type) {
    case 'pressure_valve': { const pressure=6+variant; title='Клапан давления'; tasks=[
      i('Найдите причину сброса давления','Снимите оба показания и сравните их с нормой 3–5 бар.',['Измерить вход','Измерить выход'],[`${pressure} бар на входе`,`${pressure} бар на выходе`],'Клапан пропускает слишком высокое давление',['Засор после клапана','Давление уже в норме'],'Перепад отсутствует: клапан открыт.'),
      c('Согласуйте клапан и перепуск','Цель: выход 3, перепуск 2. Винт A меняет обе величины, B — только перепуск.',['Выход','Перепуск'],[3,2],'Оба контура настроены.'),
      q('Проверьте защиту','При закрытии выхода давление начнёт расти. Как безопасно проверить сброс?','Кратко поднять давление и убедиться в сбросе',['Заглушить сброс и поднять давление','Проверить только при отключённом насосе'],'Защита сбрасывает избыточное давление.')]; break; }
    case 'pump_prime': { const bubbles=2+variant; title='Прокачка насоса'; tasks=[
      i('Определите причину пустого хода','Проверьте резервуар и выход: сначала нужны оба замера.',['Проверить бак','Проверить выход'],['Вода в баке есть','На выходе воздух, струи нет'],'Воздушная пробка',['Пустой бак','Закрыт сливной фильтр'],'Насос захватил воздух.'),
      {kind:'transfer',prompt:'Отмерьте воду для заливки',detail:`В линии ${bubbles} пузырька. Для прокачки нужно 4 л. Есть только ёмкости 5 и 3 л; переливайте до заполнения.`,values:[0,0],target:4,success:'Подготовлены 4 литра для прокачки.'},
      v('Верните насос в работу','Для работы откройте вход и выход, закройте выпуск воздуха. Вход и выпуск нельзя открыть вместе.',['Вход','Выход','Выпуск воздуха'],[true,true,false],'Насос прокачан без сухого хода.',[0,2])]; break; }
    case 'drain_path': { const block=['фильтр','шланг','насос'][variant]; title='Засор сливного тракта'; const readings = variant===0?['После фильтра поток почти пропал','У входа в шланг воды почти нет']:variant===1?['После фильтра поток есть','Перед шлангом поток есть, на выходе нет']:['После фильтра поток есть','Насос гудит, но перед шлангом потока нет']; tasks=[
      i('Локализуйте засор','Проверьте два участка по ходу воды.',['После фильтра','Выход шланга'],readings,block,['фильтр','шланг','насос'].filter(x=>x!==block),'Проблемный участок определён.'),
      q('Уберите засор без повреждений',`Неисправный участок: ${block}. Что сделать?`,variant===0?'Вынуть сетку и промыть':variant===1?'Отсоединить шланг и промыть': 'Снять крышку и убрать мусор у крыльчатки',variant===0?['Продавить сетку отвёрткой','Подать давление при закрытой крышке']:variant===1?['Проткнуть шланг шилом','Сжать шланг сильнее']:['Раскрутить крыльчатку с подключённым питанием','Заглушить слив'],'Засор устранён.'),
      v('Проверьте сливной контур','Откройте бак и слив, перекройте сервисный байпас. Бак нельзя открывать одновременно с байпасом.',['Бак','Слив','Байпас'],[true,true,false],'Слив работает.',[0,2])]; break; }
    case 'hose_clamp': { const diameter=[18,20,22][variant]; title='Подбор хомута'; tasks=[
      q('Подберите хомут','Замер наружного диаметра шланга: '+diameter+' мм. Выберите диапазон, в который он входит с запасом.',`${diameter-2}–${diameter+2} мм`,[`${diameter+3}–${diameter+7} мм`,`${diameter-8}–${diameter-4} мм`],'Хомут подходит по диапазону.'),
      g('Затяните соединение','Условная шкала усилия: от 4 до 5 — герметично; выше 5 шланг пережат.','Усилие',1+delta,4,5,'Шланг зажат без пережатия.'),
      q('Проверьте хомут','После подачи воды на стыке сухо, но шланг тянется с усилием. Что дальше?','Проверить при рабочем давлении и оставить',['Дотянуть до упора независимо от усилия','Проколоть шланг для сброса давления'],'Соединение проверено.')]; break; }
    case 'gasket_seal': { const temp=[55,90,125][variant]; const mat=variant===0?'EPDM до 80 °C':variant===1?'силикон до 110 °C':'фторкаучук до 150 °C'; title='Герметизация соединения'; tasks=[
      q('Выберите уплотнитель',`Рабочая температура ${temp} °C. Нужен материал с ближайшим допустимым пределом выше неё.`,mat,['натуральная резина до 40 °C',variant===2?'силикон до 110 °C':'фторкаучук до 150 °C'],'Материал рассчитан на температуру.'),
      s('Установите прокладку','Очистите посадочное место, уложите прокладку без перекручивания и затяните крепёж.',['Уложить прокладку','Затянуть крышку','Очистить канавку'],[2,0,1],'Прокладка установлена ровно.'),
      g('Проверьте прижим','Уменьшайте зазор равномерно до диапазона 2–3 условных единиц.','Зазор',6+delta,2,3,'Прижим равномерный.')]; break; }
    case 'impeller_balance': { const heavy=['слева','сверху','справа'][variant], opposite=['справа','снизу','слева'][variant]; title='Балансировка крыльчатки'; tasks=[
      i('Найдите тяжёлую сторону','При свободном вращении тяжёлая сторона останавливается внизу; повторите опыт.',['Повернуть на пол-оборота','Повторить вращение'],[`Метка «${heavy}» ушла вниз`,`Метка «${heavy}» снова внизу`],heavy,['слева','сверху','справа'].filter(x=>x!==heavy),'Тяжёлая сторона найдена.'),
      q('Расположите противовес','Противовес ставят на противоположной стороне от тяжёлой.',opposite,['слева','сверху','справа','снизу'].filter(x=>x!==opposite).slice(0,2),'Противовес поставлен.'),
      a('Распределите противовес','На трёх секторах нужны массы 1, 2 и 3. Запас ограничен шестью грузиками; лишний можно снять.',['Сектор A','Сектор B','Сектор C'],[1,2,3],'Вибрация минимальна.')]; break; }
    case 'bearing_fit': { const shaft=[8,10,12][variant]; title='Посадка подшипника'; tasks=[
      q('Подберите подшипник',`Измеренный вал — ${shaft} мм. Внутренний диаметр подшипника должен совпадать.`,`${shaft} мм`,[`${shaft-1} мм`,`${shaft+1} мм`],'Размер совпадает.'),
      q('Подготовьте посадку','Подшипник туго садится на вал. Как не передать усилие через шарики?','Нагреть внутреннее кольцо и давить на него',['Бить по наружному кольцу','Давить на сепаратор'],'Кольцо подготовлено.'),
      g('Проверьте осевой люфт','Рабочий диапазон люфта на индикаторе: 2–3 деления.','Люфт',6+delta,2,3,'Подшипник сидит без перекоса.')]; break; }
    case 'gear_mesh': { const target=3+variant; title='Регулировка шестерён'; tasks=[
      i('Проверьте зацепление','Отметьте пятно контакта и измерьте свободный ход.',['Краска на зубьях','Свободный ход'],['Пятно у края зуба','Люфт превышает норму'],'Шестерни смещены и слишком далеко',['Не хватает смазки только на валу','Зазор слишком мал'],'Причина заедания найдена.'),
      c('Согласуйте люфт и контакт',`Цели: люфт 3, пятно ${target}. Винт A сдвигает и люфт, и пятно; B только пятно.`,['Люфт','Пятно'],[3,target],'Люфт и пятно одновременно в допуске.'),
      q('Закрепите настройку','После настройки шестерня ходит свободно без закусывания. Как проверить посадку?','Провернуть пару вручную на полный оборот',['Зафиксировать шестерни клином','Включить привод без защитной крышки'],'Передача вращается свободно.')]; break; }
    case 'shaft_align': { const targetX=3+variant,targetY=5-variant; title='Центровка вала'; tasks=[
      i('Измерьте биение','Проверните вал и снимите показания в двух плоскостях.',['Индикатор X','Индикатор Y'],[`Центр по X: ${targetX}`,`Центр по Y: ${targetY}`],'Регулировать обе опоры',['Менять только смазку','Затянуть крепёж без регулировки'],'Плоскости измерены.'),
      c('Выровняйте обе опоры',`Цели: X=${targetX}, Y=${targetY}. Передняя опора меняет X и Y, задняя только Y.`,['X','Y'],[targetX,targetY],'Биение устранено.'),
      q('Зафиксируйте результат','Индикаторы в норме. Какая проверка выявит перекос после затяжки?','Повторить замеры после затяжки',['Снять индикаторы до затяжки и не проверять','Смазать вал вместо повторного измерения'],'Настройка сохранилась после затяжки.')]; break; }
    case 'fan_airflow': { const target=[3,4,5][variant]; title='Поток вентилятора'; tasks=[
      i('Найдите причину перегрева','Сравните поток до и после воздуховода.',['Измерить вход','Измерить выход'],['На входе поток сильный','На выходе поток слабый'],'Сопротивление в воздуховоде',['Неисправен датчик температуры','Слишком высокий выходной поток'],'Проблема локализована.'),
      q('Восстановите поток','Решётка чистая, но заслонка закрыта. Что выбрать?','Открыть заслонку и проверить ход',['Увеличить скорость при закрытой заслонке','Закрыть воздухозаборник'],'Воздуховод открыт.'),
      c('Настройте поток и шум',`Цели: поток ${target}, шум 2. Скорость меняет оба показателя; заслонка меняет только шум.`,['Поток','Шум'],[target,2],'Поток достаточен, шум в норме.')]; break; }
    case 'heat_sink': { const torque=3+variant; title='Прижим радиатора'; tasks=[
      q('Подготовьте поверхности','Старая паста высохла по краям и содержит пыль. Как поступить?','Удалить остатки и очистить обе поверхности',['Добавить пасту поверх грязи','Оставить воздушный зазор'],'Поверхности очищены.'),
      s('Затяните крепёж крест-накрест','Поочерёдно подтягивайте противоположные винты: 1, 3, 2, 4.',['Винт 1','Винт 2','Винт 3','Винт 4'],[0,2,1,3],'Прижим распределён равномерно.'),
      a('Распределите прижим',`Схема опор требует усилия ${torque}, 2 и 1 делений. Запас усилия ограничен суммой.`,['Опора A','Опора B','Опора C'],[torque,2,1],'Радиатор закреплён без перекоса.')]; break; }
    case 'spring_calibrate': { const target=4+delta; title='Калибровка пружины'; tasks=[
      i('Измерьте свободный ход','Снимите показания без нагрузки и с контрольным грузом.',['Без груза','Контрольный груз'],['Без нагрузки: 0 делений',`С грузом: ${target} делений — паспортное значение`],'Настраивать предварительный натяг',['Растянуть пружину пассатижами','Удалить пружину'],'Контрольная точка найдена.'),
      g('Выставьте натяг',`Контрольная метка — ${target}.`, 'Натяг',8,target,target,'Натяг настроен.'),
      s('Проверьте возврат','Проверьте ход под нагрузкой и после снятия груза.',['Снять груз','Установить контрольный груз','Проверить возврат в ноль'],[1,0,2],'Пружина возвращается без заеданий.')]; break; }
    case 'detergent_dose': { const target=[3,4,5][variant]; title='Калибровка дозатора'; tasks=[
      i('Проверьте подачу','Откройте крышку и проверьте проход жидкости.',['Осмотреть резервуар','Проверить сопло'],['Раствор в резервуаре есть','Сопло частично засохло'],'Прочистить сопло',['Заменить резервуар','Увеличить дозу вдвое'],'Причина малой подачи найдена.'),
      q('Очистите сопло','Сопло пластиковое и тонкое. Что безопаснее?','Промыть тёплой водой и мягкой щёткой',['Расширить отверстие сверлом','Поджечь засохший остаток'],'Сопло чистое.'),
      c('Откалибруйте дозу и промывку',`Цели: доза ${target}, промывка 2. Первый регулятор меняет обе величины, второй — промывку.`,['Доза','Промывка'],[target,2],'Подача и промывка соответствуют норме.')]; break; }
    case 'float_switch': { const target=[3,4,5][variant]; title='Регулировка поплавка'; tasks=[
      i('Проверьте датчик уровня','Проверьте состояние контакта при двух положениях.',['Поплавок внизу','Поплавок вверху'],['Контакт замкнут','Контакт разомкнут'],'Контакт исправен, проверить уровень срабатывания',['Контакт всегда разомкнут','Немедленно закоротить датчик'],'Контакт переключается.'),
      g('Настройте уровень',`Отключение должно происходить на отметке ${target}.`, 'Уровень',8,target,target,'Положение датчика установлено.'),
      s('Проверьте срабатывание','Поднимите уровень, убедитесь в отключении и затем опустите уровень.',['Опустить уровень','Поднять уровень','Проверить отключение'],[1,2,0],'Датчик отключает подачу и возвращается.')]; break; }
    case 'filter_flow': { const microns=[50,100,200][variant]; title='Подбор и проверка фильтра'; tasks=[
      q('Подберите сетку',`Сервисный допуск: частицы крупнее ${microns} мкм не должны проходить. Выберите указанную сетку.`,`${microns} мкм`,[`${microns*2} мкм`,`${microns+50} мкм`].filter((x,n,a)=>x!==`${microns} мкм`&&a.indexOf(x)===n).concat(['500 мкм']).slice(0,2),'Размер ячейки выбран.'),
      s('Обслужите фильтр','Изолируйте поток, выньте сетку и промойте её против направления потока.',['Промыть сетку','Остановить поток','Вынуть сетку'],[1,2,0],'Фильтр очищен без повреждений.'),
      g('Проверьте перепад давления','Чистый фильтр даёт перепад 1–2 деления при рабочем потоке.','Перепад',6+delta,1,2,'Пропускная способность восстановлена.')]; break; }
  }
  const state:AdvancedState={type,title,instruction:'',detail:'',actions:[],done:false,errors:0,message:'',stage:0,tasks,seed};
  refresh(state); return state;
}

function refresh(state:AdvancedState):void {
  const task=state.tasks[state.stage];
  if (!task) {state.done=true;state.instruction='Работа завершена';state.detail='';state.actions=[];return;}
  state.instruction=task.prompt;
  if(task.kind==='choice') {state.detail=task.detail;state.actions=task.choices.map(c=>c.label);}
  if(task.kind==='gauge') {state.detail=`${task.detail} ${task.name}: ${task.value}.`;state.actions=['Уменьшить','Увеличить','Зафиксировать'];}
  if(task.kind==='sequence') {state.detail=`${task.detail} Выполнено: ${task.position} из ${task.next.length}.`;state.actions=task.labels;}
  if(task.kind==='inspection') {const readings=task.visited.map((done,k)=>done?task.readings[k]:null).filter(Boolean);state.detail=[task.detail,...readings].join(' ');state.actions=[...task.probes.map((p,k)=>`${p}${task.visited[k]?' ✓':''}`),...task.choices.map(c=>c.label)];}
  if(task.kind==='coupled') {state.detail=`${task.detail} ${task.names[0]}: ${task.values[0]}, ${task.names[1]}: ${task.values[1]}.`;state.actions=['Винт A −','Винт A +','Винт B −','Винт B +','Проверить'];}
  if(task.kind==='valves') {state.detail=task.detail;state.actions=[...task.labels.map((label,k)=>`${label}: ${task.values[k]?'открыт':'закрыт'}`),'Проверить контур'];}
  if(task.kind==='allocation') {state.detail=`${task.detail} Сейчас: ${task.values.join(' / ')}. Осталось: ${task.budget-task.values.reduce((a,b)=>a+b,0)}.`;state.actions=[...task.labels.map(x=>`${x} +`),...task.labels.map(x=>`${x} −`),'Проверить'];}
  if(task.kind==='transfer') {state.detail=`${task.detail} Сейчас: большая ${task.values[0]} л, малая ${task.values[1]} л.`;state.actions=['Наполнить 5 л','Наполнить 3 л','5 л → 3 л','3 л → 5 л','Вылить 5 л','Вылить 3 л','Залить в насос'];}
}
export function actAdvancedB(state:AdvancedState,index:number):AdvancedAction {
  if(state.done || !Number.isInteger(index) || index<0 || index>=state.actions.length)return 'info';
  const task=state.tasks[state.stage]; let correct=false;
  const fail=(message:string):AdvancedAction=>{state.errors++;state.message=message;return 'error';};
  if(task.kind==='choice') {if(!task.choices[index].correct)return fail('Это решение не соответствует измерениям или допуску.');correct=true;}
  if(task.kind==='gauge') {
    if(index<2) {const change=index===0?-task.step:task.step;task.value=Math.max(task.min,Math.min(task.max,task.value+change));state.message=`${task.name}: ${task.value}.`;refresh(state);return 'ok';}
    if(task.value<task.low || task.value>task.high)return fail('Параметр вне допустимого диапазона. Продолжайте настройку.');correct=true;
  }
  if(task.kind==='sequence') {
    if(index!==task.next[task.position])return fail('Этот шаг пока выполнять рано. Проверьте зависимости.');
    task.position++; if(task.position<task.next.length){state.message=`Выполнено ${task.position} из ${task.next.length}.`;refresh(state);return 'ok';}correct=true;
  }
  if(task.kind==='inspection') {
    if(index<task.probes.length) {task.visited[index]=true;state.message=task.readings[index];refresh(state);return 'ok';}
    if(!task.visited.every(Boolean))return fail('Для вывода сначала снимите оба показания.');
    if(!task.choices[index-task.probes.length].correct)return fail('Показания не подтверждают этот вывод.');correct=true;
  }
  if(task.kind==='coupled') {
    if(index<4) {const delta=index%2===0?-1:1;if(index<2){task.values[0]=Math.max(0,Math.min(10,task.values[0]+delta));task.values[1]=Math.max(0,Math.min(10,task.values[1]+delta));}else task.values[1]=Math.max(0,Math.min(10,task.values[1]+delta));state.message='Измерения обновлены.';refresh(state);return 'ok';}
    if(task.values.some((value,k)=>value!==task.targets[k]))return fail('Оба показателя должны одновременно быть в допуске.');correct=true;
  }
  if(task.kind==='valves') {
    if(index<task.values.length) {const next=!task.values[index];if(next && task.forbidden?.includes(index) && task.values[task.forbidden[0]===index?task.forbidden[1]:task.forbidden[0]])return fail('Одновременное открытие этих линий небезопасно.');task.values[index]=next;state.message='Положение линии изменено.';refresh(state);return 'ok';}
    if(task.values.some((value,k)=>value!==task.targets[k]))return fail('Путь потока ещё не собран правильно.');correct=true;
  }
  if(task.kind==='allocation') {
    if(index<6) {const slot=index%3;if(index<3){if(task.values.reduce((a,b)=>a+b,0)>=task.budget)return fail('Запас закончился. Сначала снимите лишнее.');task.values[slot]++;}else {if(task.values[slot]===0)return 'info';task.values[slot]--;}state.message='Распределение изменено.';refresh(state);return 'ok';}
    if(task.values.some((value,k)=>value!==task.targets[k]))return fail('Распределение пока не соответствует схеме.');correct=true;
  }
  if(task.kind==='transfer') {
    if(index<6) {
      const [big,small]=task.values;
      if(index===0)task.values[0]=5;
      if(index===1)task.values[1]=3;
      if(index===2){const poured=Math.min(big,3-small);task.values=[big-poured,small+poured];}
      if(index===3){const poured=Math.min(small,5-big);task.values=[big+poured,small-poured];}
      if(index===4)task.values[0]=0;
      if(index===5)task.values[1]=0;
      state.message='Объём в ёмкостях изменился.';refresh(state);return 'ok';
    }
    if(!task.values.includes(task.target))return fail('Для заливки нужна ровно нужная порция.');correct=true;
  }
  if(correct) {state.message=task.success;state.stage++;refresh(state);return state.done?'done':'ok';}
  return 'info';
}
