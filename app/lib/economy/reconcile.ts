// Bridges Adventure World's existing completion data into real wallet
// transactions.
//
// Adventure World completion isn't an event today — it's derived by
// reading `lanternLionModuleProgress` (written by the pre-existing
// `/learn` lesson engine, which knows nothing about XP or wallets).
// Rather than rewriting `/learn` to call `awardXP` directly, this
// module diffs "what's complete now" against "what we've already paid
// out for" and turns each newly-discovered completion into exactly
// one transaction — idempotent, so re-running it on every page visit
// never double-pays.
//
// A feature built AFTER the wallet exists (the Arcade, daily quests,
// achievements, boss battles, ...) does not need this shim: it should
// call `awardXP` / `awardCoins` / `awardGems` directly at the moment
// the player finishes the activity, the way this file's award calls
// do internally.

import { curriculumModules } from '../../curriculum-data';
import { getRegionStatus, isQuestModuleComplete, type WorldContext } from '../../adventure/progression';
import { getQuestsForRegion, getRegions } from '../../adventure/world-data';
import { COINS_PER_QUEST_COMPLETE, GEMS_PER_QUEST_MASTERY, REGION_COMPLETE_BONUS } from './rewards';
import type { AwardResult } from './types';
import { awardCoins, awardGems, awardXP } from './wallet-service';

const AWARDED_QUESTS_KEY = 'lanternLionWalletAwardedQuests';
const AWARDED_MASTERY_KEY = 'lanternLionWalletAwardedMastery';
const AWARDED_REGIONS_KEY = 'lanternLionWalletAwardedRegions';

function readIdSet(storageKey: string, profileId: number): Set<string> {
  try {
    const byProfile = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return new Set<string>(byProfile[profileId] || []);
  } catch {
    return new Set();
  }
}

function writeIdSet(storageKey: string, profileId: number, ids: Set<string>): void {
  let byProfile: Record<string, string[]> = {};
  try {
    byProfile = JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    byProfile = {};
  }
  byProfile[profileId] = Array.from(ids);
  localStorage.setItem(storageKey, JSON.stringify(byProfile));
}

function questTitle(moduleId: string): string {
  return curriculumModules.find((m) => m.id === moduleId)?.title || moduleId;
}

/**
 * Call whenever fresh Adventure World progress is loaded (Adventure
 * World and Character both do this on hydrate). Returns every award
 * newly granted in this pass, in order — empty if nothing changed
 * since the last reconciliation.
 */
export function reconcileAdventureRewards(profileId: number, ctx: WorldContext): AwardResult[] {
  const results: AwardResult[] = [];

  // Re-read each set right before checking it, and persist the update immediately after —
  // rather than once at the end — so a second reconciliation pass (e.g. from another tab)
  // started partway through this one sees awards as they land instead of only after this
  // whole pass finishes, which narrows the window for a duplicate award.
  for (const region of getRegions(ctx.kind)) {
    for (const quest of getQuestsForRegion(region.id, ctx.kind)) {
      const complete = isQuestModuleComplete(quest.moduleId, ctx.moduleProgress);

      if (complete) {
        const awardedQuests = readIdSet(AWARDED_QUESTS_KEY, profileId);
        if (!awardedQuests.has(quest.id)) {
          const title = questTitle(quest.moduleId);
          results.push(awardXP(profileId, quest.reward.xp, 'quest', title));
          results.push(awardCoins(profileId, COINS_PER_QUEST_COMPLETE, 'quest', title));
          awardedQuests.add(quest.id);
          writeIdSet(AWARDED_QUESTS_KEY, profileId, awardedQuests);
        }
      }

      if (complete && ctx.masteredQuestIds.includes(quest.id)) {
        const awardedMastery = readIdSet(AWARDED_MASTERY_KEY, profileId);
        if (!awardedMastery.has(quest.id)) {
          const title = questTitle(quest.moduleId);
          results.push(awardXP(profileId, Math.round(quest.reward.xp * 0.5), 'quest-mastery', `Mastered: ${title}`));
          results.push(awardGems(profileId, GEMS_PER_QUEST_MASTERY, 'quest-mastery', `Mastered: ${title}`));
          awardedMastery.add(quest.id);
          writeIdSet(AWARDED_MASTERY_KEY, profileId, awardedMastery);
        }
      }
    }

    if (getRegionStatus(region, ctx) === 'completed') {
      const awardedRegions = readIdSet(AWARDED_REGIONS_KEY, profileId);
      if (!awardedRegions.has(region.id)) {
        const label = `${region.name} fully explored`;
        results.push(awardXP(profileId, REGION_COMPLETE_BONUS.xp, 'region-complete', label));
        results.push(awardCoins(profileId, REGION_COMPLETE_BONUS.coins, 'region-complete', label));
        results.push(awardGems(profileId, REGION_COMPLETE_BONUS.gems, 'region-complete', label));
        awardedRegions.add(region.id);
        writeIdSet(AWARDED_REGIONS_KEY, profileId, awardedRegions);
      }
    }
  }

  return results;
}
