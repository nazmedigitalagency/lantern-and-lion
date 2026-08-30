// Adventure World Progression Engine
//
// Computes completion percentages, unlocked statuses across all 8 canonical
// biblical regions, chapter progress, boss mastery, and collectible inventory.

import { curriculumModules } from '../curriculum-data';
import { getModuleLessons } from '../curriculum-lessons';
import { getLevelInfo, type LevelInfo } from '../lib/xp-levels';
import type {
  AdventureQuest,
  QuestStatus,
  Region,
  RegionId,
  RegionStatus,
  UnlockRequirement,
  WorldCollectible,
} from './types';
import {
  adventureQuests,
  canonicalRegions,
  getQuest,
  getQuestsForRegion,
  getRegion,
  getRegions,
  type WorldKind,
} from './world-data';

export type ModuleProgressEntry = { completedIndices: number[]; lastCompletedIndex: number };
export type ModuleProgressMap = Record<string, ModuleProgressEntry>;

export type WorldContext = {
  moduleProgress: ModuleProgressMap;
  masteredQuestIds: string[];
  completedChapterIds?: string[];
  completedBossIds?: string[];
  discoveredSecretIds?: string[];
  collectedCollectibleIds?: string[];
  kind: WorldKind;
};

/** Derived player level info from total XP */
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

export function getQuestEstimatedMinutes(quest: AdventureQuest): number {
  const mod = curriculumModules.find((m) => m.id === quest.moduleId);
  if (!mod) return 6;
  return Math.max(5, getModuleLessons(mod).reduce((sum, l) => sum + l.minutes, 0));
}

export function getTotalQuestsCompleted(ctx: WorldContext): number {
  return adventureQuests.filter((q) => isQuestModuleComplete(q.moduleId, ctx.moduleProgress)).length;
}

export function isBossDefeated(bossId: string, ctx: WorldContext): boolean {
  return Boolean(ctx.completedBossIds?.includes(bossId));
}

export function isChapterCompleted(chapterId: string, ctx: WorldContext): boolean {
  return Boolean(ctx.completedChapterIds?.includes(chapterId));
}

export function isSecretDiscovered(secretId: string, ctx: WorldContext): boolean {
  return Boolean(ctx.discoveredSecretIds?.includes(secretId));
}

export function isCollectibleCollected(collectibleId: string, ctx: WorldContext): boolean {
  return Boolean(ctx.collectedCollectibleIds?.includes(collectibleId));
}

function requirementMet(requirement: UnlockRequirement, ctx: WorldContext): boolean {
  switch (requirement.type) {
    case 'always':
      return true;
    case 'level':
      return getPlayerLevelInfo(ctx).level >= requirement.minLevel;
    case 'region-complete': {
      const region = getRegion(requirement.regionId);
      if (!region) return false;
      const isBossDone = isBossDefeated(region.boss.id, ctx);
      const quests = getQuestsForRegion(requirement.regionId);
      const completedQuests = quests.filter((q) => isQuestModuleComplete(q.moduleId, ctx.moduleProgress)).length;
      return isBossDone || completedQuests >= requirement.minQuestsCompleted;
    }
    case 'quest-complete': {
      const quest = getQuest(requirement.questId);
      return Boolean(quest && isQuestModuleComplete(quest.moduleId, ctx.moduleProgress));
    }
    default:
      return false;
  }
}

export function requirementsMet(requirements: UnlockRequirement[], ctx: WorldContext): boolean {
  return requirements.every((r) => requirementMet(r, ctx));
}

export function describeRequirement(requirement: UnlockRequirement, kind?: WorldKind): string {
  if (kind) {
    // Track-aware descriptions
  }
  switch (requirement.type) {
    case 'always':
      return 'Always available';
    case 'level':
      return `Reach Level ${requirement.minLevel}`;
    case 'region-complete': {
      const region = getRegions(kind).find((r) => r.id === requirement.regionId);
      return `Complete ${region?.name || requirement.regionId}`;
    }
    case 'quest-complete':
      return `Complete ${requirement.questId}`;
    default:
      return 'Locked';
  }
}

export function getRegionStatus(region: Region, ctx: WorldContext): RegionStatus {
  if (!requirementsMet(region.unlockRequirement, ctx)) return 'locked';
  const bossDone = isBossDefeated(region.boss.id, ctx);
  if (bossDone) return 'completed';

  const quests = getQuestsForRegion(region.id);
  const someStarted = quests.some(
    (q) => (ctx.moduleProgress[q.moduleId]?.completedIndices.length ?? 0) > 0
  ) || (ctx.completedChapterIds?.some((c) => c.startsWith(region.id)) ?? false);

  return someStarted ? 'in-progress' : 'available';
}

export function getQuestStatus(quest: AdventureQuest, ctx: WorldContext): QuestStatus {
  if (ctx.masteredQuestIds.includes(quest.id)) return 'mastered';
  if (isQuestModuleComplete(quest.moduleId, ctx.moduleProgress)) return 'completed';
  if (!requirementsMet(quest.unlockRequirement, ctx)) return 'locked';
  const started = (ctx.moduleProgress[quest.moduleId]?.completedIndices.length ?? 0) > 0;
  return started ? 'in-progress' : 'available';
}

export function getRegionCompletionPercent(region: Region, ctx: WorldContext): number {
  const quests = getQuestsForRegion(region.id);
  const totalPoints = quests.length + region.chapters.length + 1; // quests + chapters + boss
  let earnedPoints = 0;

  quests.forEach((q) => {
    if (isQuestModuleComplete(q.moduleId, ctx.moduleProgress)) earnedPoints += 1;
  });

  region.chapters.forEach((ch) => {
    if (isChapterCompleted(ch.id, ctx)) earnedPoints += 1;
  });

  if (isBossDefeated(region.boss.id, ctx)) earnedPoints += 1;

  return Math.min(100, Math.round((earnedPoints / totalPoints) * 100));
}

export function getRegionQuestSummary(region: Region, ctx: WorldContext): {
  completed: number;
  total: number;
  isComplete: boolean;
} {
  const quests = getQuestsForRegion(region.id);
  const completed = quests.filter((q) => isQuestModuleComplete(q.moduleId, ctx.moduleProgress)).length;
  const isBossDone = isBossDefeated(region.boss.id, ctx);
  return {
    completed,
    total: quests.length,
    isComplete: isBossDone || (quests.length > 0 && completed >= quests.length),
  };
}

export function getCurrentRegionId(ctx: WorldContext): RegionId {
  const regions = getRegions();
  // Find first unlocked but incomplete region
  for (const region of regions) {
    const status = getRegionStatus(region, ctx);
    if (status === 'in-progress' || status === 'available') {
      return region.id;
    }
  }
  return regions[regions.length - 1].id;
}

export function getCollectedCollectibles(ctx: WorldContext): WorldCollectible[] {
  const regions = getRegions();
  const found: WorldCollectible[] = [];

  regions.forEach((r) => {
    if (isBossDefeated(r.boss.id, ctx) && r.boss.reward.specialCollectible) {
      found.push(r.boss.reward.specialCollectible);
    }
    r.collectibles.forEach((c) => {
      if (isCollectibleCollected(c.id, ctx)) {
        found.push(c);
      }
    });
  });

  return found;
}

export function getTotalXpEarned(ctx: WorldContext): number {
  let xp = 0;
  adventureQuests.forEach((q) => {
    if (isQuestModuleComplete(q.moduleId, ctx.moduleProgress)) {
      xp += q.reward.xp;
    }
    if (ctx.masteredQuestIds.includes(q.id)) {
      xp += 50;
    }
  });
  canonicalRegions.forEach((r) => {
    if (isBossDefeated(r.boss.id, ctx)) {
      xp += r.boss.reward.xp;
    }
  });
  return xp;
}

export function getNextMissionRecommendation(ctx: WorldContext): {
  region: Region;
  title: string;
  subtitle: string;
  type: 'chapter' | 'game' | 'boss';
  actionHref: string;
} {
  const currentRegId = getCurrentRegionId(ctx);
  const region = getRegion(currentRegId) || canonicalRegions[0];

  // Check uncompleted chapters
  const uncompletedChapter = region.chapters.find((ch) => !isChapterCompleted(ch.id, ctx));
  if (uncompletedChapter) {
    return {
      region,
      title: `${region.name} · Chapter ${uncompletedChapter.chapterNumber}`,
      subtitle: uncompletedChapter.title,
      type: 'chapter',
      actionHref: `/adventure?region=${region.id}&tab=chapters&chapter=${uncompletedChapter.id}`,
    };
  }

  // Check boss
  if (!isBossDefeated(region.boss.id, ctx)) {
    return {
      region,
      title: `${region.name} · Final Challenge`,
      subtitle: region.boss.title,
      type: 'boss',
      actionHref: `/adventure?region=${region.id}&tab=boss`,
    };
  }

  // Next region
  const nextIdx = canonicalRegions.findIndex((r) => r.id === region.id) + 1;
  const nextRegion = canonicalRegions[nextIdx] || region;
  return {
    region: nextRegion,
    title: `Explore ${nextRegion.name}`,
    subtitle: nextRegion.tagline,
    type: 'chapter',
    actionHref: `/adventure?region=${nextRegion.id}`,
  };
}
