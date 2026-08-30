// Local persistence + orchestration for Daily Quests.
//
// This is the only file that touches localStorage for this feature,
// and the only place that decides when a new day's set gets generated
// or a "missed day" gets recorded — mirroring the adventure/character
// storage modules' role in their own features.

import { awardCoins, awardGems, awardXP } from '../lib/economy/wallet-service';
import type { AwardResult } from '../lib/economy/types';
import { DAILY_SLOT_CATEGORIES, BONUS_XP, getTemplate, pickTemplateForSlot } from './catalog';
import { computeSnapshot, getDateKeysBetween, getTodayDateKey, isSetFullyComplete } from './progression';
import type { ChestReward, DailyQuestSet, HistoryEntry } from './types';
import type { WorldContext } from '../adventure/progression';

const SET_KEY = 'lanternLionDailySet';
const HISTORY_KEY = 'lanternLionDailyHistory';
const MAX_HISTORY_DAYS = 60;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readAllSets(): Record<string, DailyQuestSet> {
  return safeParse(localStorage.getItem(SET_KEY), {});
}

function writeSet(profileId: number, set: DailyQuestSet): void {
  const all = readAllSets();
  all[profileId] = set;
  localStorage.setItem(SET_KEY, JSON.stringify(all));
}

export function readHistory(profileId: number): HistoryEntry[] {
  const byProfile = safeParse<Record<string, HistoryEntry[]>>(localStorage.getItem(HISTORY_KEY), {});
  return byProfile[profileId] || [];
}

function upsertHistoryDay(profileId: number, date: string, completed: boolean): void {
  const byProfile = safeParse<Record<string, HistoryEntry[]>>(localStorage.getItem(HISTORY_KEY), {});
  const list = byProfile[profileId] || [];
  const existingIndex = list.findIndex((entry) => entry.date === date);
  if (existingIndex >= 0) {
    // Never downgrade a day that was already recorded complete.
    list[existingIndex] = { date, completed: list[existingIndex].completed || completed };
  } else {
    list.push({ date, completed });
  }
  list.sort((a, b) => a.date.localeCompare(b.date));
  byProfile[profileId] = list.slice(-MAX_HISTORY_DAYS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(byProfile));
}

function buildFreshSet(profileId: number, dateKey: string, ctx: WorldContext): DailyQuestSet {
  return {
    date: dateKey,
    quests: DAILY_SLOT_CATEGORIES.map((category) => ({
      templateId: pickTemplateForSlot(category, profileId, dateKey).id,
      completed: false,
      completedAt: null,
    })),
    snapshot: computeSnapshot(profileId, ctx, dateKey),
    bonusClaimed: false,
    chestOpened: false,
  };
}

/**
 * Returns today's set, generating a fresh one (and recording any
 * missed days in between) if the stored set belongs to an earlier
 * date. This is the day-reset: it's driven by `getTodayDateKey()`
 * (local device clock) rather than a server tick, since nothing in
 * this app has a backend yet — see the note on that function for the
 * swap point once one exists.
 */
export function getOrCreateTodaySet(profileId: number, ctx: WorldContext): DailyQuestSet {
  const todayKey = getTodayDateKey();
  const all = readAllSets();
  const existing = all[profileId];

  if (existing && existing.date === todayKey) return existing;

  if (existing) {
    // Record the day the stored set belonged to, then explicitly mark
    // every calendar day between it and today as missed — without
    // this, two completed days either side of a multi-day absence
    // would look like an unbroken streak.
    upsertHistoryDay(profileId, existing.date, isSetFullyComplete(existing));
    const gapDays = getDateKeysBetween(existing.date, todayKey).slice(0, -1);
    for (const missedDate of gapDays) upsertHistoryDay(profileId, missedDate, false);
  }

  const fresh = buildFreshSet(profileId, todayKey, ctx);
  writeSet(profileId, fresh);
  return fresh;
}

/** Auto-detected completion modes newly satisfied get XP/coins the moment they're noticed. */
export function completeQuestsByMode(profileId: number, set: DailyQuestSet, modes: Set<string>): { set: DailyQuestSet; awards: AwardResult[] } {
  const awards: AwardResult[] = [];
  let changed = false;
  const quests = set.quests.map((instance) => {
    if (instance.completed) return instance;
    const template = getTemplate(instance.templateId);
    if (!template || !modes.has(template.completionMode)) return instance;
    awards.push(awardXP(profileId, template.xp, 'daily-quest', template.title));
    awards.push(awardCoins(profileId, template.coins, 'daily-quest', template.title));
    changed = true;
    return { ...instance, completed: true, completedAt: new Date().toISOString() };
  });

  if (!changed) return { set, awards };
  const nextSet = { ...set, quests };
  writeSet(profileId, nextSet);
  return { set: nextSet, awards };
}

/** Used by the in-page memory-verse and word-scramble widgets when the player finishes them correctly. */
export function completeQuestManually(profileId: number, set: DailyQuestSet, templateId: string): { set: DailyQuestSet; awards: AwardResult[] } {
  const instance = set.quests.find((q) => q.templateId === templateId);
  const template = getTemplate(templateId);
  if (!instance || !template || instance.completed) return { set, awards: [] };

  const awards: AwardResult[] = [
    awardXP(profileId, template.xp, 'daily-quest', template.title),
    awardCoins(profileId, template.coins, 'daily-quest', template.title),
  ];
  const quests = set.quests.map((q) => (q.templateId === templateId ? { ...q, completed: true, completedAt: new Date().toISOString() } : q));
  const nextSet = { ...set, quests };
  writeSet(profileId, nextSet);
  return { set: nextSet, awards };
}

function randomChestReward(dateKey: string, profileId: number): ChestReward {
  // Deterministic per player per day — "safely randomized" (always a
  // guaranteed free reward, nothing to purchase, nothing to lose).
  let hash = 0;
  const seed = `chest-${profileId}-${dateKey}`;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const coins = 15 + (hash % 16); // 15-30 coins
  const gems = hash % 5 === 0 ? 1 : 0; // occasional bonus gem, never required
  return { coins, xp: BONUS_XP, gems };
}

/** Awards the completion bonus + opens the chest exactly once per day, and records today as a completed day right away. */
export function claimDailyBonusIfComplete(profileId: number, set: DailyQuestSet): { set: DailyQuestSet; awards: AwardResult[]; chest: ChestReward | null } {
  if (set.bonusClaimed || !isSetFullyComplete(set)) return { set, awards: [], chest: null };

  const chest = randomChestReward(set.date, profileId);
  const awards: AwardResult[] = [awardXP(profileId, chest.xp, 'daily-quest', 'Daily Quests complete'), awardCoins(profileId, chest.coins, 'daily-quest', 'Daily chest')];
  if (chest.gems > 0) awards.push(awardGems(profileId, chest.gems, 'daily-quest', 'Daily chest'));

  const nextSet = { ...set, bonusClaimed: true, chestOpened: true };
  writeSet(profileId, nextSet);
  upsertHistoryDay(profileId, set.date, true);

  return { set: nextSet, awards, chest };
}
