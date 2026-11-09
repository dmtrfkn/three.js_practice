// Контент игры: устройства, неисправности, предметы, реплики.
// Источник: docs/«Генерация комнаты и предметов», «Миниигры ремонта и неисправности», «Диалог и модель клиента», «Ценообразование, торг и реакция клиента».

import type { Level } from './params';

export type MinigameType = 'swap' | 'wires' | 'calib' | 'clean';

export interface FaultDef {
  symptom: string;
  name: string;
  type: MinigameType;
  part?: { kind: string; value: number; unit: string; prefix?: string; suffix?: string };
  calibLabel?: string;
}

export interface DeviceDef {
  id: string;
  name: string;
  nameAcc: string; // винительный: «починить чайник»
  price: number;
  faults: [FaultDef, FaultDef];
}

export const DEVICES: Record<string, DeviceDef> = {
  kettle: { id: 'kettle', name: 'Чайник', nameAcc: 'чайник', price: 1500, faults: [
    { symptom: 'Не нагревается, хотя индикатор горит', name: 'Сгорел термопредохранитель', type: 'swap', part: { kind: 'Термопредохранитель', prefix: 'T ', value: 125, unit: ' °C' } },
    { symptom: 'Включается через раз', name: 'Окислились контакты подставки', type: 'clean' },
  ]},
  microwave: { id: 'microwave', name: 'Микроволновка', nameAcc: 'микроволновку', price: 2500, faults: [
    { symptom: 'Не запускается при закрытой дверце', name: 'Неисправен микровыключатель дверцы', type: 'wires' },
    { symptom: 'Не включается совсем', name: 'Сгорел плавкий предохранитель', type: 'swap', part: { kind: 'Предохранитель', value: 10, unit: ' А', suffix: ' 250 В' } },
  ]},
  laptop: { id: 'laptop', name: 'Ноутбук', nameAcc: 'ноутбук', price: 3500, faults: [
    { symptom: 'Сильно греется и выключается', name: 'Забит пылью кулер', type: 'clean' },
    { symptom: 'Часть клавиш не работает', name: 'Отошёл шлейф клавиатуры', type: 'wires' },
  ]},
  tv: { id: 'tv', name: 'Телевизор', nameAcc: 'телевизор', price: 4000, faults: [
    { symptom: 'Щёлкает и не включается', name: 'Вздулся конденсатор блока питания', type: 'swap', part: { kind: 'Конденсатор', value: 470, unit: ' мкФ', suffix: ' 25 В' } },
    { symptom: 'Звук есть, изображения нет', name: 'Обрыв цепи подсветки', type: 'wires' },
  ]},
  washer: { id: 'washer', name: 'Стиральная машина', nameAcc: 'стиральную машину', price: 5000, faults: [
    { symptom: 'Не сливает воду', name: 'Засорился фильтр насоса', type: 'clean' },
    { symptom: 'Набирает слишком много воды', name: 'Сбит датчик уровня воды', type: 'calib', calibLabel: 'ДАТЧИК УРОВНЯ' },
  ]},
  fridge: { id: 'fridge', name: 'Холодильник', nameAcc: 'холодильник', price: 6000, faults: [
    { symptom: 'Морозит слишком сильно', name: 'Сбит термостат', type: 'calib', calibLabel: 'ТЕРМОСТАТ' },
    { symptom: 'Гудит, но не охлаждает', name: 'Неисправно пусковое реле', type: 'swap', part: { kind: 'Пусковое реле', prefix: 'РТК-', value: 220, unit: '' } },
  ]},
  speaker: { id: 'speaker', name: 'Умная колонка', nameAcc: 'умную колонку', price: 5000, faults: [
    { symptom: 'Теряет Wi-Fi', name: 'Отпаялся контакт антенны', type: 'wires' },
    { symptom: 'Не слышит команды', name: 'Забиты пылью микрофоны', type: 'clean' },
  ]},
  dishwasher: { id: 'dishwasher', name: 'Посудомоечная машина', nameAcc: 'посудомойку', price: 8000, faults: [
    { symptom: 'Плохо отмывает посуду', name: 'Засорились форсунки', type: 'clean' },
    { symptom: 'Моет холодной водой', name: 'Обрыв цепи нагревателя', type: 'wires' },
  ]},
  aircon: { id: 'aircon', name: 'Кондиционер', nameAcc: 'кондиционер', price: 9000, faults: [
    { symptom: 'Дует, но почти не охлаждает', name: 'Забит теплообменник', type: 'clean' },
    { symptom: 'Держит неверную температуру', name: 'Сбит датчик температуры', type: 'calib', calibLabel: 'ДАТЧИК t°' },
  ]},
  vr: { id: 'vr', name: 'VR-очки', nameAcc: 'VR-очки', price: 12000, faults: [
    { symptom: 'Изображение двоится', name: 'Сместились линзы', type: 'calib', calibLabel: 'ЮСТИРОВКА ЛИНЗ' },
    { symptom: 'Один экран не включается', name: 'Повреждён шлейф дисплея', type: 'swap', part: { kind: 'Шлейф', prefix: 'FPC-', value: 40, unit: ' pin' } },
  ]},
  coffee: { id: 'coffee', name: 'Кофемашина', nameAcc: 'кофемашину', price: 14000, faults: [
    { symptom: 'Кофе течёт тонкой струйкой', name: 'Накипь в гидросистеме', type: 'clean' },
    { symptom: 'Слабое давление, водянистый кофе', name: 'Сбит регулятор давления помпы', type: 'calib', calibLabel: 'ДАВЛЕНИЕ, бар' },
  ]},
  tennis: { id: 'tennis', name: 'Машина для подачи мячей', nameAcc: 'теннисную пушку', price: 18000, faults: [
    { symptom: 'Мотор работает, мячи не летят', name: 'Порван приводной ремень', type: 'swap', part: { kind: 'Ремень', prefix: 'HTD ', value: 450, unit: ' мм' } },
    { symptom: 'Не включается мотор', name: 'Обрыв провода двигателя', type: 'wires' },
  ]},
  robovac: { id: 'robovac', name: 'Робот-пылесос', nameAcc: 'робот-пылесос', price: 15000, faults: [
    { symptom: 'Ездит, но не собирает мусор', name: 'Щётка обмотана волосами', type: 'clean' },
    { symptom: 'Останавливается без причины', name: 'Сбит датчик перепада высоты', type: 'calib', calibLabel: 'ДАТЧИК ВЫСОТЫ' },
  ]},
  printer: { id: 'printer', name: 'Принтер', nameAcc: 'принтер', price: 18000, faults: [
    { symptom: 'Не захватывает бумагу', name: 'Изношен ролик подачи', type: 'swap', part: { kind: 'Ролик', prefix: 'RL-', value: 1123, unit: '' } },
    { symptom: 'Пишет «нет бумаги» при полном лотке', name: 'Обрыв цепи датчика бумаги', type: 'wires' },
  ]},
  projector: { id: 'projector', name: 'Проектор', nameAcc: 'проектор', price: 22000, faults: [
    { symptom: 'Изображение тусклое, затем гаснет', name: 'Выработала ресурс лампа', type: 'swap', part: { kind: 'Лампа', prefix: 'UHP ', value: 240, unit: ' Вт' } },
    { symptom: 'Выключается через несколько минут', name: 'Забит пылью вентилятор', type: 'clean' },
  ]},
};

export const CLIENT_NAMES = ['Алексей', 'Андрей', 'Антон', 'Артём', 'Борис', 'Виктор', 'Владимир', 'Дмитрий', 'Игорь', 'Кирилл', 'Максим', 'Михаил', 'Павел', 'Роман', 'Сергей'];

/* ---------------- предметы ---------------- */

export type ItemKind = 'reliable' | 'ambiguous' | 'suspicious' | 'neutral';
export type Category = 'budget' | 'knowledge' | 'urgency';

export interface Phrase { conv: string; formal: string }

export interface ItemDef {
  id: string;
  kind: ItemKind;
  title: string;      // заголовок карточки
  card: string;       // наблюдаемый факт
  question: string;
  // reliable
  category?: Category;
  level?: Level;
  answer?: Phrase;
  // ambiguous
  ambKey?: 'budget' | 'knowledge';
  answerHigh?: Phrase;
  answerOther?: Phrase;
  location?: string;
  // suspicious
  susAnswers?: { conv: string; formal: [string, string] };
}

export const RELIABLE: ItemDef[] = [
  { id: 'B_LOW', kind: 'reliable', category: 'budget', level: 0, title: 'Конверт с купонами', card: 'В конверте лежат купоны на повседневные покупки.', question: 'Вы часто пользуетесь купонами?', answer: { conv: 'Да, сейчас внимательно считаю расходы.', formal: 'Да, в настоящее время я внимательно учитываю свои расходы.' } },
  { id: 'B_MID', kind: 'reliable', category: 'budget', level: 1, title: 'Папка с планом покупок', card: 'В папке список запланированных покупок без крупных трат.', question: 'Это ваш план расходов?', answer: { conv: 'Да, траты планирую, но на ремонт деньги есть.', formal: 'Да, я планирую расходы; средства на ремонт у меня предусмотрены.' } },
  { id: 'B_HIGH', kind: 'reliable', category: 'budget', level: 2, title: 'Чек за технику', card: 'Чек за дорогую технику; в строке покупателя указано имя клиента.', question: 'Это ваша покупка?', answer: { conv: 'Да, покупал для себя.', formal: 'Да, эту технику я приобрёл для личного пользования.' } },
  { id: 'K_LOW', kind: 'reliable', category: 'knowledge', level: 0, title: 'Распечатка инструкции', card: 'Распечатка с пометкой «как включить».', question: 'Вам понятна инструкция?', answer: { conv: 'Пока плохо разбираюсь, поэтому и вызвал мастера.', formal: 'Я пока плохо разбираюсь в этой технике, поэтому обратился к вам.' } },
  { id: 'K_MID', kind: 'reliable', category: 'knowledge', level: 1, title: 'Руководство с закладками', card: 'В руководстве отмечены разделы о проверке неисправностей.', question: 'Вы уже проверяли устройство?', answer: { conv: 'Проверил обычные причины, дальше не разбирался.', formal: 'Я проверил основные возможные причины, но не проводил дальнейшую диагностику.' } },
  { id: 'K_HIGH', kind: 'reliable', category: 'knowledge', level: 2, title: 'Мультиметр', card: 'Мультиметр и подписанные щупы.', question: 'Вы сами диагностируете технику?', answer: { conv: 'Да, обычно проверяю неисправности самостоятельно.', formal: 'Да, обычно я самостоятельно диагностирую неисправности.' } },
  { id: 'U_LOW', kind: 'reliable', category: 'urgency', level: 0, title: 'Стикер «можно позже»', card: 'На стикере написано: «можно починить позже».', question: 'Когда устройство вам понадобится?', answer: { conv: 'Пока не срочно.', formal: 'Нет необходимости завершить ремонт в ближайшее время.' } },
  { id: 'U_MID', kind: 'reliable', category: 'urgency', level: 1, title: 'Календарь', card: 'В календаре отмечено: «устройство понадобится на этой неделе».', question: 'Когда оно вам понадобится?', answer: { conv: 'В течение этой недели.', formal: 'Устройство потребуется мне в течение этой недели.' } },
  { id: 'U_HIGH', kind: 'reliable', category: 'urgency', level: 2, title: 'Стикер «нужно сегодня»', card: 'На стикере написано: «нужно сегодня».', question: 'Насколько срочно нужно починить?', answer: { conv: 'Сегодня без него не обойтись.', formal: 'Мне необходимо пользоваться этим устройством уже сегодня.' } },
];

export const AMBIGUOUS: ItemDef[] = [
  { id: 'AMB_LAPTOP', kind: 'ambiguous', location: 'dorm', ambKey: 'budget', title: 'Дорогой ноутбук', card: 'Дорогой ноутбук.', question: 'Это ваш ноутбук?', answerHigh: { conv: 'Да, это мой личный ноутбук.', formal: 'Да, этот ноутбук принадлежит мне.' }, answerOther: { conv: 'Рабочий; мне его выдали на время.', formal: 'Это рабочий ноутбук, предоставленный мне во временное пользование.' } },
  { id: 'AMB_TVBOX', kind: 'ambiguous', location: 'khr', ambKey: 'budget', title: 'Коробка от телевизора', card: 'Коробка от дорогого телевизора.', question: 'Недавно купили телевизор?', answerHigh: { conv: 'Да, купил себе.', formal: 'Да, я приобрёл этот телевизор для себя.' }, answerOther: { conv: 'Помогал родственнику с покупкой; коробку оставил у себя.', formal: 'Я помог родственнику приобрести телевизор; упаковка осталась у меня.' } },
  { id: 'AMB_LAMP', kind: 'ambiguous', location: 'new', ambKey: 'budget', title: 'Дизайнерская лампа', card: 'Дорогая дизайнерская лампа.', question: 'Это ваша лампа?', answerHigh: { conv: 'Да, купил её для этой квартиры.', formal: 'Да, я приобрёл эту лампу для своей квартиры.' }, answerOther: { conv: 'Она была здесь при аренде квартиры.', formal: 'Лампа уже находилась здесь, когда я арендовал квартиру.' } },
  { id: 'AMB_CUP', kind: 'ambiguous', location: 'elite', ambKey: 'budget', title: 'Кубок клуба', card: 'Кубок с эмблемой частного клуба.', question: 'Вы состоите в этом клубе?', answerHigh: { conv: 'Да, это мой кубок из клуба.', formal: 'Да, этот кубок принадлежит мне; я состою в клубе.' }, answerOther: { conv: 'Кубок мне поручили передать владельцу.', formal: 'Меня попросили передать этот кубок его владельцу.' } },
  { id: 'AMB_AWARD', kind: 'ambiguous', location: 'office', ambKey: 'knowledge', title: 'Награда за проект', card: 'Награда за технический проект.', question: 'Это ваша награда?', answerHigh: { conv: 'Да, это награда за мой проект.', formal: 'Да, награду вручили за разработанный мной проект.' }, answerOther: { conv: 'Она принадлежит команде компании.', formal: 'Эта награда принадлежит команде компании, а не лично мне.' } },
];

export const SUSPICIOUS: ItemDef[] = [
  { id: 'SUS_RECORDER', kind: 'suspicious', title: 'Диктофон', card: 'Диктофон с горящим индикатором записи.', question: 'Зачем вы записываете разговор?', susAnswers: { conv: 'Хочу потом вспомнить, что вы сказали о ремонте.', formal: ['Я хотел бы сохранить ваши объяснения, чтобы позже к ним вернуться.', 'Я хотел бы сохранить точную запись нашего разговора о ремонте.'] } },
  { id: 'SUS_PHONE', kind: 'suspicious', title: 'Телефон на подставке', card: 'Телефон на подставке. На экране открыта камера.', question: 'Вы собираетесь снимать ремонт?', susAnswers: { conv: 'Да, хочу показать семье, что было неисправно.', formal: ['Да, я хотел бы показать семье запись ремонта.', 'Да, я хотел бы сохранить запись того, как проходил ремонт.'] } },
  { id: 'SUS_FOLDER', kind: 'suspicious', title: 'Папка с бланками', card: 'Папка с бланками и ручкой.', question: 'Что это за бланки?', susAnswers: { conv: 'Записываю домашние расходы; бланки остались после работы.', formal: ['Я записываю домашние расходы; эти бланки остались у меня после работы.', 'Я хотел бы записать условия ремонта и итоговую сумму.'] } },
];

export interface NeutralDef { id: string; name: string; nameAcc: string }
export const NEUTRALS: Record<string, NeutralDef> = {
  mug: { id: 'mug', name: 'Кружка', nameAcc: 'кружка' },
  spoon: { id: 'spoon', name: 'Ложка', nameAcc: 'ложка' },
  notebook: { id: 'notebook', name: 'Блокнот', nameAcc: 'блокнот' },
  pillow: { id: 'pillow', name: 'Подушка', nameAcc: 'подушка' },
  plant: { id: 'plant', name: 'Растение', nameAcc: 'растение' },
  napkins: { id: 'napkins', name: 'Салфетница', nameAcc: 'салфетница' },
  newspaper: { id: 'newspaper', name: 'Газета', nameAcc: 'газета' },
  deskclock: { id: 'deskclock', name: 'Настольные часы', nameAcc: 'настольные часы' },
  movebox: { id: 'movebox', name: 'Коробка переезда', nameAcc: 'коробка переезда' },
  towel_k: { id: 'towel_k', name: 'Кухонное полотенце', nameAcc: 'кухонное полотенце' },
  plaid: { id: 'plaid', name: 'Плед', nameAcc: 'плед' },
  mousepad: { id: 'mousepad', name: 'Коврик для мыши', nameAcc: 'коврик для мыши' },
  vase: { id: 'vase', name: 'Ваза', nameAcc: 'ваза' },
  cushion: { id: 'cushion', name: 'Декоративная подушка', nameAcc: 'декоративная подушка' },
  magazine: { id: 'magazine', name: 'Спортивный журнал', nameAcc: 'спортивный журнал' },
  towel: { id: 'towel', name: 'Полотенце', nameAcc: 'полотенце' },
  pens: { id: 'pens', name: 'Стакан с ручками', nameAcc: 'стакан с ручками' },
  water: { id: 'water', name: 'Бутылка воды', nameAcc: 'бутылка воды' },
  deptfolder: { id: 'deptfolder', name: 'Папка с названием отдела', nameAcc: 'папка с названием отдела' },
  paperbin: { id: 'paperbin', name: 'Корзина для бумаг', nameAcc: 'корзина для бумаг' },
};

export interface PresetDef { id: string; name: string; neutrals: [string, string] }
export const PRESETS: Record<string, [PresetDef, PresetDef]> = {
  dorm:   [{ id: 'dorm_kitchen', name: 'общая кухня', neutrals: ['mug', 'spoon'] }, { id: 'dorm_room', name: 'комната соседей', neutrals: ['notebook', 'pillow'] }],
  khr:    [{ id: 'khr_kitchen', name: 'кухня-гостиная', neutrals: ['plant', 'napkins'] }, { id: 'khr_room', name: 'общая комната', neutrals: ['newspaper', 'deskclock'] }],
  new:    [{ id: 'new_kitchen', name: 'открытая кухня', neutrals: ['movebox', 'towel_k'] }, { id: 'new_work', name: 'рабочая зона', neutrals: ['plaid', 'mousepad'] }],
  elite:  [{ id: 'elite_living', name: 'просторная гостиная', neutrals: ['vase', 'cushion'] }, { id: 'elite_sport', name: 'спортивная зона', neutrals: ['magazine', 'towel'] }],
  office: [{ id: 'office_reception', name: 'приёмная', neutrals: ['pens', 'water'] }, { id: 'office_open', name: 'открытый офис', neutrals: ['deptfolder', 'paperbin'] }],
};

/* ---------------- реплики ---------------- */

export const BASE_QUESTIONS = {
  urgency: {
    q: 'Когда вам нужно починить устройство?',
    a: [
      { conv: 'Да не горит, могу подождать.', formal: 'Срок не критичен, ремонт можно выполнить позднее.' },
      { conv: 'Хорошо бы на этой неделе.', formal: 'Мне желательно получить исправное устройство в течение этой недели.' },
      { conv: 'Сегодня нужно, без него никак.', formal: 'Мне необходимо получить исправное устройство сегодня.' },
    ] as Phrase[],
  },
  knowledge: {
    q: 'Вы разбираетесь в этой технике?',
    a: [
      { conv: 'Почти нет, даже не знаю, с чего начать.', formal: 'Я плохо разбираюсь в этом устройстве и не смог определить причину поломки.' },
      { conv: 'Обычное проверил, дальше не полез.', formal: 'Я проверил основные причины неисправности, но дальнейшую диагностику не проводил.' },
      { conv: 'Да, обычно сам разбираюсь, тут вызвал мастера.', formal: 'Да, обычно я самостоятельно диагностирую такую технику, но в этом случае обратился к вам.' },
    ] as Phrase[],
  },
};

export const NEUTRAL_ANSWER = (n: NeutralDef): Phrase => ({
  conv: `Это просто ${n.nameAcc}, к ремонту не относится.`,
  formal: `Это ${n.nameAcc}; данный предмет не связан с ремонтом.`,
});

export const LINES = {
  accept: { conv: 'Договорились, чините.', formal: 'Меня устраивает эта сумма. Приступайте, пожалуйста.' },
  acceptSecond: { conv: 'Ладно, так уже лучше. Чините.', formal: 'Такая сумма для меня приемлема. Можете приступать.' },
  soft: { conv: 'Дорого, снизьте.', formal: 'Названная сумма для меня высока. Пожалуйста, предложите меньшую цену.' },
  hard: { conv: 'Вы завысили цену. Сделайте скидку от обычной стоимости.', formal: 'Я знаю рыночную стоимость ремонта. Прошу предложить цену ниже неё.' },
  leave: { conv: 'Нет, так не пойдёт. Найду другого мастера.', formal: 'К сожалению, эта цена мне не подходит. Я обращусь к другому мастеру.' },
  complaint: { conv: 'Вы меня за дурака держите? Пишу на вас жалобу.', formal: 'Вы сознательно завысили цену. Я отказываюсь от ремонта и подаю жалобу.' },
  thanks: { conv: 'Спасибо, работает! Держите.', formal: 'Благодарю, устройство исправно. Вот оплата.' },
  inspectorReveal: 'Минуточку. Служба контроля бытовых услуг. Названная вами цена значительно превышает рыночную — составляю протокол.',
  inspectorQuiet: 'Благодарю, всё в порядке. Всего доброго.',
};

export const TONE = ['сквозь зубы', 'спокойно', 'с улыбкой'];

export const URGENCY_HINT = ['Можно не спешить', 'Хорошо бы на этой неделе', 'Нужно починить сегодня'];

export const OMENS = {
  budget: ['Просит сделать подешевле', 'Спрашивает, сколько примерно будет стоить', 'Пишет: цена не важна, главное быстро'],
  knowledge: ['Пишет: «оно просто сломалось»', 'Пишет, что уже проверил розетку', 'Пишет без ошибок, с терминами'],
  scandal: 'Предупреждает: «Всё проверю, знаю свои права»',
};

export const ALL_ITEMS: Record<string, ItemDef> = Object.fromEntries(
  [...RELIABLE, ...AMBIGUOUS, ...SUSPICIOUS].map((i) => [i.id, i]),
);
