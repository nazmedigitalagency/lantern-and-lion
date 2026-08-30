// Inventory and Cosmetic Purchase Service
//
// Manages owned items for each child/teen profile, handles purchases with
// coins or gems from `wallet-service`, and prevents duplicate purchases.

import { awardCoins, awardGems, getWallet, spendCoins } from '../lib/economy/wallet-service';
import { getItem } from './catalog';
import { readEquipment, saveEquipment } from './storage';
import type { CharacterEquipment, EquipmentItem, ItemRarity } from './types';

const INVENTORY_KEY = 'lanternLionInventory';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readAllInventories(): Record<string, string[]> {
  return safeParse<Record<string, string[]>>(localStorage.getItem(INVENTORY_KEY), {});
}

function writeAllInventories(inventories: Record<string, string[]>): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventories));
}

// Starter / default items that every player owns initially
export const STARTER_OWNED_ITEMS: string[] = [
  'starter-cap',
  'starter-tunic',
  'starter-sandals',
  'starter-satchel',
  'starter-lantern',
  'scripture-band',
  'emote-wave',
];

/**
 * Returns all item IDs owned by this player.
 */
export function getOwnedItemIds(profileId: number): string[] {
  const inventories = readAllInventories();
  const owned = inventories[profileId];
  if (!owned) {
    inventories[profileId] = [...STARTER_OWNED_ITEMS];
    writeAllInventories(inventories);
    return [...STARTER_OWNED_ITEMS];
  }
  return owned;
}

/**
 * Checks if a player owns a specific item.
 */
export function isItemOwned(profileId: number, itemId: string): boolean {
  const owned = getOwnedItemIds(profileId);
  return owned.includes(itemId) || STARTER_OWNED_ITEMS.includes(itemId);
}

export type PurchaseResult =
  | { success: true; message: string; remainingCoins: number; remainingGems: number }
  | { success: false; error: string };

/**
 * Buys a cosmetic item from the shop with coins or gems.
 */
export function purchaseItem(profileId: number, item: EquipmentItem): PurchaseResult {
  if (isItemOwned(profileId, item.id)) {
    return { success: false, error: 'You already own this item!' };
  }

  const wallet = getWallet(profileId);
  const costCoins = item.priceCoins ?? 0;
  const costGems = item.priceGems ?? 0;

  if (costGems > 0) {
    if (wallet.gems < costGems) {
      return { success: false, error: `You need ${costGems} Gems to unlock this item.` };
    }
  }

  if (costCoins > 0) {
    if (wallet.coins < costCoins) {
      return { success: false, error: `You need ${costCoins} Lantern Coins to purchase this item.` };
    }
  }

  // Deduct currencies
  if (costCoins > 0) {
    const spendRes = spendCoins(profileId, costCoins, 'challenge', `Purchased ${item.name}`);
    if (!spendRes) return { success: false, error: 'Insufficient coins.' };
  }

  if (costGems > 0) {
    // Deduct gems directly through negative award
    awardGems(profileId, -costGems, 'challenge', `Purchased ${item.name}`);
  }

  // Add to player inventory
  const inventories = readAllInventories();
  const currentOwned = inventories[profileId] || [...STARTER_OWNED_ITEMS];
  inventories[profileId] = Array.from(new Set([...currentOwned, item.id]));
  writeAllInventories(inventories);

  const updatedWallet = getWallet(profileId);
  return {
    success: true,
    message: `Unlocked ${item.name}!`,
    remainingCoins: updatedWallet.coins,
    remainingGems: updatedWallet.gems,
  };
}

/**
 * Grants an achievement or level reward cosmetic directly to player's inventory.
 */
export function grantRewardItem(profileId: number, itemId: string): boolean {
  const inventories = readAllInventories();
  const currentOwned = inventories[profileId] || [...STARTER_OWNED_ITEMS];
  if (!currentOwned.includes(itemId)) {
    inventories[profileId] = [...currentOwned, itemId];
    writeAllInventories(inventories);
    return true;
  }
  return false;
}
