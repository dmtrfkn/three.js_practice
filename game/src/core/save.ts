import type { Campaign } from './types';
import { onLoad } from './campaign';

const KEY = 'master-na-den.save.v1';
const SETTINGS_KEY = 'master-na-den.settings.v1';

export interface Settings { volume: number; sensitivity: number }
export const DEFAULT_SETTINGS: Settings = { volume: 1, sensitivity: 1 };

function store(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}

export function saveCampaign(c: Campaign): void {
  try { store()?.setItem(KEY, JSON.stringify(c)); } catch { /* квота или приватный режим */ }
}

export function loadCampaign(): Campaign | null {
  try {
    const raw = store()?.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Campaign;
    if (c.version !== 1) return null;
    onLoad(c);
    return c;
  } catch { return null; }
}

export function hasSave(): boolean {
  try { return !!store()?.getItem(KEY); } catch { return false; }
}

export function clearSave(): void {
  try { store()?.removeItem(KEY); } catch { /* ignore */ }
}

export function loadSettings(): Settings {
  try {
    const raw = store()?.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(s: Settings): void {
  try { store()?.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
