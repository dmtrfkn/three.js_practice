import { describe, expect, it } from 'vitest';
import { newCampaign, takeOffer } from '../../src/core/campaign';
import { clientProfile } from '../../src/core/profile';
import { ALL_ITEMS } from '../../src/core/content';

describe('блокнот клиента', () => {
  it('не раскрывает скрытые характеристики без улик и сужает диапазоны после ответов', () => {
    const c = newCampaign(12);
    c.skills = { attention: 3, reading: 3, charisma: 0, mastery: 0 };
    const o = takeOffer(c, c.offers[0].id);
    const unknown = clientProfile(o, 1.4);
    expect(unknown.facts).toHaveLength(0);
    expect(unknown.notice[0]).toBeLessThan(unknown.notice[1]);
    o.asked.push('base_knowledge', 'base_urgency');
    const answered = clientProfile(o, 1.4);
    expect(answered.facts.map(f => f.label)).toEqual(['Опыт', 'Срок']);
    expect(answered.notice[0]).toBeCloseTo(answered.notice[1]);
    expect(answered.limit[1] - answered.limit[0]).toBeLessThanOrEqual(unknown.limit[1] - unknown.limit[0]);
  });

  it('не превращает неоднозначную вещь в надёжное свидетельство без вопроса', () => {
    const c = newCampaign(7);
    c.skills = { attention: 3, reading: 3, charisma: 0, mastery: 0 };
    const o = takeOffer(c, c.offers[0].id);
    const id = Object.keys(ALL_ITEMS).find(key => ALL_ITEMS[key].kind === 'ambiguous')!;
    o.inspected = [id];
    expect(clientProfile(o, 1.3).facts).toHaveLength(0);
    o.asked = [id];
    expect(clientProfile(o, 1.3).facts).toHaveLength(1);
  });

  it('безопасно читает заказ из старого сохранения без навыков', () => {
    const c = newCampaign(8);
    const o = takeOffer(c, c.offers[0].id);
    delete o.sk;
    expect(() => clientProfile(o, 1.4)).not.toThrow();
    expect(clientProfile(o, 1.4).facts).toHaveLength(0);
  });
});
