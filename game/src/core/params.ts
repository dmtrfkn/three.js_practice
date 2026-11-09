// Все числа из «Реестра параметров игры» (docs/«Реестр параметров игры»).
// Правка баланса — только здесь.

export type Level = 0 | 1 | 2; // низкий / средний / высокий
export type Tier = 0 | 1 | 2;  // дешёвое / среднее / дорогое устройство

export const PARAMS = {
  startMoney: 0,
  startRep: 0,
  repMin: -20,
  repMax: 20,
  winRep: 10,
  maxViolations: 2,
  callsPerLocation: 3,
  offersPerLocation: 5,
  offerTiers: [0, 0, 1, 1, 2] as Tier[],

  inspectionSeconds: 30,
  questionsToAsk: 2,

  slider: { min: 0.75, max: 2.0, step: 0.05 },

  // предел согласия L = P × (b + δн + δс)
  budgetBase: [1.10, 1.35, 1.65],
  moodDelta: [-0.10, 0, 0.10],
  urgencyHighDelta: 0.10,

  // обнаружение наценки
  noticeFreeUpTo: 1.20,
  noticeK: [10, 35, 60],
  noticeSlope: 50,
  noticeCap: 95,
  goodMoodAcceptChance: 0.30,
  hardDemandChance: [0, 0.40, 0.65],
  hardDemandCap: [1, 0.95, 0.90], // C = cap × P (для среднего/высокого знания)

  // инспектор
  inspectorFirstCall: 0,
  inspectorBase: 20,
  inspectorMin: 5,
  inspectorMax: 40,
  inspectorSafeMult: 1.20,
  inspectorFineFactor: 2,
  inspectorRepPenalty: -8,
  inspectorFormalChance: 0.80,
  inspectorItemChance: 0.85,
  regularFormalChance: 0.20,
  regularItemChance: 0.20,
  complaintInspectorBonus: 10,

  // скандальный клиент
  scandalChance: [0.05, 0.05, 0.10, 0.15, 0.15],
  scandalTriggerMult: 1.30,
  scandalOmenChance: 0.70,

  // репутация
  rep: { cleanFirst: 2, discountFirst: 3, objectedFirst: 1, retry: 0, left: -4, complaint: -6 },
  discountMult: 0.90,

  // распределения клиентов
  budgetByLocation: [
    [0.60, 0.35, 0.05],
    [0.50, 0.40, 0.10],
    [0.30, 0.50, 0.20],
    [0.10, 0.35, 0.55],
    [0.10, 0.40, 0.50],
  ],
  knowledgeByTier: [
    [0.60, 0.30, 0.10],
    [0.30, 0.50, 0.20],
    [0.10, 0.40, 0.50],
  ],
  urgencyDist: [0.30, 0.40, 0.30],
  moodDist: [0.20, 0.60, 0.20],
  urgencyHintChance: 0.50,
  omenChance: 0.50,

  suspiciousKindByLocation: [
    [0.60, 0.30, 0.10],
    [0.50, 0.35, 0.15],
    [0.35, 0.40, 0.25],
    [0.20, 0.40, 0.40],
    [0.10, 0.30, 0.60],
  ],

  // ремонт
  repairSeconds: 20,
  failedPaymentFactor: 0.80,
} as const;

export interface LocationDef {
  id: string;
  name: string;
  address: string;
  quota: number;
  moveCost: number;      // 0 у офиса — дальше мастерская
  devices: [string, string, string]; // id устройств: дешёвое, среднее, дорогое
}

export const LOCATIONS: LocationDef[] = [
  { id: 'dorm',   name: 'Общежитие',  address: 'общежитие на Лесной, 14',      quota: 8000,   moveCost: 1000, devices: ['kettle', 'microwave', 'laptop'] },
  { id: 'khr',    name: 'Хрущёвка',   address: 'ул. Гагарина, 7, кв. 31',      quota: 24000,  moveCost: 3000, devices: ['tv', 'washer', 'fridge'] },
  { id: 'new',    name: 'Новостройка', address: 'ЖК «Солнечный», корп. 3',      quota: 48000,  moveCost: 5000, devices: ['speaker', 'dishwasher', 'aircon'] },
  { id: 'elite',  name: 'Элитный ЖК', address: 'ЖК «Резиденция», пентхаус',    quota: 94000,  moveCost: 8000, devices: ['vr', 'coffee', 'tennis'] },
  { id: 'office', name: 'Офис',       address: 'БЦ «Меридиан», 12 этаж',       quota: 150000, moveCost: 0,    devices: ['robovac', 'printer', 'projector'] },
];

export const MINIGAME_DIFFICULTY = {
  swapParts:     [3, 3, 4, 4, 5],
  wires:         [4, 5, 5, 6, 7],
  calibHits:     [3, 3, 4, 4, 4],
  calibZone:     [0.20, 0.18, 0.16, 0.14, 0.12],
  calibPeriod:   [1.6, 1.5, 1.4, 1.3, 1.2],
  screws:        [3, 4, 4, 5, 5],
  dirt:          [2, 2, 3, 3, 4],
  maxErrors:     { swap: 1, wires: 2, calib: 2, clean: 2 }, // провал на (maxErrors+1)-й ошибке
};
