'use client';

import React, { type ReactNode } from 'react';
import type { CharacterAppearance, CharacterEquipment, EquipmentItem, ItemStatus } from './types';
import { IllustratedAvatar } from './avatar-engine';
import { ItemIllustration } from './item-icons';

export { IllustratedAvatar } from './avatar-engine';
export { ItemIllustration } from './item-icons';

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
  size?: 'small' | 'large';
  showPedestal?: boolean;
}) {
  return (
    <div className={`char-avatar-wrapper char-avatar-wrapper-${size}`}>
      <IllustratedAvatar
        appearance={appearance}
        equipment={equipment}
        size={size === 'small' ? 'small' : 'large'}
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
  unlocked: 'Unlocked',
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
        <strong>{item.name}</strong>
        <small>{status === 'locked' ? requirementCopy : ITEM_STATUS_LABEL[status]}</small>
      </div>
      {status === 'unlocked' && (
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

