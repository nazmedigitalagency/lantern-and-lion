'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getRegions } from '../adventure/world-data';
import { getRegionStatus } from '../adventure/progression';
import { GameHUD, LevelUpModal, XPToastStack } from '../lib/economy/components';
import { getTransactions } from '../lib/economy/wallet-service';
import { useWalletSync } from '../lib/economy/use-wallet-sync';
import { getSkillProfile } from '../lib/skill-profile';
import { AppearanceSwatch, CharacterAvatar, InventoryItemCard, ItemIllustration, SkillStars, StatChip } from './components';
import { EQUIPMENT_SLOTS, getAppearanceOptionsForSlot, getItem } from './catalog';
import {
  describeRequirement,
  getAchievementsSummary,
  getItemsForSlotWithStatus,
  type WorldContext,
} from './progression';
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
import type { CharacterAppearance, CharacterEquipment, EquipmentSlot } from './types';

type Tab = 'overview' | 'skills' | 'customize' | 'inventory';

export default function CharacterPage() {
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasActiveSession()) {
        router.replace('/');
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
  }, [router]);

  const achievements = useMemo(() => getAchievementsSummary(ctx), [ctx]);
  const dashboardHref = profile?.kind === 'teen' ? '/teen-dashboard' : '/child-dashboard';

  const { wallet, levelInfo, toasts, dismissToast, levelUpEvent, dismissLevelUp } = useWalletSync(profile?.id ?? null, ctx);
  // Cheap read (capped, tiny list) — recomputed every render so it stays in
  // sync with `wallet` without needing a memo dependency hack.
  const recentTransactions = profile ? getTransactions(profile.id, 6) : [];
  // Same "cheap read, recompute every render" approach as recentTransactions above —
  // stays in sync with newly-played arcade sessions without a memo dependency hack.
  const skillProfile = profile ? getSkillProfile(profile.id) : null;

  function updateAppearance(slot: keyof CharacterAppearance, value: string) {
    if (!profile) return;
    const next = { ...appearance, [slot]: value };
    setAppearance(next);
    saveAppearance(profile.id, next);
  }

  function equip(slot: EquipmentSlot, itemId: string) {
    if (!profile) return;
    const next = { ...equipment, [slot]: itemId };
    setEquipment(next);
    saveEquipment(profile.id, next);
  }

  function unequip(slot: EquipmentSlot) {
    if (!profile) return;
    const next = { ...equipment };
    delete next[slot];
    setEquipment(next);
    saveEquipment(profile.id, next);
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

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Opening your character…</p>
      </main>
    );
  }

  return (
    <main className="adventure-page char-page">
      <header className="child-topbar adv-topbar">
        <Link href={dashboardHref} className="child-logo">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span>
            <strong>Character</strong>
            <small>Lantern &amp; Lion</small>
          </span>
        </Link>
        <div className="adv-topbar-center">
          <GameHUD level={levelInfo.level} wallet={wallet} />
        </div>
        <div className="child-header-actions">
          <Link href="/adventure" className="help-button adv-cross-link">🗺️ Adventure</Link>
          <Link href={dashboardHref} className="help-button">← Back to dashboard</Link>
        </div>
      </header>

      <div className="adv-body char-body">
        <section className="char-hero">
          <div className="char-avatar-hero-display">
            <CharacterAvatar appearance={appearance} equipment={equipment} size="large" showPedestal={true} />
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
                <small>✏️ Edit name</small>
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
          </div>
        </section>

        <nav className="child-nav char-tab-nav" aria-label="Character sections">
          <button aria-pressed={tab === 'overview'} className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
          <button aria-pressed={tab === 'skills'} className={tab === 'skills' ? 'active' : ''} onClick={() => setTab('skills')}>Skills</button>
          <button aria-pressed={tab === 'customize'} className={tab === 'customize' ? 'active' : ''} onClick={() => setTab('customize')}>Customize</button>
          <button aria-pressed={tab === 'inventory'} className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}>Inventory</button>
        </nav>

        {tab === 'overview' && (
          <div className="char-overview">
            <div className="char-stat-grid">
              <StatChip icon="🗺️" value={`${achievements.regionsDiscovered}/${achievements.totalRegions}`} label="Regions discovered" />
              <StatChip icon="✅" value={achievements.questsCompleted} label="Quests completed" />
              <StatChip icon="⭐" value={achievements.questsMastered} label="Quests mastered" />
              <StatChip icon="💎" value={achievements.collectiblesFound} label="Collectibles found" />
            </div>

            <section className="char-panel">
              <p className="child-kicker">Wallet</p>
              <div className="char-wallet-row">
                <span className="char-wallet-chip">⭐ <b>{wallet.xp.toLocaleString()}</b> XP</span>
                <span className="char-wallet-chip">🪙 <b>{wallet.coins.toLocaleString()}</b> coins</span>
                <span className="char-wallet-chip">💎 <b>{wallet.gems.toLocaleString()}</b> gems</span>
              </div>
              {recentTransactions.length > 0 ? (
                <ul className="char-transaction-list">
                  {recentTransactions.map((t) => (
                    <li key={t.id}>
                      <span className={t.amount >= 0 ? 'char-tx-positive' : 'char-tx-negative'}>
                        {t.amount >= 0 ? '+' : '−'}{Math.abs(t.amount)} {t.type === 'xp' ? 'XP' : t.type === 'coins' ? '🪙' : '💎'}
                      </span>
                      <small>{t.description}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="char-companion-line">No transactions yet — complete a quest to start earning.</p>
              )}
            </section>

            <section className="char-panel">
              <p className="child-kicker">Companion &amp; Artifact</p>
              {specialSlotItem ? (
                <div className="char-companion-display">
                  <ItemIllustration itemId={specialSlotItem} size={54} />
                  <div>
                    <strong>{getItem(specialSlotItem)?.name}</strong>
                    <p className="char-companion-line">Travels alongside you on your biblical journeys with glowing light.</p>
                  </div>
                </div>
              ) : (
                <p className="char-companion-line">No companion yet — some Special items found on your adventure can travel with you.</p>
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

        {tab === 'skills' && skillProfile && (
          <div className="char-overview">
            <section className="char-panel">
              <p className="child-kicker">What {name || 'you'}’re learning</p>
              <p className="char-companion-line">Every Arcade game — Scripture Maze, Memory Match, Lightning Quiz, and the rest — feeds this profile. It grows the more you play, any game.</p>
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
              <p className="child-kicker">Hair style</p>
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
                    <span className="char-swatch-emoji" aria-hidden="true">{option.value}</span>
                  </AppearanceSwatch>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'inventory' && (
          <div className="char-inventory">
            <div className="char-slot-tabs">
              {EQUIPMENT_SLOTS.map((slot) => (
                <button key={slot.id} className={activeSlot === slot.id ? 'active' : ''} aria-pressed={activeSlot === slot.id} onClick={() => setActiveSlot(slot.id)}>
                  {slot.label}
                </button>
              ))}
            </div>
            <div className="char-item-grid">
              {getItemsForSlotWithStatus(activeSlot, ctx, equipment).map(({ item, status }) => (
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
    </main>
  );
}
