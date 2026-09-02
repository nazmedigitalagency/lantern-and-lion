'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getRegions } from '../adventure/world-data';
import { getRegionStatus, requirementsMet } from '../adventure/progression';
import { GameHUD, LevelUpModal, XPToastStack } from '../lib/economy/components';
import { getTransactions } from '../lib/economy/wallet-service';
import { useWalletSync } from '../lib/economy/use-wallet-sync';
import { getSkillProfile } from '../lib/skill-profile';
import {
  AppearanceSwatch,
  CharacterAvatar,
  InventoryItemCard,
  ItemIllustration,
  ShopItemCard,
  SkillStars,
  StatChip,
} from './components';
import { EQUIPMENT_SLOTS, getAppearanceOptionsForSlot, getItem, getItemsForSlot } from './catalog';
import {
  describeRequirement,
  getAchievementsSummary,
  getItemsForSlotWithStatus,
  type WorldContext,
} from './progression';
import {
  isItemOwned,
  purchaseItem,
} from './inventory-service';
import {
  hasActiveSession,
  loadWorldContext,
  readActiveProfile,
  readAppearance,
  readCharacterName,
  readEquipment,
  saveAppearance,
  saveCharacterName,
  saveEquipment,
  type PlayerProfile,
} from './storage';
import type { CharacterAppearance, CharacterEquipment, EquipmentItem, EquipmentSlot } from './types';
import TeenSidebar from '../teen-dashboard/TeenSidebar';

type Tab = 'overview' | 'customize' | 'shop' | 'inventory' | 'skills';

export function CharacterBuilder({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ctx, setCtx] = useState<WorldContext>({ moduleProgress: {}, masteredQuestIds: [], kind: 'child' });
  const [appearance, setAppearance] = useState<CharacterAppearance>({ skinTone: 'honey', hairStyle: 'curls', face: 'smile' });
  const [equipment, setEquipment] = useState<CharacterEquipment>({});
  const [name, setName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [activeSlot, setActiveSlot] = useState<EquipmentSlot>('headwear');
  const [shopCategory, setShopCategory] = useState<EquipmentSlot>('clothing');
  const [shopNotice, setShopNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasActiveSession()) {
        if (!embedded) router.replace('/');
        return;
      }
      const activeProfile = readActiveProfile();
      setProfile(activeProfile);
      setCtx(loadWorldContext(activeProfile.id, activeProfile.kind));
      setAppearance(readAppearance(activeProfile.id));
      setEquipment(readEquipment(activeProfile.id));
      setName(readCharacterName(activeProfile.id, activeProfile.name));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router, embedded]);

  const achievements = useMemo(() => getAchievementsSummary(ctx), [ctx]);
  const dashboardHref = profile?.kind === 'teen' ? '/teen-dashboard' : '/child-dashboard';

  const { wallet, levelInfo, toasts, dismissToast, levelUpEvent, dismissLevelUp } = useWalletSync(profile?.id ?? null, ctx);
  const recentTransactions = profile ? getTransactions(profile.id, 8) : [];
  const skillProfile = profile ? getSkillProfile(profile.id) : null;

  function updateAppearance(slot: keyof CharacterAppearance, value: string) {
    if (!profile) return;
    const next = { ...appearance, [slot]: value };
    setAppearance(next);
    saveAppearance(profile.id, next);
    setSaveNotice('Appearance updated!');
    window.setTimeout(() => setSaveNotice(null), 2500);
  }

  function equip(slot: EquipmentSlot, itemId: string) {
    if (!profile) return;
    const next = { ...equipment, [slot]: itemId };
    setEquipment(next);
    saveEquipment(profile.id, next);
    setSaveNotice('Gear equipped!');
    window.setTimeout(() => setSaveNotice(null), 2500);
  }

  function unequip(slot: EquipmentSlot) {
    if (!profile) return;
    const next = { ...equipment };
    delete next[slot];
    setEquipment(next);
    saveEquipment(profile.id, next);
    setSaveNotice('Gear unequipped.');
    window.setTimeout(() => setSaveNotice(null), 2500);
  }

  function handleBuy(item: EquipmentItem) {
    if (!profile) return;
    const res = purchaseItem(profile.id, item);
    if (res.success) {
      setShopNotice({ type: 'success', message: res.message });
      equip(item.slot, item.id);
    } else {
      setShopNotice({ type: 'error', message: res.error });
    }
    window.setTimeout(() => setShopNotice(null), 3500);
  }

  function submitName() {
    if (!profile) return;
    const clean = nameDraft.trim().slice(0, 24);
    if (clean) {
      setName(clean);
      saveCharacterName(profile.id, clean);
    }
    setEditingName(false);
  }

  const specialSlotItem = equipment.special;
  const companionItem = equipment.pet || (specialSlotItem && getItem(specialSlotItem)?.isCompanion ? specialSlotItem : null);

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Opening your character…</p>
      </main>
    );
  }

  const body = (
    <>
      <div className="adv-body char-body">
        {onClose && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
            <button
              type="button"
              className="button button-danger"
              onClick={onClose}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
            >
              ✕ Close
            </button>
          </div>
        )}
        <section className="char-hero">
          <div className="char-avatar-hero-display">
            <CharacterAvatar appearance={appearance} equipment={equipment} size="large" showPedestal={true} />
            {saveNotice && (
              <div className="char-saved-badge" aria-live="polite">
                ✨ {saveNotice}
              </div>
            )}
          </div>
          <div className="char-hero-info">
            {editingName ? (
              <form
                className="char-name-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitName();
                }}
              >
                <input autoFocus value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} maxLength={24} aria-label="Character name" />
                <button type="submit" className="button button-primary">Save</button>
              </form>
            ) : (
              <button type="button" className="char-name-edit" onClick={() => { setNameDraft(name); setEditingName(true); }}>
                <h1>{name}</h1>
                <small>✏️ Edit display name</small>
              </button>
            )}
            <p className="char-title-line">
              Level {levelInfo.level} · <b>{levelInfo.title}</b>
            </p>
            <div className="char-xp-bar">
              <i style={{ width: `${levelInfo.progressPercent}%` }} />
            </div>
            <small className="char-xp-caption">
              {levelInfo.nextLevelXp === null
                ? 'Top level reached for now!'
                : `${levelInfo.xpIntoLevel} / ${levelInfo.nextLevelXp - levelInfo.currentLevelXp} XP to Level ${levelInfo.level + 1}`}
            </small>

            {/* Quick Currency Summary Bar */}
            <div className="char-quick-currencies" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <span className="char-wallet-chip">⭐ <b>{wallet.xp.toLocaleString()}</b> XP</span>
              <span className="char-wallet-chip">🪙 <b>{wallet.coins.toLocaleString()}</b> Coins</span>
              <span className="char-wallet-chip">💎 <b>{wallet.gems.toLocaleString()}</b> Gems</span>
            </div>
          </div>
        </section>

        <nav className="child-nav char-tab-nav" aria-label="Character sections">
          <button aria-pressed={tab === 'overview'} className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
          <button aria-pressed={tab === 'customize'} className={tab === 'customize' ? 'active' : ''} onClick={() => setTab('customize')}>🎨 Customize</button>
          <button aria-pressed={tab === 'shop'} className={tab === 'shop' ? 'active' : ''} onClick={() => setTab('shop')}>🛍️ Lantern Shop</button>
          <button aria-pressed={tab === 'inventory'} className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}>🎒 Inventory</button>
          <button aria-pressed={tab === 'skills'} className={tab === 'skills' ? 'active' : ''} onClick={() => setTab('skills')}>📊 Skills</button>
        </nav>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="char-overview">
            <div className="char-stat-grid">
              <StatChip icon="🗺️" value={`${achievements.regionsDiscovered}/${achievements.totalRegions}`} label="Regions discovered" />
              <StatChip icon="✅" value={achievements.questsCompleted} label="Quests completed" />
              <StatChip icon="⭐" value={achievements.questsMastered} label="Quests mastered" />
              <StatChip icon="💎" value={achievements.collectiblesFound} label="Collectibles found" />
            </div>

            <section className="char-panel char-companion-panel">
              <div className="char-companion-panel-header">
                <div>
                  <p className="child-kicker">Companion &amp; Artifact</p>
                  <h3 className="char-companion-title">Faith Travel Companion</h3>
                </div>
                {companionItem && (
                  <span className="char-companion-active-badge">Equipped ✨</span>
                )}
              </div>
              {companionItem ? (
                <div className="char-companion-display">
                  <div className="char-companion-icon-frame">
                    <ItemIllustration itemId={companionItem} size={56} />
                  </div>
                  <div className="char-companion-info">
                    <strong>{getItem(companionItem)?.name || 'Faith Companion'}</strong>
                    <p className="char-companion-line">Travels alongside you on your biblical journeys with glowing light.</p>
                  </div>
                  <button
                    type="button"
                    className="button button-secondary char-companion-change-btn"
                    onClick={() => { setTab('inventory'); setActiveSlot('special'); }}
                  >
                    Change Companion
                  </button>
                </div>
              ) : (
                <div className="char-companion-empty-box">
                  <div className="char-companion-empty-icon" aria-hidden="true">
                    🦁
                  </div>
                  <div className="char-companion-empty-info">
                    <strong>No Companion Equipped Yet</strong>
                    <p>Unlock loyal Bible companions like the Lion Cub, Lost Sheep, or Peace Dove to journey with you!</p>
                  </div>
                  <button
                    type="button"
                    className="button button-primary char-companion-browse-btn"
                    onClick={() => { setTab('shop'); setShopCategory('special'); }}
                  >
                    🐾 Browse Pets in Shop →
                  </button>
                </div>
              )}
            </section>

            <section className="char-panel">
              <p className="child-kicker">Transaction Ledger</p>
              {recentTransactions.length > 0 ? (
                <ul className="char-transaction-list">
                  {recentTransactions.map((t) => (
                    <li key={t.id}>
                      <span className={t.amount >= 0 ? 'char-tx-positive' : 'char-tx-negative'}>
                        {t.amount >= 0 ? '+' : '−'}{Math.abs(t.amount)} {t.type === 'xp' ? 'XP' : t.type === 'coins' ? '🪙 Coins' : '💎 Gems'}
                      </span>
                      <small>{t.description}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="char-companion-line">No transactions yet — complete lessons, quests, or games to earn XP and Coins!</p>
              )}
            </section>

            <section className="char-panel">
              <p className="child-kicker">Adventure progress</p>
              <div className="char-region-list">
                {getRegions(ctx.kind).map((region) => {
                  const status = getRegionStatus(region, ctx);
                  return (
                    <div key={region.id} className={`char-region-row adv-region-${status}`}>
                      <span aria-hidden="true">{status === 'locked' ? '🔒' : region.icon}</span>
                      <strong>{region.name}</strong>
                      <small>{status === 'locked' ? 'Locked' : status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In progress' : 'Ready'}</small>
                    </div>
                  );
                })}
              </div>
              <Link href="/adventure" className="button button-secondary char-adventure-link">Open Adventure World →</Link>
            </section>
          </div>
        )}

        {/* CUSTOMIZE TAB */}
        {tab === 'customize' && (
          <div className="char-customize">
            <section className="char-panel">
              <p className="child-kicker">Skin tone</p>
              <div className="char-swatch-row">
                {getAppearanceOptionsForSlot('skinTone').map((option) => (
                  <AppearanceSwatch key={option.id} active={appearance.skinTone === option.id} onSelect={() => updateAppearance('skinTone', option.id)} label={option.name}>
                    <span className="char-swatch-color" style={{ background: option.value }} />
                  </AppearanceSwatch>
                ))}
              </div>
            </section>

            <section className="char-panel">
              <p className="child-kicker">Hair style &amp; texture</p>
              <div className="char-swatch-row">
                {getAppearanceOptionsForSlot('hairStyle').map((option) => (
                  <AppearanceSwatch key={option.id} active={appearance.hairStyle === option.id} onSelect={() => updateAppearance('hairStyle', option.id)} label={option.name}>
                    <span className={`char-swatch-hair char-hair-${option.value}`} />
                  </AppearanceSwatch>
                ))}
              </div>
            </section>

            <section className="char-panel">
              <p className="child-kicker">Expression &amp; Face</p>
              <div className="char-swatch-row">
                {getAppearanceOptionsForSlot('face').map((option) => (
                  <AppearanceSwatch key={option.id} active={appearance.face === option.id} onSelect={() => updateAppearance('face', option.id)} label={option.name}>
                    <span className="char-swatch-emoji" aria-hidden="true">
                      {option.id === 'smile' ? '🙂' : option.id === 'grin' ? '😄' : option.id === 'calm' ? '😌' : option.id === 'wonder' ? '😲' : option.id === 'thinking' ? '🤔' : option.id === 'celebrating' ? '🥳' : option.id === 'victory' ? '😉' : '🙂'}
                    </span>
                  </AppearanceSwatch>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* LANTERN SHOP TAB */}
        {tab === 'shop' && (
          <div className="char-shop-view">
            {shopNotice && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  backgroundColor: shopNotice.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: shopNotice.type === 'success' ? '#047857' : '#b91c1c',
                  border: `1px solid ${shopNotice.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                role="alert"
              >
                {shopNotice.type === 'success' ? '🎉' : '⚠️'} {shopNotice.message}
              </div>
            )}

            <div className="char-slot-tabs">
              {EQUIPMENT_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  className={shopCategory === slot.id ? 'active' : ''}
                  aria-pressed={shopCategory === slot.id}
                  onClick={() => setShopCategory(slot.id)}
                >
                  <span aria-hidden="true">{slot.icon}</span> {slot.label}
                </button>
              ))}
            </div>

            <div className="char-item-grid">
              {getItemsForSlot(shopCategory).map((item) => {
                const owned = isItemOwned(profile.id, item.id);
                const isEquipped = equipment[item.slot] === item.id;
                const isGated = !requirementsMet(item.unlockRequirement, ctx);
                const gateReason = isGated
                  ? item.unlockRequirement.map((req) => describeRequirement(req, ctx.kind)).join(' and ')
                  : undefined;
                const priceCoins = item.priceCoins ?? 0;
                const priceGems = item.priceGems ?? 0;
                const canAfford = wallet.coins >= priceCoins && wallet.gems >= priceGems;

                return (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    isOwned={owned}
                    isEquipped={isEquipped}
                    isGated={isGated}
                    gateReason={gateReason}
                    onBuy={() => handleBuy(item)}
                    onEquip={() => equip(item.slot, item.id)}
                    onUnequip={() => unequip(item.slot)}
                    canAfford={canAfford}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* INVENTORY TAB */}
        {tab === 'inventory' && (
          <div className="char-inventory">
            <div className="char-slot-tabs">
              {EQUIPMENT_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  className={activeSlot === slot.id ? 'active' : ''}
                  aria-pressed={activeSlot === slot.id}
                  onClick={() => setActiveSlot(slot.id)}
                >
                  <span aria-hidden="true">{slot.icon}</span> {slot.label}
                </button>
              ))}
            </div>
            <div className="char-item-grid">
              {getItemsForSlotWithStatus(activeSlot, ctx, equipment, profile.id).map(({ item, status }) => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  status={status}
                  requirementCopy={item.unlockRequirement.map((req) => describeRequirement(req, ctx.kind)).join(' and ')}
                  onEquip={() => equip(item.slot, item.id)}
                  onUnequip={() => unequip(item.slot)}
                />
              ))}
            </div>
          </div>
        )}

        {/* SKILLS TAB */}
        {tab === 'skills' && skillProfile && (
          <div className="char-overview">
            <section className="char-panel">
              <p className="child-kicker">What {name || 'you'}’re learning</p>
              <p className="char-companion-line">Every Arcade game — Scripture Maze, Memory Match, Lightning Quiz, and the rest — feeds this profile. It grows the more you play.</p>
              {skillProfile.skills.length > 0 ? (
                <div className="char-skill-list">
                  {skillProfile.skills.map((s) => (
                    <div key={s.skill} className="char-skill-row">
                      <span>{s.label}</span>
                      <SkillStars stars={s.stars} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="char-companion-line">Play a game in the Lantern Arcade to start building your skill profile.</p>
              )}
            </section>

            {skillProfile.games.length > 0 && (
              <section className="char-panel">
                <p className="child-kicker">Arcade performance</p>
                <div className="char-game-performance-list">
                  {skillProfile.games.map((g) => (
                    <div key={g.gameId} className="char-game-performance-row">
                      <span aria-hidden="true">{g.icon}</span>
                      <strong>{g.name}</strong>
                      <span className="char-game-performance-bar"><i style={{ width: `${g.avgAccuracy}%` }} /></span>
                      <b>{g.avgAccuracy}%</b>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Link href="/arcade" className="button button-secondary char-adventure-link">Open Lantern Arcade →</Link>
          </div>
        )}
      </div>

      <XPToastStack toasts={toasts} onDismiss={dismissToast} />

      {levelUpEvent && (
        <LevelUpModal
          previousLevel={levelUpEvent.previousLevel}
          newLevel={levelUpEvent.newLevel}
          newTitle={levelInfo.title}
          xp={wallet.xp}
          unlockedItems={levelUpEvent.unlockedItems}
          onContinue={dismissLevelUp}
        />
      )}
    </>
  );

  if (embedded) return body;

  const isTeen = profile.kind === 'teen';

  const header = (
    <header className="child-topbar adv-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isTeen && (
          <button
            type="button"
            className="teen-menu-trigger"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        )}
        <Link href={dashboardHref} className="child-logo">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span>
            <strong>Character &amp; Style</strong>
            <small>{isTeen ? 'Lion’s Den' : 'Lantern Club'}</small>
          </span>
        </Link>
      </div>
      <div className="adv-topbar-center">
        <GameHUD level={levelInfo.level} wallet={wallet} />
      </div>
      <div className="child-header-actions char-topbar-actions">
        <Link href="/adventure" className="char-nav-btn char-nav-adventure">
          <span aria-hidden="true">🗺️</span>
          <span>Adventure</span>
        </Link>
        <Link href={dashboardHref} className="char-nav-btn char-nav-back">
          <span aria-hidden="true">←</span>
          <span>Dashboard</span>
        </Link>
      </div>
    </header>
  );

  if (!isTeen) {
    return (
      <main className="adventure-page char-page">
        {header}
        {body}
      </main>
    );
  }

  return (
    <main className="adventure-page char-page teen">
      <div className="teen-body-container">
        <TeenSidebar
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />
        <div className="teen-main-canvas">
          {header}
          {body}
        </div>
      </div>
    </main>
  );
}

export default function CharacterPage() {
  return <CharacterBuilder />;
}
