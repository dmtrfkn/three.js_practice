import { describe, expect, it } from 'vitest';
import { newCampaign, takeOffer, finishOrder, onLoad, openWorkshop } from '../../src/core/campaign';
import { buyParts, buyTool, repairQuality, TOOLS } from '../../src/core/progress';
import { LOCATIONS, PARAMS } from '../../src/core/params';
import { makeRng, next } from '../../src/core/rng';

describe('мастерская', () => {
  it('покупает инструмент один раз, учитывает стоимость и сохраняет его между заказами', () => {
    const c = newCampaign(1);
    c.money = 5000;
    const price = TOOLS.find(t => t.id === 'multimeter')!.cost;
    expect(buyTool(c, 'multimeter')).toBe(true);
    expect(c.money).toBe(5000 - price);
    expect(c.spent).toBe(price);
    expect(buyTool(c, 'multimeter')).toBe(false);
    const restored = JSON.parse(JSON.stringify(c));
    takeOffer(restored, restored.offers[0].id);
    expect(restored.tools.multimeter).toBe(true);
    expect(buyTool(restored, 'flashlight')).toBe(false);
  });

  it('не тратит деньги на недоступные или некорректные покупки', () => {
    const c = newCampaign(2);
    c.money = 100;
    expect(buyTool(c, 'soldering')).toBe(false);
    expect(buyParts(c, 'normal', -1)).toBe(false);
    expect(buyParts(c, 'normal', 0.5)).toBe(false);
    expect(c.money).toBe(100);
  });

  it('добавляет запас деталей к сохранениям, созданным до развития мастера', () => {
    const c = newCampaign(2);
    delete c.parts; delete c.skills; delete c.tools; delete c.warranty; delete c.news; delete c.spent;
    onLoad(c);
    expect(c.parts).toEqual({ used: 0, normal: 2, original: 0 });
    expect(c.skills).toEqual({ attention: 0, reading: 0, charisma: 0, mastery: 0 });
    expect(c.tools).toEqual({});
  });

  it('учитывает аккуратность, скорость и сорванные попытки в качестве', () => {
    expect(repairQuality('normal', 0, 0, 0, true)).toBe(5);
    expect(repairQuality('normal', 0, 1, 0, false)).toBe(3);
    expect(repairQuality('normal', 1, 0, 0, true)).toBe(2);
  });

  it('сохраняет гарантию при переезде и считает стоимость исходного района один раз', () => {
    const c = newCampaign(3);
    c.locIdx = 1;
    c.money = 1000;
    c.warranty = [{ due: 1, client: 'Иван', deviceId: 'kettle', locIdx: 0 }];
    takeOffer(c, c.offers[0].id);
    expect(c.money).toBe(920);
    expect(c.rep).toBe(-3);
    expect(c.warranty).toEqual([]);
    expect(c.news).toHaveLength(1);
    expect(c.spent).toBe(80);
  });

  it('учитывает гарантию до броска инспектора, не отменяя выбранный заказ', () => {
    const c = newCampaign(3);
    c.callIndex = 1;
    c.money = 50;
    c.warranty = [{ due: 2, client: 'Иван', deviceId: 'kettle', locIdx: 0 }];
    let seed = 1;
    while (next(makeRng(seed)) < 0.20 || next(makeRng(seed)) >= 0.23) seed++;
    c.rng = makeRng(seed);
    const offer = c.offers[0];
    const order = takeOffer(c, offer.id);
    expect(order.role).toBe('inspector');
    expect(order.offerId).toBe(offer.id);
    expect(offer.taken).toBe(true);
    expect(c.callsUsed).toBe(1);
    expect(c.money).toBe(-30);
    expect(c.rep).toBe(-3);
  });

  it('не списывает гарантию, если выбранный заказ недоступен', () => {
    const c = newCampaign(3);
    c.money = 100;
    c.warranty = [{ due: 1, client: 'Иван', deviceId: 'kettle', locIdx: 0 }];
    expect(() => takeOffer(c, 'missing')).toThrow();
    expect(c.money).toBe(100);
    expect(c.warranty).toHaveLength(1);
  });

  it('учитывает будущую гарантию перед открытием мастерской и повторно не списывает её', () => {
    const c = newCampaign(4);
    c.locIdx = LOCATIONS.length - 1;
    c.money = LOCATIONS[c.locIdx].quota;
    c.rep = PARAMS.winRep;
    c.warranty = [{ due: 99, client: 'Иван', deviceId: 'kettle', locIdx: 0 }];
    openWorkshop(c);
    expect(c.status).toBe('board');
    expect(c.money).toBe(LOCATIONS[c.locIdx].quota - 80);
    expect(c.rep).toBe(PARAMS.winRep - 3);
    expect(c.warranty).toEqual([]);
    openWorkshop(c);
    expect(c.money).toBe(LOCATIONS[c.locIdx].quota - 80);
  });

  it('учитывает гарантию последнего заказа до выбора концовки', () => {
    const c = newCampaign(5);
    c.locIdx = LOCATIONS.length - 1;
    c.money = LOCATIONS[c.locIdx].quota;
    c.rep = PARAMS.winRep;
    c.callsUsed = PARAMS.callsPerLocation - 1;
    const order = takeOffer(c, c.offers[0].id);
    order.stage = 'result'; order.outcome = 'paid';
    c.warranty = [{ due: 99, client: 'Иван', deviceId: 'kettle', locIdx: 0 }];
    finishOrder(c);
    expect(c.status).toBe('gameover');
    expect(c.ending).toBe('money');
    expect(c.news?.[0]).toContain('Гарантийный случай');
  });
});
