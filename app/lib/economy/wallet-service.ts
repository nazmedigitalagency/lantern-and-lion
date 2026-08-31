// The XP / Coins / Gems engine — the single place every feature awards
// or spends currency through.
//
// `awardXP` / `awardCoins` / `awardGems` / `spendCoins` each append one
// auditable Transaction and return the updated wallet, so nothing else
// needs to hand-roll "+XP" bookkeeping (see the module doc in
// `types.ts`). Level is always derived from `wallet.xp` through the
// shared `lib/xp-levels` ladder — the same ladder Adventure World's
// region/quest unlock checks use — so "current level" means the same
// thing everywhere in the app.
//
// Persistence today is localStorage, scoped per child/teen profile id
// exactly like Adventure World and Character storage. Swapping in a
// real backend later means changing the read/write functions in this
// file; every caller already goes through `getWallet` / `awardXP` /
// etc., not localStorage directly.

import { getLevelInfo, type LevelInfo } from '../xp-levels';
import type { AwardResult, CurrencyType, RewardSource, Transaction, Wallet } from './types';

const WALLET_KEY = 'lanternLionWallet';
const TRANSACTIONS_KEY = 'lanternLionWalletTransactions';
const MAX_STORED_TRANSACTIONS = 200;

const EMPTY_WALLET: Wallet = { xp: 0, coins: 0, gems: 0 };

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readAllWallets(): Record<string, Wallet> {
  return safeParse(localStorage.getItem(WALLET_KEY), {});
}

function writeAllWallets(wallets: Record<string, Wallet>): void {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallets));
}

function readAllTransactions(): Record<string, Transaction[]> {
  return safeParse(localStorage.getItem(TRANSACTIONS_KEY), {});
}

function writeAllTransactions(byProfile: Record<string, Transaction[]>): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(byProfile));
}

export function getWallet(profileId: number | string): Wallet {
  return readAllWallets()[profileId] || EMPTY_WALLET;
}

/** Every transaction ever recorded for this profile, newest first. */
export function getTransactions(profileId: number | string, limit = 50): Transaction[] {
  const list = readAllTransactions()[profileId] || [];
  return list.slice(0, limit);
}

/** Just the XP-type entries — the named function the progression spec asks for. */
export function getXPHistory(profileId: number | string, limit = 50): Transaction[] {
  return getTransactions(profileId, MAX_STORED_TRANSACTIONS).filter((t) => t.type === 'xp').slice(0, limit);
}

export function getCurrentLevel(profileId: number | string): LevelInfo {
  return getLevelInfo(getWallet(profileId).xp);
}

export function getXPForNextLevel(profileId: number | string): number | null {
  return getCurrentLevel(profileId).nextLevelXp;
}

export function getLevelProgress(profileId: number | string): LevelInfo {
  return getCurrentLevel(profileId);
}

function record(profileId: number | string, type: CurrencyType, amount: number, source: RewardSource, description: string): AwardResult {
  // Compare-and-swap the wallet write: re-check right before writing (and retry if another tab
  // wrote in between) so two tabs updating the same profile's wallet don't clobber each other.
  let wallets: Record<string, Wallet>;
  let currentWallet: Wallet;
  let nextWallet: Wallet;
  let previousLevel: number;
  for (let attempt = 0; ; attempt++) {
    const beforeRaw = localStorage.getItem(WALLET_KEY);
    wallets = safeParse(beforeRaw, {});
    currentWallet = wallets[profileId] || { ...EMPTY_WALLET };
    previousLevel = getLevelInfo(currentWallet.xp).level;
    nextWallet = { ...currentWallet, [type]: Math.max(0, currentWallet[type] + amount) };
    wallets[profileId] = nextWallet;
    if (localStorage.getItem(WALLET_KEY) === beforeRaw || attempt >= 4) {
      writeAllWallets(wallets);
      break;
    }
    // Another tab wrote between our read and our write — recompute against its latest value.
  }

  const allTransactions = readAllTransactions();
  const transaction: Transaction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    amount,
    source,
    description,
    timestamp: new Date().toISOString(),
  };
  const existing = allTransactions[profileId] || [];
  allTransactions[profileId] = [transaction, ...existing].slice(0, MAX_STORED_TRANSACTIONS);
  writeAllTransactions(allTransactions);

  const newLevel = getLevelInfo(nextWallet.xp).level;
  const levelUp = type === 'xp' && newLevel > previousLevel ? { previousLevel, newLevel } : null;

  return { transaction, wallet: nextWallet, levelUp };
}

/** Award XP for a meaningful activity. Amount should be positive. */
export function awardXP(profileId: number | string, amount: number, source: RewardSource, description: string): AwardResult {
  return record(profileId, 'xp', Math.max(0, Math.round(amount)), source, description);
}

export function awardCoins(profileId: number | string, amount: number, source: RewardSource, description: string): AwardResult {
  return record(profileId, 'coins', Math.max(0, Math.round(amount)), source, description);
}

export function awardGems(profileId: number | string, amount: number, source: RewardSource, description: string): AwardResult {
  return record(profileId, 'gems', Math.max(0, Math.round(amount)), source, description);
}

/** Returns null (and records nothing) if the wallet doesn't have enough coins. */
export function spendCoins(profileId: number | string, amount: number, source: RewardSource, description: string): AwardResult | null {
  const wallet = getWallet(profileId);
  const cost = Math.max(0, Math.round(amount));
  if (wallet.coins < cost) return null;
  return record(profileId, 'coins', -cost, source, description);
}
