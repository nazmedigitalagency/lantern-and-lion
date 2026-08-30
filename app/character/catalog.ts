import type { AppearanceOption, EquipmentItem } from './types';

// ── APPEARANCE ───────────────────────────────────────────────────
// Always available — free cosmetic choice, no unlock requirement.
// These are the base layers a real illustration system would later
// render instead of the CSS/emoji placeholder in <CharacterAvatar>.
export const appearanceOptions: AppearanceOption[] = [
  { id: 'amber', slot: 'skinTone', name: 'Amber', value: '#f0b986' },
  { id: 'sand', slot: 'skinTone', name: 'Sand', value: '#e8c9a0' },
  { id: 'honey', slot: 'skinTone', name: 'Honey', value: '#d9a066' },
  { id: 'walnut', slot: 'skinTone', name: 'Walnut', value: '#a86a3f' },
  { id: 'cocoa', slot: 'skinTone', name: 'Cocoa', value: '#6b4226' },

  { id: 'curls', slot: 'hairStyle', name: 'Curls', value: 'curls' },
  { id: 'waves', slot: 'hairStyle', name: 'Waves', value: 'waves' },
  { id: 'braids', slot: 'hairStyle', name: 'Braids', value: 'braids' },
  { id: 'short', slot: 'hairStyle', name: 'Short', value: 'short' },
  { id: 'coils', slot: 'hairStyle', name: 'Coils', value: 'coils' },
  { id: 'bald', slot: 'hairStyle', name: 'None', value: 'bald' },

  { id: 'smile', slot: 'face', name: 'Smile', value: '🙂' },
  { id: 'grin', slot: 'face', name: 'Big Grin', value: '😄' },
  { id: 'calm', slot: 'face', name: 'Calm', value: '😌' },
  { id: 'wonder', slot: 'face', name: 'Wonder', value: '😲' },
];

// ── EQUIPMENT ────────────────────────────────────────────────────
// Each item is unlocked via the same UnlockRequirement conditions the
// Adventure World already uses. Several are tied to the exact quest
// that also grants that quest's collectible, so a child's gear tells
// the story of what they've explored.
export const equipmentItems: EquipmentItem[] = [
  // Headwear
  { id: 'starter-cap', slot: 'headwear', name: 'Traveler’s Cap', emoji: '🧢', unlockRequirement: [{ type: 'always' }] },
  { id: 'scouts-hood', slot: 'headwear', name: 'Scout’s Hood', emoji: '🎽', unlockRequirement: [{ type: 'level', minLevel: 3 }] },
  { id: 'kingdom-crown', slot: 'headwear', name: 'Kingdom Crown', emoji: '👑', unlockRequirement: [{ type: 'region-complete', regionId: 'kingdom-of-israel', minQuestsCompleted: 3 }] },
  { id: 'guardian-halo', slot: 'headwear', name: 'Guardian’s Halo', emoji: '😇', unlockRequirement: [{ type: 'level', minLevel: 20 }] },

  // Clothing
  { id: 'starter-tunic', slot: 'clothing', name: 'Traveler’s Tunic', emoji: '👕', unlockRequirement: [{ type: 'always' }] },
  { id: 'wilderness-cloak', slot: 'clothing', name: 'Wilderness Cloak', emoji: '🧥', unlockRequirement: [{ type: 'region-complete', regionId: 'wilderness', minQuestsCompleted: 3 }] },
  { id: 'silver-robe', slot: 'clothing', name: 'Silver Kingdom Robe', emoji: '🥋', unlockRequirement: [{ type: 'level', minLevel: 10 }] },
  { id: 'golden-cloak', slot: 'clothing', name: 'Golden Guardian Cloak', emoji: '✨', unlockRequirement: [{ type: 'level', minLevel: 30 }] },

  // Shoes
  { id: 'starter-sandals', slot: 'shoes', name: 'Simple Sandals', emoji: '🩴', unlockRequirement: [{ type: 'always' }] },
  { id: 'adventurers-boots', slot: 'shoes', name: 'Adventurer’s Boots', emoji: '🥾', unlockRequirement: [{ type: 'level', minLevel: 5 }] },
  { id: 'runners-sandals', slot: 'shoes', name: 'Runner’s Sandals', emoji: '👟', unlockRequirement: [{ type: 'region-complete', regionId: 'galilee', minQuestsCompleted: 3 }] },

  // Accessories
  { id: 'garden-leaf-pin', slot: 'accessory', name: 'Garden Leaf Pin', emoji: '🍃', unlockRequirement: [{ type: 'quest-complete', questId: 'eden-2' }] },
  { id: 'shepherd-sling', slot: 'accessory', name: 'Shepherd’s Sling', emoji: '🪨', unlockRequirement: [{ type: 'quest-complete', questId: 'kingdom-of-israel-2' }] },
  { id: 'lantern-charm', slot: 'accessory', name: 'Lantern Charm', emoji: '🏮', unlockRequirement: [{ type: 'level', minLevel: 5 }] },
  { id: 'cross-pendant', slot: 'accessory', name: 'Cross Pendant', emoji: '✝️', unlockRequirement: [{ type: 'region-complete', regionId: 'jerusalem', minQuestsCompleted: 3 }] },

  // Special (includes the companion placeholder)
  { id: 'manna-basket-charm', slot: 'special', name: 'Manna Basket Charm', emoji: '🍞', unlockRequirement: [{ type: 'quest-complete', questId: 'wilderness-2' }] },
  { id: 'lost-sheep-companion', slot: 'special', name: 'Little Lost Sheep', emoji: '🐑', unlockRequirement: [{ type: 'quest-complete', questId: 'galilee-1' }], isCompanion: true },
  { id: 'tomb-light-halo', slot: 'special', name: 'Light of the Tomb', emoji: '✨', unlockRequirement: [{ type: 'quest-complete', questId: 'jerusalem-3' }] },
  { id: 'flame-of-faith-badge', slot: 'special', name: 'Flame of Faith Badge', emoji: '🔥', unlockRequirement: [{ type: 'quest-complete', questId: 'early-church-3' }] },
];

export const EQUIPMENT_SLOTS: { id: EquipmentItem['slot']; label: string }[] = [
  { id: 'headwear', label: 'Headwear' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'accessory', label: 'Accessories' },
  { id: 'special', label: 'Special items' },
];

export function getAppearanceOptionsForSlot(slot: AppearanceOption['slot']): AppearanceOption[] {
  return appearanceOptions.filter((option) => option.slot === slot);
}

export function getAppearanceOption(slot: AppearanceOption['slot'], id: string): AppearanceOption | undefined {
  return appearanceOptions.find((option) => option.slot === slot && option.id === id);
}

export function getItemsForSlot(slot: EquipmentItem['slot']): EquipmentItem[] {
  return equipmentItems.filter((item) => item.slot === slot);
}

export function getItem(itemId: string): EquipmentItem | undefined {
  return equipmentItems.find((item) => item.id === itemId);
}

export function getStarterItemForSlot(slot: EquipmentItem['slot']): EquipmentItem | undefined {
  return getItemsForSlot(slot).find((item) => item.unlockRequirement.some((req) => req.type === 'always'));
}
