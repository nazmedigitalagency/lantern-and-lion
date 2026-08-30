// Character profile data model.
//
// Reuses `UnlockRequirement` from the Adventure World feature (level /
// region-complete / quest-complete / always) instead of inventing a
// second unlock vocabulary — an item can be gated behind exactly the
// same conditions a region or quest can.

import type { UnlockRequirement } from '../adventure/types';

export type EquipmentSlot = 'headwear' | 'clothing' | 'shoes' | 'accessory' | 'special';
export type AppearanceSlot = 'skinTone' | 'hairStyle' | 'face';

export type EquipmentItem = {
  id: string;
  slot: EquipmentSlot;
  name: string;
  /** Placeholder visual until real illustration assets exist. */
  emoji: string;
  unlockRequirement: UnlockRequirement[];
  /** Marks an item that represents a companion creature rather than worn gear. */
  isCompanion?: boolean;
};

export type AppearanceOption = {
  id: string;
  slot: AppearanceSlot;
  name: string;
  /** CSS color for skin tone; an emoji/glyph for hair + face. */
  value: string;
};

export type CharacterAppearance = {
  skinTone: string;
  hairStyle: string;
  face: string;
};

export type CharacterEquipment = Partial<Record<EquipmentSlot, string>>;

export type ItemStatus = 'locked' | 'unlocked' | 'equipped';
