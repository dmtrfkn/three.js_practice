/** Логика дополнительных операций: данные отделены от Canvas, чтобы их можно было проверить без браузера. */
export type ExtraType = 'colors' | 'pipes' | 'disassemble' | 'hidden' | 'solder' | 'double' | 'paste' | 'belt' | 'service' | 'firmware' | 'symptoms' | 'leak' | 'code' | 'check';
export const EXTRA_TYPES: ExtraType[] = ['colors', 'pipes', 'disassemble', 'hidden', 'solder', 'double', 'paste', 'belt', 'service', 'firmware', 'symptoms', 'leak', 'code', 'check'];
export type Tools = Partial<Record<'multimeter' | 'screwdrivers' | 'soldering' | 'flashlight' | 'manuals', boolean>>;
export interface ExtraModel {
  type: ExtraType; title: string; instruction: string; detail: string;
  labels: string[]; selected: boolean[]; order: number[]; step: number;
  values: number[]; targets: number[]; answer: number; errors: number; done: boolean;
}
function random(seed: number) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle<T>(xs: T[], r: () => number): T[] { return xs.map(x => ({x, key: r()})).sort((a,b) => a.key-b.key).map(x => x.x); }
export function makeExtra(type: ExtraType, seed: number, difficulty = 0, tools: Tools = {}): ExtraModel {
  const r = random(seed + 293), pick = (n: number) => Math.floor(r() * n);
  const m: ExtraModel = { type, title:'', instruction:'', detail:'', labels:[], selected:[], order:[], step:0, values:[], targets:[], answer:0, errors:0, done:false };
  const sequence = (title: string, instruction: string, steps: string[]) => {
    m.title = title; m.instruction = instruction; m.labels = shuffle(steps, r); m.order = steps.map(s => m.labels.indexOf(s)); m.selected = steps.map(() => false);
  };
  switch (type) {
    case 'colors': {
      const bands = [['коричневый','чёрный','красный','1 кОм'],['красный','красный','красный','2,2 кОм'],['жёлтый','фиолетовый','красный','4,7 кОм'],['коричневый','чёрный','оранжевый','10 кОм']];
      const b = bands[pick(bands.length)]; m.title='ЦВЕТОВАЯ МАРКИРОВКА'; m.instruction='Найдите резистор с нужными полосами'; m.detail=`По схеме нужен ${b[3]}. Таблица: коричневый 1, чёрный 0, красный 2, жёлтый 4, фиолетовый 7; множитель: красный ×100, оранжевый ×1000.`;
      m.labels=shuffle(bands.map(x=>x.slice(0,3).join(' · ')),r); m.answer=m.labels.indexOf(b.slice(0,3).join(' · ')); break;
    }
    case 'pipes': m.title='ДОРОЖКИ ПЛАТЫ'; m.instruction='Соедините верхний и нижний контакты слева'; m.detail='Поверните каждый участок на 90°. Дорожка проходит через все четыре участка.'; m.labels=['','', '', '']; m.targets=[1,2,3,1]; m.values=m.targets.map(v => (v+1+pick(3))%4); break;
    case 'disassemble': sequence('ПОРЯДОК РАЗБОРКИ','Снимите детали, учитывая зависимости',['Выключить питание','Выкрутить винты','Отжать защёлку','Снять крышку']); m.detail=tools.screwdrivers?'Набор отвёрток: сначала питание, винты, защёлка и крышка.':'Крышку держит защёлка; защёлка закрыта винтами. Сначала отключите питание.'; break;
    case 'hidden': m.title='СКРЫТЫЕ ВИНТЫ'; m.instruction='Откройте заглушки и найдите все винты'; m.detail=tools.flashlight?'Фонарик подсвечивает заглушки с винтами: отмечены точкой.':'Винты прячутся под наклейками и ножками. Пустая заглушка не считается ошибкой.'; m.labels=['Наклейка','Ножка 1','Ножка 2','Заглушка','Ножка 3','Пломба']; m.order=shuffle([0,1,2,3,4,5],r).slice(0,3); m.selected=m.labels.map(()=>false); break;
    case 'solder': m.title='ПАЙКА ДОРОЖКИ'; m.instruction='Проведите паяльник по точкам по порядку'; m.detail=tools.soldering?'Паяльная станция: увеличенный допуск к соседним дорожкам.':'Удерживайте кнопку или палец и ведите по дорожке. Не уходите на соседние контакты.'; m.labels=['1','2','3','4','5']; m.order=[0,1,2,3,4]; m.selected=m.labels.map(()=>false); break;
    case 'double': m.title='ДВОЙНАЯ КАЛИБРОВКА'; m.instruction='Настройте обе шкалы на целевое значение 3'; m.detail='Первая ручка меняет обе шкалы, вторая — только правую. Зелёная отметка — цель.'; m.labels=['Левая −','Левая +','Правая −','Правая +']; m.values=[pick(5),pick(5)]; if(m.values[0]===3 && m.values[1]===3)m.values[0]=2; m.targets=[3,3]; break;
    case 'paste': m.title='ТЕРМОПАСТА'; m.instruction='Нанесите пасту на три участка: по три порции'; m.detail='Нажмите на каждый участок три раза. Четвёртая порция — излишек и ошибка.'; m.labels=['Левый край','Центр','Правый край']; m.values=[0,0,0]; m.targets=[3,3,3]; break;
    case 'belt': m.title='НАТЯЖЕНИЕ РЕМНЯ'; m.instruction='Настройте натяжение по прогибу и звуку'; m.detail='Нужен прогиб 3 мм: дребезг означает слабое натяжение, свист — чрезмерное.'; m.labels=['Ослабить','Натянуть']; m.values=[pick(2) ? 1 : 5]; m.targets=[3]; break;
    case 'service': { const keys=['▲','▼','◀','▶']; m.title='СЕРВИСНОЕ МЕНЮ'; m.instruction='Введите комбинацию из сервисного мануала'; m.labels=keys; m.order=Array.from({length:3 + Math.min(difficulty,1)},()=>pick(4)); m.detail=`Мануал${tools.manuals?'':' (запомните за 5 секунд)'}: ${m.order.map(i=>keys[i]).join('  →  ')}`; break; }
    case 'firmware': sequence('ПЕРЕПРОШИВКА','Выберите действия в безопасном порядке',['Сохранить настройки','Подключить питание','Записать прошивку','Перезагрузить']); m.detail=tools.manuals?'Мануал: сохранение → питание → запись → перезагрузка.':'Без резервной копии настройки потеряются. Запись возможна при стабильном питании, перезагрузка — после записи.'; break;
    case 'symptoms': { const faults=['блок питания','датчик','двигатель']; m.answer=pick(3); m.title='ДИАГНОСТИКА ПО СИМПТОМАМ'; m.instruction='Проверьте версии, затем выберите неисправный блок'; m.detail='Один тест покажет неисправность или исключит версию. Можно выполнить не более двух тестов.'; m.labels=[...faults.map(s=>'Тест: '+s),...faults.map(s=>'Неисправен: '+s)]; m.selected=[false,false,false,false,false,false]; break; }
    case 'leak': { const spots=['Соединение шланга','Насос','Бак','Фильтр']; m.answer=pick(4); m.title='ПОИСК УТЕЧКИ'; m.instruction='Найдите место протечки по следам воды'; const clues=['Капля выступает из резьбы на конце гибкой трубки; ниже по ней тянется мокрый след.','Вода собирается под круглым мотором у крыльчатки, а входящий шланг сухой.','Мокрая полоса начинается у трещины на большой стенке резервуара; соединения сухие.','Вода сочится из-под съёмной крышки сеточки; насос и шланг сухие.']; m.detail=clues[m.answer] + ' Выберите источник, а не лужу.'; m.labels=spots; break; }
    case 'code': { const codes=['1 вспышка · питание','2 вспышки · датчик','3 вспышки · мотор','4 вспышки · память']; m.answer=pick(4); m.title='КОД ОШИБКИ'; m.instruction='Посчитайте вспышки и выберите расшифровку'; m.detail='Таблица: 1 — питание, 2 — датчик, 3 — мотор, 4 — память. Индикатор повторяет код с паузой.'; m.labels=codes; break; }
    case 'check': m.title='ФИНАЛЬНАЯ ПРОВЕРКА'; m.instruction='Проверьте устройство по чек-листу'; m.detail='После включения проверьте все функции. Нажмите каждый пункт.'; m.labels=['Включить питание','Проверить работу','Проверить безопасность','Проверить сборку']; m.selected=m.labels.map(()=>false); break;
  }
  return m;
}
export type ActionResult = 'ok' | 'error' | 'done' | 'info';
export function actExtra(m: ExtraModel, index: number): ActionResult {
  if (m.done || index < 0 || index >= m.labels.length) return 'info';
  const fail=(): ActionResult => { m.errors++; return 'error'; };
  const success=(): ActionResult => { m.done=true; return 'done'; };
  switch(m.type) {
    case 'colors': case 'leak': case 'code': return index === m.answer ? success() : fail();
    case 'pipes': m.values[index]=(m.values[index]+1)%4; return m.values.every((v,i)=>(i===0 || i===3)?v%2===1:v===m.targets[i]) ? success() : 'ok';
    case 'disassemble': case 'solder': case 'firmware':
      if (m.selected[index]) return 'info'; if (m.order[m.step]!==index) return fail(); m.selected[index]=true; m.step++; return m.step===m.order.length?success():'ok';
    case 'service': if(m.order[m.step]!==index) {m.step=0;return fail();} m.step++; return m.step===m.order.length?success():'ok';
    case 'hidden': if(m.selected[index])return 'info'; m.selected[index]=true; m.step += Number(m.order.includes(index)); return m.step===m.order.length?success():'ok';
    case 'double': {const delta=index%2?1:-1; if(index<2){m.values[0]=Math.max(0,Math.min(6,m.values[0]+delta));m.values[1]=Math.max(0,Math.min(6,m.values[1]+delta));} else m.values[1]=Math.max(0,Math.min(6,m.values[1]+delta)); return m.values.every((v,i)=>v===m.targets[i])?success():'ok';}
    case 'paste': if(m.values[index]>=3)return fail(); m.values[index]++; return m.values.every(v=>v===3)?success():'ok';
    case 'belt': m.values[0]=Math.max(0,Math.min(6,m.values[0]+(index? -1:1))); return m.values[0]===3?success():'ok';
    case 'symptoms': if(index<3) { if(m.selected[index]||m.step>=2)return 'info';m.selected[index]=true;m.step++;return 'ok'; } return index-3===m.answer ? success():fail();
    case 'check': if(m.selected[index])return 'info';m.selected[index]=true;return m.selected.every(Boolean)?success():'ok';
  }
}
