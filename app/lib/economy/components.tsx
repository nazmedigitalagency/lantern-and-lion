'use client';

import { useEffect } from 'react';
import type { EquipmentItem } from '../../character/types';
import { useDialogA11y } from '../use-dialog';
import type { Transaction, Wallet } from './types';

/** Compact HUD: drop into any topbar. Visually exciting, not overwhelming — three pills, no motion unless a toast fires. */
export function GameHUD({ level, wallet }: { level: number; wallet: Wallet }) {
  return (
    <div className="hud-row" role="group" aria-label="Player status">
      <span className="hud-pill hud-level">🧭 Level {level}</span>
      <span className="hud-pill hud-xp">⭐ {wallet.xp.toLocaleString()} XP</span>
      <span className="hud-pill hud-coins">🪙 {wallet.coins.toLocaleString()}</span>
      <span className="hud-pill hud-gems">💎 {wallet.gems.toLocaleString()}</span>
    </div>
  );
}

const CURRENCY_ICON: Record<Transaction['type'], string> = { xp: '⭐', coins: '🪙', gems: '💎' };
const CURRENCY_LABEL: Record<Transaction['type'], string> = { xp: 'XP', coins: 'coins', gems: 'gems' };

function ToastRow({ transaction, onDone }: { transaction: Transaction; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction.id]);

  const sign = transaction.amount >= 0 ? '+' : '−';
  return (
    <div className="hud-toast" role="status">
      <span className="hud-toast-amount">{sign}{Math.abs(transaction.amount)} {CURRENCY_ICON[transaction.type]} {CURRENCY_LABEL[transaction.type]}</span>
      <small>{transaction.description}</small>
    </div>
  );
}

/**
 * A vertical stack of "+50 XP" style toasts. When several rewards land
 * at once (e.g. finishing a quest awards XP + coins together), they
 * stack as a short column instead of piling up as separate popups.
 * Each row dismisses itself; cap the visible stack so a big batch (a
 * region-complete moment can fire several transactions at once) still
 * reads calmly.
 */
export function XPToastStack({ toasts, onDismiss }: { toasts: { id: string; transaction: Transaction }[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  const visible = toasts.slice(-4);
  const overflowCount = toasts.length - visible.length;

  return (
    <div className="hud-toast-stack" aria-live="polite">
      {overflowCount > 0 && <div className="hud-toast hud-toast-overflow">+{overflowCount} more reward{overflowCount === 1 ? '' : 's'}</div>}
      {visible.map((toast) => (
        <ToastRow key={toast.id} transaction={toast.transaction} onDone={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

/**
 * The Character Progression level-up experience — Adventure World and
 * Character both trigger this from the same place (`useWalletSync`
 * detects the crossing when `awardXP` fires), so there's exactly one
 * level-up modal in the app, not one per feature.
 */
export function LevelUpModal({
  previousLevel,
  newLevel,
  newTitle,
  xp,
  unlockedItems,
  onContinue,
}: {
  previousLevel: number;
  newLevel: number;
  newTitle: string;
  xp: number;
  unlockedItems: EquipmentItem[];
  onContinue: () => void;
}) {
  const dialogRef = useDialogA11y<HTMLElement>(true, onContinue);
  return (
    <div className="help-overlay" role="presentation">
      <section ref={dialogRef} className="help-dialog char-levelup-dialog" role="dialog" aria-modal="true" aria-labelledby="levelup-title">
        <p className="child-kicker char-levelup-kicker">✨ Level up!</p>
        <div className="char-levelup-track">
          <span className="char-levelup-old">Lvl {previousLevel}</span>
          <span className="char-levelup-arrow" aria-hidden="true">→</span>
          <span className="char-levelup-new">Lvl {newLevel}</span>
        </div>
        <h2 id="levelup-title">{newTitle}</h2>
        <p className="char-levelup-xp">✨ {xp} total XP</p>
        {unlockedItems.length > 0 && (
          <div className="char-levelup-rewards">
            <p className="child-kicker">Reward unlocked</p>
            <div className="char-levelup-reward-row">
              {unlockedItems.map((item) => (
                <span key={item.id} className="char-levelup-reward-chip">
                  <span aria-hidden="true">{item.emoji}</span> {item.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <button type="button" className="button button-primary char-levelup-continue" onClick={onContinue}>Continue</button>
      </section>
    </div>
  );
}
