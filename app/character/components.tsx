import React, { type ReactNode } from 'react';
import type { CharacterAppearance, CharacterEquipment, EquipmentItem, ItemRarity, ItemStatus } from './types';
import { IllustratedAvatar } from './avatar-engine';
import { ItemIllustration } from './item-icons';

export { IllustratedAvatar } from './avatar-engine';
export { ItemIllustration } from './item-icons';

export const RARITY_CONFIG: Record<ItemRarity, { label: string; bg: string; text: string; border: string }> = {
  common: { label: 'Common', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  uncommon: { label: 'Uncommon', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  rare: { label: 'Rare', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  epic: { label: 'Epic', bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
  legendary: { label: 'Legendary', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
};

export function RarityBadge({ rarity = 'common' }: { rarity?: ItemRarity }) {
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  return (
    <span
      className={`char-rarity-badge char-rarity-${rarity}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        padding: '0.15rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      {rarity === 'legendary' ? '✨ ' : rarity === 'epic' ? '💎 ' : ''}
      {config.label}
    </span>
  );
}

/**
 * CharacterAvatar renders the modular illustrated adventurer.
 */
export function CharacterAvatar({
  appearance,
  equipment = {},
  size = 'large',
  showPedestal = true,
}: {
  appearance: CharacterAppearance;
  equipment?: CharacterEquipment;
  size?: 'small' | 'medium' | 'large' | 'hero';
  showPedestal?: boolean;
}) {
  return (
    <div className={`char-avatar-wrapper char-avatar-wrapper-${size}`}>
      <IllustratedAvatar
        appearance={appearance}
        equipment={equipment}
        size={size}
        showPedestal={showPedestal}
      />
    </div>
  );
}

export function StatChip({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <article className="char-stat-chip">
      <span aria-hidden="true">{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </article>
  );
}

/** 1-5 filled stars out of 5 — how the child's Skill Profile shows learning strength across all Arcade games. */
export function SkillStars({ stars }: { stars: number }) {
  return (
    <span className="char-skill-stars" aria-label={`${stars} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true">{i < stars ? '⭐' : '☆'}</span>
      ))}
    </span>
  );
}

export function AppearanceSwatch({
  active,
  onSelect,
  children,
  label,
}: {
  active: boolean;
  onSelect: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`char-swatch ${active ? 'active' : ''}`}
      aria-pressed={active}
      onClick={onSelect}
      aria-label={label}
    >
      {children}
      <small>{label}</small>
    </button>
  );
}

const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  locked: 'Locked',
  unlocked: 'Available',
  owned: 'Owned',
  equipped: 'Equipped',
};

export function InventoryItemCard({
  item,
  status,
  requirementCopy,
  onEquip,
  onUnequip,
}: {
  item: EquipmentItem;
  status: ItemStatus;
  requirementCopy: string;
  onEquip: () => void;
  onUnequip: () => void;
}) {
  return (
    <article className={`char-item-card char-item-${status}`}>
      <div className="char-item-icon-wrap">
        <ItemIllustration itemId={item.id} size={46} className="char-item-svg" />
        {status === 'locked' && (
          <span className="char-item-lock-badge" aria-label="Locked">
            🔒
          </span>
        )}
        {status === 'equipped' && (
          <span className="char-item-equipped-badge" aria-label="Equipped">
            ✓
          </span>
        )}
      </div>
      <div className="char-item-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
          <strong>{item.name}</strong>
          {item.rarity && <RarityBadge rarity={item.rarity} />}
        </div>
        {item.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', margin: '0.2rem 0' }}>{item.description}</p>}
        <small>{status === 'locked' ? requirementCopy : ITEM_STATUS_LABEL[status]}</small>
      </div>
      {(status === 'unlocked' || status === 'owned') && (
        <button type="button" className="char-item-action" onClick={onEquip}>
          Equip
        </button>
      )}
      {status === 'equipped' && (
        <button
          type="button"
          className="char-item-action char-item-action-unequip"
          onClick={onUnequip}
        >
          Unequip
        </button>
      )}
    </article>
  );
}

export function ShopItemCard({
  item,
  isOwned,
  isEquipped,
  isGated,
  gateReason,
  onBuy,
  onEquip,
  onUnequip,
  canAfford,
}: {
  item: EquipmentItem;
  isOwned: boolean;
  isEquipped: boolean;
  isGated: boolean;
  gateReason?: string;
  onBuy: () => void;
  onEquip: () => void;
  onUnequip: () => void;
  canAfford: boolean;
}) {
  const priceCoins = item.priceCoins ?? 0;
  const priceGems = item.priceGems ?? 0;

  return (
    <article className={`char-shop-card ${isOwned ? 'owned' : ''} ${isGated ? 'gated' : ''}`}>
      <div className="char-shop-icon-wrap">
        <ItemIllustration itemId={item.id} size={54} className="char-item-svg" />
        {isGated && <span className="char-shop-lock-icon">🔒</span>}
        {isEquipped && <span className="char-shop-equipped-tag">Equipped</span>}
      </div>
      <div className="char-shop-info">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <strong>{item.name}</strong>
          <RarityBadge rarity={item.rarity || 'common'} />
        </div>
        {item.description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', margin: '0.25rem 0' }}>
            {item.description}
          </p>
        )}
        <div className="char-shop-price-row">
          {priceCoins > 0 && <span className="char-price-tag coins">🪙 {priceCoins}</span>}
          {priceGems > 0 && <span className="char-price-tag gems">💎 {priceGems}</span>}
          {priceCoins === 0 && priceGems === 0 && <span className="char-price-tag free">Free Starter</span>}
        </div>
        {isGated && gateReason && (
          <small className="char-gate-reason">🔒 Requires: {gateReason}</small>
        )}
      </div>
      <div className="char-shop-action">
        {isEquipped ? (
          <button type="button" className="button button-secondary" onClick={onUnequip}>
            Unequip
          </button>
        ) : isOwned ? (
          <button type="button" className="button button-primary" onClick={onEquip}>
            Equip
          </button>
        ) : isGated ? (
          <button type="button" className="button button-secondary" disabled>
            Locked
          </button>
        ) : (
          <button
            type="button"
            className="button button-primary"
            disabled={!canAfford}
            onClick={onBuy}
          >
            {priceGems > 0 ? `Unlock for ${priceGems} 💎` : `Buy for ${priceCoins} 🪙`}
          </button>
        )}
      </div>
    </article>
  );
}


