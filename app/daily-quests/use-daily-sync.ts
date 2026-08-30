'use client';

import { useEffect, useState } from 'react';
import type { WorldContext } from '../adventure/progression';
import type { AwardResult } from '../lib/economy/types';
import { computeStreak, getLastSevenDays, getNewlyAutoCompletedModes, getTodayDateKey } from './progression';
import {
  claimDailyBonusIfComplete,
  completeQuestManually,
  completeQuestsByMode,
  getOrCreateTodaySet,
  readHistory,
} from './storage';
import type { ChestReward, DailyQuestSet, HistoryEntry, StreakInfo } from './types';

export type DailyToast = { id: string; transaction: AwardResult['transaction'] };

/**
 * The single integration point the Daily Quests page uses: creates or
 * fetches today's set (handling day rollover), checks the
 * auto-detected quest types against live Adventure World / Character
 * progress, and claims the completion bonus + chest the moment every
 * quest is done. Every award goes through the existing wallet
 * (`lib/economy`) — nothing here computes XP on its own.
 */
export function useDailySync(profileId: number | null, ctx: WorldContext) {
  const [set, setSet] = useState<DailyQuestSet | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [toasts, setToasts] = useState<DailyToast[]>([]);
  const [chestReveal, setChestReveal] = useState<ChestReward | null>(null);

  useEffect(() => {
    if (profileId === null) return;
    const timer = window.setTimeout(() => {
      let current = getOrCreateTodaySet(profileId, ctx);
      const allAwards: AwardResult[] = [];

      const newlyDone = getNewlyAutoCompletedModes(profileId, ctx, current.snapshot, getTodayDateKey());
      if (newlyDone.size > 0) {
        const result = completeQuestsByMode(profileId, current, newlyDone);
        current = result.set;
        allAwards.push(...result.awards);
      }

      const bonusResult = claimDailyBonusIfComplete(profileId, current);
      current = bonusResult.set;
      allAwards.push(...bonusResult.awards);
      if (bonusResult.chest) setChestReveal(bonusResult.chest);

      setSet(current);
      setHistory(readHistory(profileId));
      if (allAwards.length > 0) {
        setToasts((prev) => [...prev, ...allAwards.map((a) => ({ id: a.transaction.id, transaction: a.transaction }))]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [profileId, ctx]);

  function completeManual(templateId: string) {
    if (profileId === null || !set) return;
    const result = completeQuestManually(profileId, set, templateId);
    let current = result.set;
    const allAwards = [...result.awards];

    const bonusResult = claimDailyBonusIfComplete(profileId, current);
    current = bonusResult.set;
    allAwards.push(...bonusResult.awards);
    if (bonusResult.chest) setChestReveal(bonusResult.chest);

    setSet(current);
    setHistory(readHistory(profileId));
    if (allAwards.length > 0) {
      setToasts((prev) => [...prev, ...allAwards.map((a) => ({ id: a.transaction.id, transaction: a.transaction }))]);
    }
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function dismissChest() {
    setChestReveal(null);
  }

  const streak: StreakInfo = computeStreak(history);
  const weekStrip = set ? getLastSevenDays(history, set.date) : [];

  return { set, history, weekStrip, streak, toasts, dismissToast, chestReveal, dismissChest, completeManual };
}
