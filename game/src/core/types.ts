import type { Level, Tier } from './params';
import type { ItemKind, Phrase } from './content';
import type { RngState } from './rng';

export interface ClientTraits {
  name: string;
  budget: Level;
  knowledge: Level;
  urgency: Level;
  mood: Level;
  scandal: boolean;
}

export type Omen = { type: 'budget' | 'knowledge'; level: Level } | { type: 'scandal' };

export interface Offer {
  id: string;
  no: number;
  tier: Tier;
  deviceId: string;
  faultIdx: 0 | 1;
  client: ClientTraits;
  urgencyHint: boolean;
  omen: Omen | null;
  taken: boolean;
}

export interface RoomItem {
  id: string;          // id из каталога (B_LOW, AMB_LAPTOP, SUS_PHONE, mug…)
  kind: ItemKind;
  slot: 0 | 1 | 2 | 3; // точки A–D
  formalVariant: 0 | 1;
}

export type Stage = 'inspect' | 'dialogue' | 'diagnosis' | 'price' | 'repair' | 'result';

export type ReactionKind = 'accept' | 'soft' | 'hard' | 'complaint' | 'leave' | 'acceptSecond';

export interface Reaction {
  kind: ReactionKind;
  line: Phrase;
  m: number;
  price: number;
  detected?: boolean;
}

export interface Order {
  offerId: string;
  no: number;
  locIdx: number;
  deviceId: string;
  faultIdx: 0 | 1;
  P: number;
  client: ClientTraits;
  role: 'regular' | 'inspector';
  formal: boolean;
  presetIdx: 0 | 1;
  items: RoomItem[];
  stage: Stage;
  // осмотр
  inspectEndsAt: number | null;
  inspected: string[];
  openCard: string | null;
  // диалог
  asked: string[];
  openAnswer: string | null;
  // цена
  mood: Level;
  reactions: Reaction[];
  ceilingC: number | null;   // скрытый предел второго предложения, ₽
  agreedM: number | null;
  agreedPrice: number | null;
  objected: boolean;
  // ремонт
  attempts: number;          // начатые попытки
  failures: number;
  attemptActive: boolean;
  repaired: boolean;
  // итог
  outcome: 'paid' | 'left' | 'complaint' | null;
  payment: number;
  fine: number;
  repDelta: number;
  violation: boolean;
  applied: boolean;
}

export interface OrderSummary {
  no: number;
  locIdx: number;
  deviceId: string;
  client: string;
  role: 'regular' | 'inspector';
  outcome: 'paid' | 'left' | 'complaint';
  P: number;
  agreedPrice: number | null;
  payment: number;
  fine: number;
  repDelta: number;
  violation: boolean;
}

export type CampaignStatus = 'board' | 'order' | 'mustMove' | 'gameover' | 'victory';
export type Ending = 'money' | 'rep' | 'arrest' | 'win';

export interface Campaign {
  version: 1;
  seed: number;
  rng: RngState;
  locIdx: number;
  money: number;
  rep: number;
  violations: number;
  callIndex: number;    // сколько заказов взято за кампанию
  callsUsed: number;    // в текущей локации
  orderCounter: number;
  offers: Offer[];
  order: Order | null;
  inspectorBonus: number;
  status: CampaignStatus;
  ending: Ending | null;
  history: OrderSummary[];
  locationStartMoney: number;
  tutorialSeen: boolean;
}
