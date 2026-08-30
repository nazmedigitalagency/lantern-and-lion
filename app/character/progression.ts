// Character progression service — pure functions only.
//
// Deliberately thin: almost everything here delegates to the Adventure
// World's already-tested requirement evaluator and region/quest data,
// so there is exactly one implementation of "is this unlocked yet" in
// the app. Character-specific state (appearance + equipped item ids)
// is passed in by the page component, same pattern as WorldContext.

import {
  describeRequirement,
  getCollectedCollectibles,
  getPlayerLevelInfo,
  getRegionStatus,
  getTotalQuestsCompleted,
  getTotalXpEarned,
  requirementsMet,
  type WorldContext,
} from '../adventure/progression';
import { getRegions } from '../adventure/world-data';
import { equipmentItems, getItemsForSlot } from './catalog';
import type { CharacterEquipment, EquipmentItem, EquipmentSlot, ItemStatus } from './types';

export { describeRequirement, getPlayerLevelInfo, getTotalXpEarned };
export type { WorldContext };

export function getItemStatus(item: EquipmentItem, ctx: WorldContext, equipment: CharacterEquipment): ItemStatus {
  if (equipment[item.slot] === item.id) return 'equipped';
  return requirementsMet(item.unlockRequirement, ctx) ? 'unlocked' : 'locked';
}

export function getItemsForSlotWithStatus(slot: EquipmentSlot, ctx: WorldContext, equipment: CharacterEquipment) {
  return getItemsForSlot(slot).map((item) => ({ item, status: getItemStatus(item, ctx, equipment) }));
}

/**
 * Items unlocked by reaching a level anywhere in (previousLevel, newLevel] —
 * a player can cross several level-gated unlocks in one jump (e.g.
 * finishing three quests at once), so the level-up reward callout must
 * catch all of them, not just an item gated at the exact new level.
 */
export function getItemsUnlockedInLevelRange(previousLevel: number, newLevel: number): EquipmentItem[] {
  return equipmentItems.filter((item) =>
    item.unlockRequirement.some((req) => req.type === 'level' && req.minLevel > previousLevel && req.minLevel <= newLevel)
  );
}

export function getRegionsDiscoveredCount(ctx: WorldContext): number {
  return getRegions(ctx.kind).filter((region) => getRegionStatus(region, ctx) !== 'locked').length;
}

export function getAchievementsSummary(ctx: WorldContext) {
  return {
    regionsDiscovered: getRegionsDiscoveredCount(ctx),
    totalRegions: getRegions(ctx.kind).length,
    questsCompleted: getTotalQuestsCompleted(ctx),
    questsMastered: ctx.masteredQuestIds.length,
    collectiblesFound: getCollectedCollectibles(ctx).length,
  };
}
