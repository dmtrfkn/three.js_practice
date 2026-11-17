// Развитие мастера: навыки, детали, качество ремонта, гарантийные случаи.
// Источник: docs/«Развитие мастера и экономика».
import type { Campaign } from './types';

export type Branch = 'attention' | 'reading' | 'charisma' | 'mastery';
export type PartClass = 'used' | 'normal' | 'original';
export type ToolId = 'multimeter' | 'screwdrivers' | 'soldering' | 'flashlight' | 'manuals' | 'oscilloscope' | 'bench_supply' | 'thermal_camera' | 'magnifier' | 'tweezers' | 'hot_air' | 'desolder_pump' | 'esd_mat' | 'magnetic_tray' | 'torque_driver' | 'ultrasonic_cleaner' | 'pressure_gauge' | 'leak_detector' | 'programmer' | 'signal_generator' | 'bearing_press' | 'feeler_gauge' | 'spring_scale' | 'puller' | 'hose_pliers' | 'airflow_meter' | 'grease_gun' | 'cleaning_brush';

export const TOOLS: { id: ToolId; name: string; cost: number; about: string }[] = [
  { id: 'multimeter', name: 'Хороший мультиметр', cost: 1200, about: 'Помогает найти обрыв и неисправный блок при диагностике.' },
  { id: 'screwdrivers', name: 'Набор отвёрток', cost: 900, about: 'Облегчает разборку и работу с крепежом.' },
  { id: 'soldering', name: 'Паяльная станция', cost: 2500, about: 'Помогает аккуратнее паять соединения.' },
  { id: 'flashlight', name: 'Фонарик', cost: 700, about: 'Помогает заметить скрытые винты.' },
  { id: 'manuals', name: 'Сервисные мануалы', cost: 1800, about: 'Подсказывают при работе с прошивкой и сервисным меню.' },
  { id: 'oscilloscope', name: 'Осциллограф', cost: 2600, about: 'Больше времени на анализ сигнала и диагностику цепи.' },
  { id: 'bench_supply', name: 'Лабораторный блок питания', cost: 1900, about: 'Защищает при проверке питания и поиске неисправного блока.' },
  { id: 'thermal_camera', name: 'Тепловизор', cost: 3200, about: 'Облегчает поиск перегрева и неисправных компонентов.' },
  { id: 'magnifier', name: 'Лупа с подсветкой', cost: 800, about: 'Даёт больше времени на маркировку, осмотр и мелкие соединения.' },
  { id: 'tweezers', name: 'Набор пинцетов', cost: 650, about: 'Упрощает установку мелких деталей и обратную сборку.' },
  { id: 'hot_air', name: 'Термовоздушный фен', cost: 2400, about: 'Даёт запас времени на демонтаж и пайку компонентов.' },
  { id: 'desolder_pump', name: 'Оловоотсос', cost: 700, about: 'Помогает исправить ошибку при пайке.' },
  { id: 'esd_mat', name: 'Антистатический коврик', cost: 1100, about: 'Защищает электронику при сборке и работе с платами.' },
  { id: 'magnetic_tray', name: 'Магнитный лоток', cost: 650, about: 'Помогает не потерять крепёж при разборке и сборке.' },
  { id: 'torque_driver', name: 'Динамометрическая отвёртка', cost: 1600, about: 'Упрощает разборку, сборку и работу с крепежом.' },
  { id: 'ultrasonic_cleaner', name: 'Ультразвуковая ванна', cost: 2300, about: 'Даёт запас времени на очистку и обслуживание контактов.' },
  { id: 'pressure_gauge', name: 'Манометр', cost: 1400, about: 'Помогает при диагностике давления и калибровке.' },
  { id: 'leak_detector', name: 'Детектор протечек', cost: 1500, about: 'Даёт больше времени на поиск утечки.' },
  { id: 'programmer', name: 'Программатор', cost: 2300, about: 'Упрощает сервисное меню и перепрошивку.' },
  { id: 'signal_generator', name: 'Генератор сигнала', cost: 2100, about: 'Помогает при настройке и поиске неисправности цепи.' },
  { id: 'bearing_press', name: 'Пресс для подшипников', cost: 2000, about: 'Добавляет время при посадке подшипника и центровке вала.' },
  { id: 'feeler_gauge', name: 'Набор щупов', cost: 900, about: 'Помогает выставить зазор шестерён и центровку вала.' },
  { id: 'spring_scale', name: 'Пружинный динамометр', cost: 900, about: 'Помогает настроить натяжение пружины и ремня.' },
  { id: 'puller', name: 'Съёмник подшипников', cost: 1300, about: 'Облегчает работу с валом, подшипником и крыльчаткой.' },
  { id: 'hose_pliers', name: 'Клещи для хомутов', cost: 750, about: 'Дают больше времени при работе со шлангом и уплотнением.' },
  { id: 'airflow_meter', name: 'Анемометр', cost: 1200, about: 'Помогает настроить поток вентилятора и баланс крыльчатки.' },
  { id: 'grease_gun', name: 'Маслёнка', cost: 700, about: 'Облегчает работу с подшипником и шестернями.' },
  { id: 'cleaning_brush', name: 'Щётки для каналов', cost: 650, about: 'Помогают при прочистке фильтров и сливных каналов.' },
];

export function buyTool(c: Campaign, id: ToolId): boolean {
  const tool = TOOLS.find(t => t.id === id);
  if (!tool || c.status !== 'board' || c.order || c.tools?.[id] || c.money < tool.cost) return false;
  c.money -= tool.cost;
  c.spent = (c.spent ?? 0) + tool.cost;
  c.tools = { ...c.tools, [id]: true };
  return true;
}

type ToolSupport = { id: ToolId; stages: string[]; seconds?: number; extraErrors?: number; hint: string };
/** Вспомогательные эффекты применяются к соответствующим этапам и не суммируются бесконечно. */
export const TOOL_SUPPORT: ToolSupport[] = [
  { id: 'oscilloscope', stages: ['crystal_clock','opamp_clip','i2c_bus'], seconds: 4, hint: 'Осциллограф: сначала сравните форму и частоту сигнала с эталоном.' },
  { id: 'bench_supply', stages: ['reverse_polarity','voltage_drop','relay_contacts'], extraErrors: 1, hint: 'Блок питания ограничивает ток и позволяет безопасно проверить цепь.' },
  { id: 'thermal_camera', stages: ['capacitor_esr','transistor_bias','heat_sink'], seconds: 4, hint: 'Тепловизор помогает найти источник перегрева перед настройкой.' },
  { id: 'magnifier', stages: ['diode_bridge','capacitor_esr','sensor_pullup'], seconds: 4, hint: 'Лупа помогает рассмотреть маркировку и полярность компонентов.' },
  { id: 'tweezers', stages: ['diode_bridge','led_driver','gasket_seal'], seconds: 4, hint: 'Пинцет упрощает работу с мелкими компонентами.' },
  { id: 'hot_air', stages: ['capacitor_esr','transistor_bias','led_driver'], seconds: 4, hint: 'Фен облегчает демонтаж деталей с платы.' },
  { id: 'desolder_pump', stages: ['diode_bridge','relay_contacts','audio_ground'], extraErrors: 1, hint: 'Оловоотсос помогает исправить ошибку при соединении контактов.' },
  { id: 'esd_mat', stages: ['i2c_bus','logic_probe','sensor_pullup'], extraErrors: 1, hint: 'Антистатический коврик защищает микросхемы при проверке.' },
  { id: 'magnetic_tray', stages: ['hose_clamp','gasket_seal','heat_sink'], extraErrors: 1, hint: 'Магнитный лоток удерживает снятый крепёж.' },
  { id: 'torque_driver', stages: ['hose_clamp','heat_sink','bearing_fit'], seconds: 4, hint: 'Динамометрическая отвёртка помогает равномерно затянуть крепёж.' },
  { id: 'ultrasonic_cleaner', stages: ['drain_path','filter_flow','relay_contacts'], seconds: 4, hint: 'Ультразвуковая ванна помогает удалить загрязнение.' },
  { id: 'pressure_gauge', stages: ['pressure_valve','pump_prime','filter_flow'], seconds: 4, hint: 'Манометр помогает сопоставить давление и поток.' },
  { id: 'leak_detector', stages: ['gasket_seal','hose_clamp','pump_prime'], extraErrors: 1, hint: 'Детектор облегчает проверку герметичности соединения.' },
  { id: 'programmer', stages: ['i2c_bus','logic_probe','crystal_clock'], seconds: 4, hint: 'Программатор помогает проверить состояние цифровой схемы.' },
  { id: 'signal_generator', stages: ['voltage_divider','opamp_clip','audio_ground'], seconds: 4, hint: 'Генератор подаёт известный сигнал для сравнения.' },
  { id: 'bearing_press', stages: ['bearing_fit','shaft_align'], seconds: 5, hint: 'Пресс помогает посадить подшипник ровно, без перекоса.' },
  { id: 'feeler_gauge', stages: ['gear_mesh','shaft_align'], seconds: 5, hint: 'Щуп помогает измерить зазор перед окончательной затяжкой.' },
  { id: 'spring_scale', stages: ['spring_calibrate','belt'], seconds: 5, hint: 'Динамометр помогает оценить усилие натяжения.' },
  { id: 'puller', stages: ['bearing_fit','shaft_align','impeller_balance'], extraErrors: 1, hint: 'Съёмник снижает риск повредить детали при разборке.' },
  { id: 'hose_pliers', stages: ['hose_clamp','gasket_seal'], seconds: 5, hint: 'Клещи удерживают хомут во время регулировки.' },
  { id: 'airflow_meter', stages: ['fan_airflow','impeller_balance'], seconds: 5, hint: 'Анемометр помогает сравнить поток до и после регулировки.' },
  { id: 'grease_gun', stages: ['bearing_fit','gear_mesh'], extraErrors: 1, hint: 'Маслёнка облегчает плавную посадку движущихся деталей.' },
  { id: 'cleaning_brush', stages: ['drain_path','filter_flow','detergent_dose'], seconds: 5, hint: 'Щётки позволяют добраться до узких каналов.' },
];
export const STAGE_NAMES: Record<string, string> = {
  voltage_drop: 'падение напряжения', diode_bridge: 'диодный мост', capacitor_esr: 'проверка конденсатора', transistor_bias: 'смещение транзистора', relay_contacts: 'контакты реле', voltage_divider: 'делитель напряжения', thermistor_curve: 'термистор', opamp_clip: 'усилитель', logic_probe: 'логический пробник', i2c_bus: 'шина данных', crystal_clock: 'тактовый генератор', led_driver: 'драйвер светодиодов', audio_ground: 'земля аудиосхемы', sensor_pullup: 'датчик и подтяжка', reverse_polarity: 'полярность питания',
  pressure_valve: 'клапан давления', pump_prime: 'прокачка насоса', drain_path: 'сливной канал', hose_clamp: 'хомут шланга', gasket_seal: 'уплотнитель', impeller_balance: 'баланс крыльчатки', bearing_fit: 'посадка подшипника', gear_mesh: 'зацепление шестерён', shaft_align: 'центровка вала', fan_airflow: 'воздушный поток', heat_sink: 'прижим радиатора', spring_calibrate: 'калибровка пружины', detergent_dose: 'дозатор', float_switch: 'поплавковый выключатель', filter_flow: 'поток через фильтр', belt: 'натяжение ремня',
};
export const toolStages = (id: ToolId) => TOOL_SUPPORT.find(t => t.id === id)?.stages.map(s => STAGE_NAMES[s] ?? s).join(', ') ?? '';
export function toolSupport(tools: Campaign['tools'], stage: string) {
  const used = TOOL_SUPPORT.filter(t => tools?.[t.id] && t.stages.includes(stage));
  return { seconds: Math.min(8, used.reduce((sum, t) => sum + (t.seconds ?? 0), 0)), extraErrors: Math.min(1, used.reduce((sum, t) => sum + (t.extraErrors ?? 0), 0)), hints: used.map(t => t.hint) };
}

export interface SkillLevelDef { cost: number; title: string; effect: string }
export interface BranchDef { id: Branch; name: string; icon: string; about: string; levels: SkillLevelDef[] }

/** Уровень 0 бесплатный и есть с начала; покупаются уровни 1–3. Цены растут вместе с доходами районов. */
export const BRANCHES: BranchDef[] = [
  { id: 'attention', name: 'Внимательность', icon: 'eye', about: 'Сколько предметов вы замечаете в комнате и сколько узнаёте из каждого.', levels: [
    { cost: 0, title: 'Новичок', effect: 'Замечаете 2 предмета из 4. Карточка называет предмет, но не описывает его. Вопросы о предметах задать нельзя — не за что зацепиться.' },
    { cost: 450, title: 'Приметливый', effect: 'Замечаете 3 предмета. Карточка описывает, что вы видите, и открывает вопрос о предмете.' },
    { cost: 4500, title: 'Наблюдатель', effect: 'Замечаете все 4 предмета. На карточке появляется вывод мастера: о чём говорит находка и насколько ей можно верить.' },
    { cost: 14000, title: 'Сыщик', effect: 'Осмотр на 10 секунд дольше. Блокнот собирает найденные улики и ответы, карточки объясняют их влияние на торг.' },
  ] },
  { id: 'reading', name: 'Чтение людей', icon: 'chat', about: 'Как хорошо вы понимаете клиента в разговоре.', levels: [
    { cost: 0, title: 'Глухарь', effect: 'Видите только лицо клиента. Два вопроса.' },
    { cost: 600, title: 'Слушатель', effect: 'У ответа видна интонация клиента.' },
    { cost: 5500, title: 'Собеседник', effect: 'Третий вопрос в разговоре.' },
    { cost: 15000, title: 'Психолог', effect: 'Замечаете формальную манеру речи. Блокнот оценивает предел цены и шанс обнаружения наценки по собранным фактам.' },
  ] },
  { id: 'charisma', name: 'Харизма', icon: 'rep', about: 'Насколько охотно клиент принимает вашу цену.', levels: [
    { cost: 0, title: 'Молчун', effect: 'Без бонусов.' },
    { cost: 750, title: 'Вежливый', effect: 'Предел цены любого клиента +0,05.' },
    { cost: 6500, title: 'Убедительный', effect: 'Шанс, что клиент заметит наценку, −10 процентных пунктов.' },
    { cost: 18000, title: 'Обаятельный', effect: 'Если клиент отказал и во второй раз, можно один раз уговорить его на третье предложение.' },
  ] },
  { id: 'mastery', name: 'Мастерство', icon: 'wrench', about: 'Насколько уверенно вы чините.', levels: [
    { cost: 0, title: 'Подмастерье', effect: '20 секунд на каждый этап ремонта.' },
    { cost: 500, title: 'Ремонтник', effect: '+5 секунд на этап.' },
    { cost: 5000, title: 'Мастер', effect: 'Ещё +5 секунд и одна дополнительная допустимая ошибка.' },
    { cost: 15000, title: 'Золотые руки', effect: '+1 к качеству ремонта.' },
  ] },
];

export const branchDef = (b: Branch) => BRANCHES.find((x) => x.id === b)!;
export const level = (c: Campaign, b: Branch): number => c.skills?.[b] ?? 0;
export const nextCost = (c: Campaign, b: Branch): number | null => { const l = level(c, b); return l >= 3 ? null : branchDef(b).levels[l + 1].cost; };

export function buySkill(c: Campaign, b: Branch): boolean {
  const cost = nextCost(c, b);
  if (cost === null || c.money < cost || c.status !== 'board' || c.order) return false;
  c.money -= cost;
  c.skills = { ...defaultSkills(), ...c.skills, [b]: level(c, b) + 1 };
  c.spent = (c.spent ?? 0) + cost;
  return true;
}

export const defaultSkills = (): Record<Branch, number> => ({ attention: 0, reading: 0, charisma: 0, mastery: 0 });

/* ---------- эффекты навыков ---------- */

export const noticedCount = (c: Campaign) => [2, 3, 4, 4][level(c, 'attention')];
export const inspectionBonus = (c: Campaign) => (level(c, 'attention') >= 3 ? 10 : 0);
export const questionsLimit = (c: Campaign) => (level(c, 'reading') >= 2 ? 3 : 2);
export const showsTone = (c: Campaign) => level(c, 'reading') >= 1;
export const limitBonus = (c: Campaign) => (level(c, 'charisma') >= 1 ? 0.05 : 0);
export const noticeMinus = (c: Campaign) => (level(c, 'charisma') >= 2 ? 0.10 : 0);
export const canPersuade = (c: Campaign) => level(c, 'charisma') >= 3;
export const stageSeconds = (c: Campaign) => 20 + Math.min(2, level(c, 'mastery')) * 5;
export const extraErrors = (c: Campaign) => (level(c, 'mastery') >= 2 ? 1 : 0);
export const puzzleHints = (c: Campaign) => level(c, 'mastery') >= 3;

/* ---------- детали ---------- */

export interface PartDef { id: PartClass; name: string; about: string; mult: number }
export const PARTS: PartDef[] = [
  { id: 'used', name: 'Б/у с рынка', about: 'Дёшево, но в каждом четвёртом случае клиент позже позвонит с поломкой: бесплатный выезд и −3 к репутации.', mult: 0.5 },
  { id: 'normal', name: 'Обычные', about: 'Надёжные детали без сюрпризов.', mult: 1 },
  { id: 'original', name: 'Оригинальные', about: 'Дорого. Клиент доволен качеством: чаевые 10 % и +1 к репутации.', mult: 2.2 },
];
/** Цена одного комплекта деталей обычного класса по районам. */
export const KIT_BASE = [80, 200, 300, 600, 700];
export const kitPrice = (locIdx: number, cls: PartClass) => Math.round(KIT_BASE[locIdx] * PARTS.find((p) => p.id === cls)!.mult / 10) * 10;
/** Если деталей нет с собой — купить у ближайшего магазина с наценкой. */
export const urgentMarkup = 1.6;

/** Конкретный расходник для каждой неисправности. Класс качества выбирается отдельно. */
export const COMPONENTS = [
  { id: 'thermal_fuse', name: 'Термопредохранитель', device: 'kettle', fault: 0, factor: 1 },
  { id: 'contact_cleaner', name: 'Очиститель контактов', device: 'kettle', fault: 1, factor: 0.8 },
  { id: 'door_switch', name: 'Микровыключатель дверцы', device: 'microwave', fault: 0, factor: 1.1 },
  { id: 'glass_fuse', name: 'Плавкий предохранитель', device: 'microwave', fault: 1, factor: 0.8 },
  { id: 'thermal_paste', name: 'Термопаста', device: 'laptop', fault: 0, factor: 0.9 },
  { id: 'keyboard_cable', name: 'Шлейф клавиатуры', device: 'laptop', fault: 1, factor: 1.1 },
  { id: 'capacitor', name: 'Конденсатор блока питания', device: 'tv', fault: 0, factor: 1 },
  { id: 'led_strip', name: 'Планка подсветки', device: 'tv', fault: 1, factor: 1.3 },
  { id: 'pump_filter', name: 'Фильтр насоса', device: 'washer', fault: 0, factor: 0.9 },
  { id: 'level_sensor', name: 'Датчик уровня воды', device: 'washer', fault: 1, factor: 1.2 },
  { id: 'thermostat', name: 'Термостат', device: 'fridge', fault: 0, factor: 1.2 },
  { id: 'start_relay', name: 'Пусковое реле', device: 'fridge', fault: 1, factor: 1.1 },
  { id: 'antenna_cable', name: 'Антенный кабель', device: 'speaker', fault: 0, factor: 0.9 },
  { id: 'mic_mesh', name: 'Сетка микрофона', device: 'speaker', fault: 1, factor: 0.8 },
  { id: 'spray_nozzle', name: 'Форсунки разбрызгивателя', device: 'dishwasher', fault: 0, factor: 1 },
  { id: 'heater_contact', name: 'Контакты нагревателя', device: 'dishwasher', fault: 1, factor: 1.1 },
  { id: 'coil_cleaner', name: 'Очиститель теплообменника', device: 'aircon', fault: 0, factor: 1 },
  { id: 'temp_sensor', name: 'Датчик температуры', device: 'aircon', fault: 1, factor: 1.2 },
  { id: 'lens_spacer', name: 'Комплект юстировки линз', device: 'vr', fault: 0, factor: 1 },
  { id: 'display_cable', name: 'Шлейф дисплея', device: 'vr', fault: 1, factor: 1.2 },
  { id: 'descaler', name: 'Средство от накипи', device: 'coffee', fault: 0, factor: 0.8 },
  { id: 'pressure_valve', name: 'Регулятор давления помпы', device: 'coffee', fault: 1, factor: 1.3 },
  { id: 'drive_belt', name: 'Приводной ремень', device: 'tennis', fault: 0, factor: 1.2 },
  { id: 'motor_wire', name: 'Провод двигателя', device: 'tennis', fault: 1, factor: 0.9 },
  { id: 'main_brush', name: 'Щётка робота-пылесоса', device: 'robovac', fault: 0, factor: 1 },
  { id: 'cliff_sensor', name: 'Датчик перепада высоты', device: 'robovac', fault: 1, factor: 1.2 },
  { id: 'feed_roller', name: 'Ролик подачи бумаги', device: 'printer', fault: 0, factor: 1 },
  { id: 'paper_sensor', name: 'Датчик бумаги', device: 'printer', fault: 1, factor: 1.1 },
  { id: 'projector_lamp', name: 'Лампа проектора', device: 'projector', fault: 0, factor: 1.5 },
  { id: 'fan_filter', name: 'Фильтр вентилятора', device: 'projector', fault: 1, factor: 0.9 },
] as const;
export type ComponentId = typeof COMPONENTS[number]['id'];
export type ComponentDef = typeof COMPONENTS[number];
export const requiredComponent = (deviceId: string, faultIdx: number): ComponentDef | undefined => COMPONENTS.find(p => p.device === deviceId && p.fault === faultIdx);
export function componentPrice(locIdx: number, id: ComponentId, cls: PartClass): number {
  const item = COMPONENTS.find(p => p.id === id);
  // Точный расходник дешевле универсального комплекта, но пригоден только конкретной поломке.
  return item ? Math.max(10, Math.round(kitPrice(locIdx, cls) * item.factor * 0.65 / 10) * 10) : 0;
}
export const componentStock = (c: Campaign, id: ComponentId, cls: PartClass): number => c.components?.[id]?.[cls] ?? 0;
export function buyComponent(c: Campaign, id: ComponentId, cls: PartClass, n = 1): boolean {
  if (c.status !== 'board' || c.order || !Number.isInteger(n) || n <= 0 || !COMPONENTS.some(p => p.id === id) || !PARTS.some(p => p.id === cls)) return false;
  const cost = componentPrice(c.locIdx, id, cls) * n;
  if (c.money < cost) return false;
  c.money -= cost;
  c.spent = (c.spent ?? 0) + cost;
  c.components = { ...c.components, [id]: { ...c.components?.[id], [cls]: componentStock(c, id, cls) + n } };
  return true;
}

export function buyParts(c: Campaign, cls: PartClass, n = 1): boolean {
  if (c.status !== 'board' || c.order || !Number.isInteger(n) || n <= 0 || !PARTS.some(p => p.id === cls)) return false;
  const cost = kitPrice(c.locIdx, cls) * n;
  if (c.money < cost) return false;
  c.money -= cost;
  c.parts = { ...defaultParts(), ...c.parts, [cls]: (c.parts?.[cls] ?? 0) + n };
  c.spent = (c.spent ?? 0) + cost;
  return true;
}
export const defaultParts = (): Record<PartClass, number> => ({ used: 0, normal: 2, original: 0 });

/* ---------- качество ремонта ---------- */

/** Качество 1–5: класс детали, чистота ремонта и мастерство. */
export function repairQuality(cls: PartClass, failures: number, errors: number, masteryLvl: number, fast = false): number {
  let q = cls === 'used' ? 2 : cls === 'normal' ? 3 : 4;
  if (failures === 0 && errors === 0) q += 1;
  if (failures > 0) q -= 1;
  if (masteryLvl >= 3) q += 1;
  if (fast && failures === 0) q += 1;
  return Math.max(1, Math.min(5, q));
}
export const QUALITY_NAMES = ['', 'халтура', 'на скорую руку', 'нормально', 'добротно', 'на совесть'];
