// Local persistence adapter for the Character profile.
//
// Reuses the Adventure World's `readActiveProfile` / `loadWorldContext`
// (same child/teen identity, same moduleProgress + mastery data) so
// the Character feature is a view over the same progress record, not
// a second one. Only genuinely new state — appearance, equipped item
// ids, and a custom display name — gets its own keys here. Level and
// level-up detection now live in the wallet (`lib/economy`), which
// fires the moment XP crosses a threshold rather than guessing from
// "last level seen on this screen".

import { EQUIPMENT_SLOTS, getStarterItemForSlot } from './catalog';
import type { CharacterAppearance, CharacterEquipment } from './types';

export { hasActiveSession, loadWorldContext, readActiveProfile, type PlayerProfile } from '../adventure/storage';

const APPEARANCE_KEY = 'lanternLionCharacterAppearance';
const EQUIPMENT_KEY = 'lanternLionCharacterEquipment';
const NAME_KEY = 'lanternLionCharacterName';

const DEFAULT_APPEARANCE: CharacterAppearance = { skinTone: 'honey', hairStyle: 'curls', face: 'smile' };

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function defaultEquipment(): CharacterEquipment {
  const equipment: CharacterEquipment = {};
  for (const slot of EQUIPMENT_SLOTS) {
    const starter = getStarterItemForSlot(slot.id);
    if (starter) equipment[slot.id] = starter.id;
  }
  return equipment;
}

export function readAppearance(profileId: number): CharacterAppearance {
  const byChild = safeParse<Record<string, CharacterAppearance>>(localStorage.getItem(APPEARANCE_KEY), {});
  return byChild[profileId] || DEFAULT_APPEARANCE;
}

export function saveAppearance(profileId: number, appearance: CharacterAppearance): void {
  const byChild = safeParse<Record<string, CharacterAppearance>>(localStorage.getItem(APPEARANCE_KEY), {});
  byChild[profileId] = appearance;
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(byChild));
}

export function readEquipment(profileId: number): CharacterEquipment {
  const byChild = safeParse<Record<string, CharacterEquipment>>(localStorage.getItem(EQUIPMENT_KEY), {});
  if (!byChild[profileId]) {
    const seeded = defaultEquipment();
    byChild[profileId] = seeded;
    localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(byChild));
    return seeded;
  }
  return byChild[profileId];
}

export function saveEquipment(profileId: number, equipment: CharacterEquipment): void {
  const byChild = safeParse<Record<string, CharacterEquipment>>(localStorage.getItem(EQUIPMENT_KEY), {});
  byChild[profileId] = equipment;
  localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(byChild));
}

export function readCharacterName(profileId: number, fallbackName: string): string {
  const byChild = safeParse<Record<string, string>>(localStorage.getItem(NAME_KEY), {});
  return byChild[profileId] || fallbackName;
}

export function saveCharacterName(profileId: number, name: string): void {
  const byChild = safeParse<Record<string, string>>(localStorage.getItem(NAME_KEY), {});
  byChild[profileId] = name;
  localStorage.setItem(NAME_KEY, JSON.stringify(byChild));
}
