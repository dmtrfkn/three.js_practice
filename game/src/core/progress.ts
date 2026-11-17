// Развитие мастера: навыки, детали, качество ремонта, гарантийные случаи.
// Источник: docs/«Развитие мастера и экономика».
import type { Campaign } from './types';

export type Branch = 'attention' | 'reading' | 'charisma' | 'mastery';
export type PartClass = 'used' | 'normal' | 'original';
export type ToolId = 'multimeter' | 'screwdrivers' | 'soldering' | 'flashlight' | 'manuals';

export const TOOLS: { id: ToolId; name: string; cost: number; about: string }[] = [
  { id: 'multimeter', name: 'Хороший мультиметр', cost: 1200, about: 'Помогает найти обрыв и неисправный блок при диагностике.' },
  { id: 'screwdrivers', name: 'Набор отвёрток', cost: 900, about: 'Облегчает разборку и работу с крепежом.' },
  { id: 'soldering', name: 'Паяльная станция', cost: 2500, about: 'Помогает аккуратнее паять соединения.' },
  { id: 'flashlight', name: 'Фонарик', cost: 700, about: 'Помогает заметить скрытые винты.' },
  { id: 'manuals', name: 'Сервисные мануалы', cost: 1800, about: 'Подсказывают при работе с прошивкой и сервисным меню.' },
];

export function buyTool(c: Campaign, id: ToolId): boolean {
  const tool = TOOLS.find(t => t.id === id);
  if (!tool || c.status !== 'board' || c.order || c.tools?.[id] || c.money < tool.cost) return false;
  c.money -= tool.cost;
  c.spent = (c.spent ?? 0) + tool.cost;
  c.tools = { ...c.tools, [id]: true };
  return true;
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
