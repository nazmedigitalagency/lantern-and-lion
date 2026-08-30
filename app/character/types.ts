// Character profile data model.
//
// Reuses `UnlockRequirement` from the Adventure World feature (level /
// region-complete / quest-complete / always) instead of inventing a
// second unlock vocabulary — an item can be gated behind exactly the
// same conditions a region or quest can.

import type { UnlockRequirement } from '../adventure/types';

export type EquipmentSlot =
  | 'headwear'
  | 'clothing'
  | 'shoes'
  | 'accessory'
  | 'backpack'
  | 'lantern'
  | 'pet'
  | 'emote'
  | 'special';

export type AppearanceSlot = 'skinTone' | 'hairStyle' | 'face';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type EquipmentItem = {
  id: string;
  slot: EquipmentSlot;
  name: string;
  description?: string;
  emoji: string;
  rarity?: ItemRarity;
  priceCoins?: number;
  priceGems?: number;
  unlockRequirement: UnlockRequirement[];
  isCompanion?: boolean;
};

export type AppearanceOption = {
  id: string;
  slot: AppearanceSlot;
  name: string;
  /** CSS color for skin tone; an id/glyph for hair + face. */
  value: string;
  rarity?: ItemRarity;
  priceCoins?: number;
  priceGems?: number;
  unlockRequirement?: UnlockRequirement[];
};

export type CharacterAppearance = {
  skinTone: string;
  hairStyle: string;
  face: string;
  gender?: 'male' | 'female';
};

export type CharacterEquipment = Partial<Record<EquipmentSlot, string>>;

export type ItemStatus = 'locked' | 'unlocked' | 'owned' | 'equipped';

export type InventoryRecord = {
  profileId: number;
  ownedItemIds: string[];
  equipped: CharacterEquipment;
  updatedAt: string;
};
