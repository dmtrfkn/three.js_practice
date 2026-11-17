// Блокнот содержит только выводы из осмотренных предметов и заданных вопросов.
import { ALL_ITEMS } from './content';
import { PARAMS, type Level } from './params';
import { noticeChance } from './rules';
import type { Order } from './types';

type Trait = 'budget' | 'knowledge' | 'urgency';
type Evidence = { values: Level[]; source: string };
const all: Level[] = [0, 1, 2];
const labels: Record<Trait, string[]> = {
  budget: ['экономный', 'средний', 'высокий'],
  knowledge: ['начинающий', 'знаком с основами', 'разбирается в технике'],
  urgency: ['не срочно', 'в течение недели', 'нужно сегодня'],
};

export interface ClientProfile {
  facts: { label: string; value: string; source: string }[];
  limit: [number, number];
  notice: [number, number];
  hasEvidence: boolean;
}

export function clientProfile(o: Order, multiplier: number): ClientProfile {
  const known: Partial<Record<Trait, Evidence>> = {};
  const add = (trait: Trait, values: Level[], source: string) => {
    const old = known[trait];
    const intersection = old ? old.values.filter(v => values.includes(v)) : values;
    if (intersection.length) known[trait] = { values: intersection, source: old ? `${old.source}; ${source}` : source };
  };
  if (o.asked.includes('base_urgency')) add('urgency', [o.client.urgency], 'ответ о сроках');
  if (o.asked.includes('base_knowledge')) add('knowledge', [o.client.knowledge], 'ответ о технике');
  for (const id of o.inspected) {
    const item = ALL_ITEMS[id];
    if (!item) continue;
    if (item.kind === 'reliable' && item.category && item.level !== undefined && ((o.sk?.attention ?? 0) >= 2 || o.asked.includes(id))) {
      add(item.category, [item.level], `находка «${item.title}»`);
    }
    if (item.kind === 'ambiguous' && item.ambKey && o.asked.includes(id)) {
      const trait = item.ambKey;
      add(trait, o.client[trait] === 2 ? [2] : [0, 1], `ответ о предмете «${item.title}»`);
    }
  }
  const facts = (['budget', 'knowledge', 'urgency'] as Trait[]).filter(k => known[k]).map(k => ({
    label: { budget: 'Бюджет', knowledge: 'Опыт', urgency: 'Срок' }[k],
    value: known[k]!.values.map(v => labels[k][v]).join(' / '),
    source: known[k]!.source,
  }));
  const budgets = known.budget?.values ?? all;
  const urgencies = known.urgency?.values ?? all;
  const moods = (o.sk?.reading ?? 0) >= 1 ? [o.mood] : all;
  const charisma = (o.sk?.charisma ?? 0) >= 1 ? 0.05 : 0;
  const limits = budgets.flatMap(b => urgencies.flatMap(u => moods.map(m => PARAMS.budgetBase[b] + PARAMS.moodDelta[m] + (u === 2 ? PARAMS.urgencyHighDelta : 0) + charisma)));
  const reduction = (o.sk?.charisma ?? 0) >= 2 && multiplier > PARAMS.noticeFreeUpTo ? 0.1 : 0;
  const chances = (known.knowledge?.values ?? all).map(k => Math.max(0, noticeChance(multiplier, k) - reduction));
  return { facts, limit: [Math.min(...limits), Math.max(...limits)], notice: [Math.min(...chances), Math.max(...chances)], hasEvidence: facts.length > 0 };
}
