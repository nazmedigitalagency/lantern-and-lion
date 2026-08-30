// Adventure World progression service.
//
// Pure functions only — no localStorage/network access happens here.
// The page component reads the current progress data (today: from
// localStorage; later: from an API) and passes it in as `WorldContext`.
// Swapping the storage layer later means changing what builds
// `WorldContext`, not this file.

import { curriculumModules } from '../curriculum-data';
import { getModuleLessons } from '../curriculum-lessons';
import { getLevelInfo, type LevelInfo } from '../lib/xp-levels';
import type { AdventureQuest, QuestStatus, Region, RegionId, RegionStatus, UnlockRequirement } from './types';
import { getQuestsForRegion, getQuest, getRegions, getWorldQuests, type WorldKind } from './world-data';

export type ModuleProgressEntry = { completedIndices: number[]; lastCompletedIndex: number };
export type ModuleProgressMap = Record<string, ModuleProgressEntry>;

export type WorldContext = {
  moduleProgress: ModuleProgressMap;
  /** Quest ids the player has chosen to replay for mastery. */
  masteredQuestIds: string[];
  /** Which region/quest set applies to this player — the child world or the harder Lion's Den (teen) world. */
  kind: WorldKind;
};

/**
 * Player level is derived from total XP earned across Adventure World
 * quests (see `getTotalXpEarned` below), fed through the shared
 * XP→level ladder in `lib/xp-levels`. This is the single leveling
 * source of truth — the Character profile reads the same function.
 */
export function getPlayerLevelInfo(ctx: WorldContext): LevelInfo {
  return getLevelInfo(getTotalXpEarned(ctx));
}

function moduleLessonCount(moduleId: string): number {
  const mod = curriculumModules.find((m) => m.id === moduleId);
  return mod ? getModuleLessons(mod).length : 0;
}

function moduleDoneCount(moduleId: string, moduleProgress: ModuleProgressMap): number {
  return moduleProgress[moduleId]?.completedIndices.length ?? 0;
}

export function isQuestModuleComplete(moduleId: string, moduleProgress: ModuleProgressMap): boolean {
  const total = moduleLessonCount(moduleId);
  return total > 0 && moduleDoneCount(moduleId, moduleProgress) >= total;
}

/** Real estimated minutes for a quest, summed from its module's actual lessons. */
export function getQuestEstimatedMinutes(quest: AdventureQuest): number {
  const mod = curriculumModules.find((m) => m.id === quest.moduleId);
  if (!mod) return 0;
  return getModuleLessons(mod).reduce((sum, lesson) => sum + lesson.minutes, 0);
}

/** Total finished quests across the whole world — the input to leveling. */
export function getTotalQuestsCompleted(ctx: WorldContext): number {
  return quests_all(ctx.kind).filter((quest) => isQuestModuleComplete(quest.moduleId, ctx.moduleProgress)).length;
}

function quests_all(kind: WorldKind): AdventureQuest[] {
  return getWorldQuests(kind);
}

function requirementMet(requirement: UnlockRequirement, ctx: WorldContext): boolean {
  switch (requirement.type) {
    case 'always':
      return true;
    case 'level':
      return getPlayerLevelInfo(ctx).level >= requirement.minLevel;
    case 'region-complete': {
      const regionQuests = getQuestsForRegion(requirement.regionId, ctx.kind);
      const completed = regionQuests.filter((quest) => isQuestModuleComplete(quest.moduleId, ctx.moduleProgress)).length;
      return completed >= requirement.minQuestsCompleted;
    }
    case 'quest-complete': {
      const quest = getQuest(requirement.questId, ctx.kind);
      return Boolean(quest && isQuestModuleComplete(quest.moduleId, ctx.moduleProgress));
    }
    default:
      return false;
  }
}

export function requirementsMet(requirements: UnlockRequirement[], ctx: WorldContext): boolean {
  return requirements.every((requirement) => requirementMet(requirement, ctx));
}

/** Human-readable copy for a locked region/quest, e.g. "Complete 2 quests in Eden". */
export function describeRequirement(requirement: UnlockRequirement, kind: WorldKind = 'child'): string {
  switch (requirement.type) {
    case 'always':
      return 'Always available';
    case 'level':
      return `Reach Level ${requirement.minLevel}`;
    case 'region-complete': {
      const region = getRegions(kind).find((r) => r.id === requirement.regionId);
      return `Complete ${requirement.minQuestsCompleted} quest${requirement.minQuestsCompleted === 1 ? '' : 's'} in ${region?.name ?? requirement.regionId}`;
    }
    case 'quest-complete': {
      const quest = getQuest(requirement.questId, kind);
      const mod = quest ? curriculumModules.find((m) => m.id === quest.moduleId) : undefined;
      return `Finish “${mod?.title ?? 'the previous quest'}” first`;
    }
    default:
      return 'Locked';
  }
}

export function getQuestStatus(quest: AdventureQuest, ctx: WorldContext): QuestStatus {
  if (!requirementsMet(quest.unlockRequirement, ctx)) return 'locked';
  if (ctx.masteredQuestIds.includes(quest.id) && isQuestModuleComplete(quest.moduleId, ctx.moduleProgress)) return 'mastered';
  if (isQuestModuleComplete(quest.moduleId, ctx.moduleProgress)) return 'completed';
  const done = moduleDoneCount(quest.moduleId, ctx.moduleProgress);
  if (done > 0) return 'in-progress';
  return 'available';
}

export function getRegionStatus(region: Region, ctx: WorldContext): RegionStatus {
  if (!requirementsMet(region.unlockRequirement, ctx)) return 'locked';
  const regionQuests = getQuestsForRegion(region.id, ctx.kind);
  const statuses = regionQuests.map((quest) => getQuestStatus(quest, ctx));
  if (statuses.every((status) => status === 'completed' || status === 'mastered')) return 'completed';
  if (statuses.some((status) => status === 'completed' || status === 'mastered' || status === 'in-progress')) return 'in-progress';
  return 'available';
}

export function getRegionQuestSummary(region: Region, ctx: WorldContext): { total: number; completed: number } {
  const regionQuests = getQuestsForRegion(region.id, ctx.kind);
  const completed = regionQuests.filter((quest) => isQuestModuleComplete(quest.moduleId, ctx.moduleProgress)).length;
  return { total: regionQuests.length, completed };
}

/** The furthest-along unlocked-but-not-fully-completed region, used to mark "you are here". */
export function getCurrentRegionId(ctx: WorldContext): RegionId {
  const worldRegions = getRegions(ctx.kind);
  const inProgressOrAvailable = worldRegions.find((region) => {
    const status = getRegionStatus(region, ctx);
    return status === 'available' || status === 'in-progress';
  });
  if (inProgressOrAvailable) return inProgressOrAvailable.id;
  const lastUnlocked = [...worldRegions].reverse().find((region) => getRegionStatus(region, ctx) !== 'locked');
  return lastUnlocked?.id ?? worldRegions[0].id;
}

export function getCollectedCollectibles(ctx: WorldContext) {
  return quests_all(ctx.kind)
    .filter((quest) => quest.reward.collectible && isQuestModuleComplete(quest.moduleId, ctx.moduleProgress))
    .map((quest) => quest.reward.collectible!);
}

export function getTotalXpEarned(ctx: WorldContext): number {
  return quests_all(ctx.kind)
    .filter((quest) => isQuestModuleComplete(quest.moduleId, ctx.moduleProgress))
    .reduce((sum, quest) => sum + quest.reward.xp + (ctx.masteredQuestIds.includes(quest.id) ? Math.round(quest.reward.xp * 0.5) : 0), 0);
}
