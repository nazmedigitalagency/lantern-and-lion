// Local persistence adapter for the Adventure World.
//
// Manages completed chapters, defeated bosses, discovered secrets,
// and collectible items, coordinating with `wallet-service.ts`.

import { awardCoins, awardGems, awardXP } from '../lib/economy/wallet-service';
import type { ModuleProgressEntry, ModuleProgressMap, WorldContext } from './progression';

export type PlayerProfile = { id: number; name: string; age: number; kind: 'child' | 'teen' };

const FALLBACK_PROFILE: PlayerProfile = { id: 1, name: 'Amara', age: 9, kind: 'child' };

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function hasActiveSession(): boolean {
  if (typeof window === 'undefined') return false;
  const teenSession = safeParse<{ teenId?: number } | null>(localStorage.getItem('lanternLionTeenSession'), null);
  const childSession = safeParse<{ childId?: number } | null>(localStorage.getItem('lanternLionChildSession'), null);
  return teenSession?.teenId != null || childSession?.childId != null;
}

export function readActiveProfile(): PlayerProfile {
  if (typeof window === 'undefined') return FALLBACK_PROFILE;
  type FamilyChild = { id: number; name: string; age: number };
  const family = safeParse<{ children?: FamilyChild[] } | null>(localStorage.getItem('lanternLionDemoFamily'), null);
  const teenSession = safeParse<{ teenId?: number } | null>(localStorage.getItem('lanternLionTeenSession'), null);
  const childSession = safeParse<{ childId?: number } | null>(localStorage.getItem('lanternLionChildSession'), null);
  const activeIdFromStorage = Number(localStorage.getItem('lanternLionActiveChildId'));

  const children = family?.children?.length ? family.children : [FALLBACK_PROFILE];
  const sessionTargetId = teenSession?.teenId ?? childSession?.childId ?? null;
  const sessionKind: 'teen' | 'child' | null = teenSession?.teenId != null ? 'teen' : childSession?.childId != null ? 'child' : null;
  const targetId = sessionTargetId ?? (activeIdFromStorage > 0 ? activeIdFromStorage : null) ?? children[0].id;
  const match = children.find((child) => child.id === targetId) ?? (sessionTargetId !== null ? null : children[0]);

  if (!match) {
    return {
      id: (sessionTargetId as number) || 1,
      name: FALLBACK_PROFILE.name,
      age: sessionKind === 'teen' ? 13 : FALLBACK_PROFILE.age,
      kind: sessionKind ?? FALLBACK_PROFILE.kind,
    };
  }

  return { id: match.id, name: match.name, age: match.age, kind: match.age >= 13 ? 'teen' : 'child' };
}

export function readModuleProgress(profileId: number): ModuleProgressMap {
  if (typeof window === 'undefined') return {};
  const progressByChild = safeParse<Record<string, ModuleProgressMap>>(localStorage.getItem('lanternLionModuleProgress'), {});
  return progressByChild[profileId] || {};
}

const MASTERY_KEY = 'lanternLionAdventureMastery';
const CHAPTERS_KEY = 'lanternLionAdventureChapters';
const BOSS_KEY = 'lanternLionAdventureBosses';
const SECRETS_KEY = 'lanternLionAdventureSecrets';
const COLLECTIBLES_KEY = 'lanternLionAdventureCollectibles';

export function readMasteredQuestIds(profileId: number): string[] {
  if (typeof window === 'undefined') return [];
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(MASTERY_KEY), {});
  return byChild[profileId] || [];
}

export function markQuestMastered(profileId: number, questId: string): string[] {
  if (typeof window === 'undefined') return [];
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(MASTERY_KEY), {});
  const current = byChild[profileId] || [];
  if (!current.includes(questId)) {
    byChild[profileId] = [...current, questId];
    localStorage.setItem(MASTERY_KEY, JSON.stringify(byChild));
    awardXP(profileId, 50, 'quest-mastery', `Mastered quest ${questId}`);
    awardCoins(profileId, 25, 'quest-mastery', `Mastered quest ${questId}`);
    return byChild[profileId];
  }
  return current;
}

export function readCompletedChapterIds(profileId: number): string[] {
  if (typeof window === 'undefined') return [];
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(CHAPTERS_KEY), {});
  return byChild[profileId] || [];
}

export function markChapterCompleted(profileId: number, chapterId: string): string[] {
  if (typeof window === 'undefined') return [];
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(CHAPTERS_KEY), {});
  const current = byChild[profileId] || [];
  if (!current.includes(chapterId)) {
    byChild[profileId] = [...current, chapterId];
    localStorage.setItem(CHAPTERS_KEY, JSON.stringify(byChild));
    awardXP(profileId, 40, 'story-completion', `Completed chapter ${chapterId}`);
    awardCoins(profileId, 15, 'story-completion', `Completed chapter ${chapterId}`);
    return byChild[profileId];
  }
  return current;
}

export function readCompletedBossIds(profileId: number): string[] {
  if (typeof window === 'undefined') return [];
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(BOSS_KEY), {});
  return byChild[profileId] || [];
}

export function markBossCompleted(profileId: number, bossId: string, rewards: { xp: number; coins: number; gems: number }): string[] {
  if (typeof window === 'undefined') return [];
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(BOSS_KEY), {});
  const current = byChild[profileId] || [];
  if (!current.includes(bossId)) {
    byChild[profileId] = [...current, bossId];
    localStorage.setItem(BOSS_KEY, JSON.stringify(byChild));
    if (rewards.xp > 0) awardXP(profileId, rewards.xp, 'challenge', `Defeated Knowledge Boss ${bossId}`);
    if (rewards.coins > 0) awardCoins(profileId, rewards.coins, 'challenge', `Defeated Knowledge Boss ${bossId}`);
    if (rewards.gems > 0) awardGems(profileId, rewards.gems, 'challenge', `Defeated Knowledge Boss ${bossId}`);
    return byChild[profileId];
  }
  return current;
}

export function readDiscoveredSecretIds(profileId: number): string[] {
  if (typeof window === 'undefined') return [];
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(SECRETS_KEY), {});
  return byChild[profileId] || [];
}

export function markSecretDiscovered(profileId: number, secretId: string, rewards: { coins: number; gems: number }): string[] {
  if (typeof window === 'undefined') return [];
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(SECRETS_KEY), {});
  const current = byChild[profileId] || [];
  if (!current.includes(secretId)) {
    byChild[profileId] = [...current, secretId];
    localStorage.setItem(SECRETS_KEY, JSON.stringify(byChild));
    if (rewards.coins > 0) awardCoins(profileId, rewards.coins, 'achievement', `Discovered secret ${secretId}`);
    if (rewards.gems > 0) awardGems(profileId, rewards.gems, 'achievement', `Discovered secret ${secretId}`);
    return byChild[profileId];
  }
  return current;
}

export function readCollectedCollectibleIds(profileId: number): string[] {
  if (typeof window === 'undefined') return [];
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(COLLECTIBLES_KEY), {});
  return byChild[profileId] || [];
}

export function markCollectibleCollected(profileId: number, collectibleId: string): string[] {
  if (typeof window === 'undefined') return [];
  const byChild = safeParse<Record<string, string[]>>(localStorage.getItem(COLLECTIBLES_KEY), {});
  const current = byChild[profileId] || [];
  if (!current.includes(collectibleId)) {
    byChild[profileId] = [...current, collectibleId];
    localStorage.setItem(COLLECTIBLES_KEY, JSON.stringify(byChild));
    return byChild[profileId];
  }
  return current;
}

export function loadWorldContext(profileId: number, kind: PlayerProfile['kind'] = 'child'): WorldContext {
  return {
    moduleProgress: readModuleProgress(profileId),
    masteredQuestIds: readMasteredQuestIds(profileId),
    completedChapterIds: readCompletedChapterIds(profileId),
    completedBossIds: readCompletedBossIds(profileId),
    discoveredSecretIds: readDiscoveredSecretIds(profileId),
    collectedCollectibleIds: readCollectedCollectibleIds(profileId),
    kind,
  };
}

export type { ModuleProgressEntry };
