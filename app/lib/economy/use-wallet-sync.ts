'use client';

import { useEffect, useState } from 'react';
import type { WorldContext } from '../../adventure/progression';
import { getItemsUnlockedInLevelRange } from '../../character/progression';
import type { EquipmentItem } from '../../character/types';
import { getLevelInfo, type LevelInfo } from '../xp-levels';
import { reconcileAdventureRewards } from './reconcile';
import type { AwardResult, Transaction, Wallet } from './types';
import { getWallet } from './wallet-service';

export type ToastEvent = { id: string; transaction: Transaction };
export type LevelUpEvent = { previousLevel: number; newLevel: number; unlockedItems: EquipmentItem[] };

const EMPTY_WALLET: Wallet = { xp: 0, coins: 0, gems: 0 };

/**
 * The single integration point every screen uses to stay in sync with
 * the wallet: reconciles Adventure World progress into real
 * transactions whenever `ctx` changes, then exposes the resulting
 * wallet, a consolidated level-up event (if this pass crossed one or
 * more level thresholds), and a stacking queue of "+N XP" style toast
 * events for the HUD. Both `/adventure` and `/character` call this
 * instead of duplicating reconciliation or level-up detection.
 */
export function useWalletSync(profileId: number | null, ctx: WorldContext) {
  const [wallet, setWallet] = useState<Wallet>(EMPTY_WALLET);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    if (profileId === null) return;
    const timer = window.setTimeout(() => {
      const results = reconcileAdventureRewards(profileId, ctx);
      setWallet(getWallet(profileId));

      if (results.length > 0) {
        const newToasts = results.map<ToastEvent>((result) => ({
          id: result.transaction.id,
          transaction: result.transaction,
        }));
        setToasts((current) => [...current, ...newToasts]);

        const levelUps = results.map((r: AwardResult) => r.levelUp).filter((lu): lu is NonNullable<typeof lu> => lu !== null);
        if (levelUps.length > 0) {
          const previousLevel = Math.min(...levelUps.map((lu) => lu.previousLevel));
          const newLevel = Math.max(...levelUps.map((lu) => lu.newLevel));
          setLevelUpEvent({ previousLevel, newLevel, unlockedItems: getItemsUnlockedInLevelRange(previousLevel, newLevel) });
        }
      } else {
        setWallet(getWallet(profileId));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [profileId, ctx]);

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function dismissLevelUp() {
    setLevelUpEvent(null);
  }

  const levelInfo: LevelInfo = getLevelInfo(wallet.xp);

  return { wallet, levelInfo, toasts, dismissToast, levelUpEvent, dismissLevelUp };
}
