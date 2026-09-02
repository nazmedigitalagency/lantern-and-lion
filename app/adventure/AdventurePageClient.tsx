'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CharacterAvatar } from '../character/components';
import { readAppearance, readEquipment } from '../character/storage';
import type { CharacterAppearance, CharacterEquipment } from '../character/types';
import { LevelUpModal, XPToastStack } from '../lib/economy/components';
import { useWalletSync } from '../lib/economy/use-wallet-sync';
import { useDialogA11y } from '../lib/use-dialog';
import {
  CollectiblesPouchModal,
  KnowledgeBossArena,
  MemoryVerseTrainer,
  QuestCard,
  StoryChapterReader,
  WorldMapCanvas,
} from './components';
import {
  describeRequirement,
  getCollectedCollectibles,
  getCurrentRegionId,
  getNextMissionRecommendation,
  getQuestEstimatedMinutes,
  getQuestStatus,
  getRegionCompletionPercent,
  getRegionStatus,
  isBossDefeated,
  isChapterCompleted,
  type WorldContext,
} from './progression';
import {
  hasActiveSession,
  loadWorldContext,
  markBossCompleted,
  markChapterCompleted,
  markSecretDiscovered,
  readActiveProfile,
  type PlayerProfile,
} from './storage';
import { canonicalRegions, getQuestsForRegion, getRegion, getRegions } from './world-data';
import type { RegionId, RegionStatus, StoryChapter } from './types';
import TeenSidebar from '../teen-dashboard/TeenSidebar';

// Teen ("Lion's Den") vs. child color tokens for this page's inline styles.
// Kept as a small palette object rather than a class-based theme since most
// of this page is built from ad hoc inline `style` objects.
const CHILD_COLORS = {
  bg: '#FEF9F3', text: '#1E293B', textMuted: '#64748B', accent: '#1D4ED8',
  headerBg: 'rgba(255, 255, 255, 0.92)', headerBorder: '#1E293B',
  cardBg: '#EFF6FF', cardBorder: '#1E293B', cardShadow: '#3B82F6',
  surfaceAlt: '#F1F5F9', surfaceAltBorder: '#E2E8F0',
  modalBg: '#ffffff', modalBorder: '#1E293B',
  lockedBg: '#FEF2F2', lockedBorder: '#DC2626', lockedTitle: '#B91C1C',
  unlockedText: '#15803D', lockedText: '#B91C1C',
  gold: '#D97706', tileBg: '#EFF6FF', tileBorder: '#1E293B',
  secretUndiscoveredBg: '#f4f8fc', secretUndiscoveredBorder: '#94a3b8',
  ctaBg: undefined as string | undefined, ctaText: undefined as string | undefined, ctaShadow: undefined as string | undefined,
};
const TEEN_COLORS = {
  bg: 'var(--teen-bg)', text: 'var(--teen-text)', textMuted: 'var(--teen-text-muted)', accent: 'var(--teen-accent-light)',
  headerBg: 'var(--teen-surface)', headerBorder: 'var(--teen-border)',
  cardBg: 'var(--teen-surface-alt)', cardBorder: 'var(--teen-border)', cardShadow: 'var(--teen-cobalt)',
  surfaceAlt: 'var(--teen-surface-alt)', surfaceAltBorder: 'var(--teen-border)',
  modalBg: 'var(--teen-surface)', modalBorder: 'var(--teen-border)',
  lockedBg: 'var(--teen-error-bg)', lockedBorder: 'var(--teen-coral)', lockedTitle: 'var(--teen-coral-dark)',
  unlockedText: 'var(--teen-success-text)', lockedText: 'var(--teen-coral-dark)',
  gold: 'var(--teen-gold-dark)', tileBg: 'var(--teen-surface-alt)', tileBorder: 'var(--teen-border)',
  secretUndiscoveredBg: 'var(--teen-surface-alt)', secretUndiscoveredBorder: 'var(--teen-border)',
  ctaBg: 'var(--teen-cta-bg)', ctaText: 'var(--teen-cta-text)', ctaShadow: 'none',
};

type LocationTab = 'chapters' | 'games' | 'memory-verse' | 'boss' | 'secrets';

export function AdventureWorld({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [appearance, setAppearance] = useState<CharacterAppearance>({ skinTone: 'honey', hairStyle: 'curls', face: 'smile' });
  const [equipment, setEquipment] = useState<CharacterEquipment>({});
  const [ctx, setCtx] = useState<WorldContext>({
    moduleProgress: {},
    masteredQuestIds: [],
    completedChapterIds: [],
    completedBossIds: [],
    discoveredSecretIds: [],
    collectedCollectibleIds: [],
    kind: 'child',
  });

  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>('creation');
  const [locationTab, setLocationTab] = useState<LocationTab>('chapters');
  const [showRegionModal, setShowRegionModal] = useState(false);
  const closeRegionModal = useCallback(() => setShowRegionModal(false), []);
  const regionModalRef = useDialogA11y<HTMLElement>(showRegionModal, closeRegionModal);
  const [showPouch, setShowPouch] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function refresh() {
    const active = readActiveProfile();
    setProfile(active);
    const loadedCtx = loadWorldContext(active.id, active.kind);
    setCtx(loadedCtx);
    const app = readAppearance(active.id);
    const eq = readEquipment(active.id);
    setAppearance(app);
    setEquipment(eq);

    const currentReg = getCurrentRegionId(loadedCtx);
    setSelectedRegionId(currentReg);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasActiveSession()) {
        if (!embedded) router.replace('/child-access');
        return;
      }
      refresh();
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router, embedded]);

  const regions = useMemo(() => getRegions(ctx.kind), [ctx.kind]);
  const selectedRegion = useMemo(
    () => getRegion(selectedRegionId, ctx.kind) || regions[0] || canonicalRegions[0],
    [selectedRegionId, ctx.kind, regions]
  );
  const nextMission = useMemo(() => getNextMissionRecommendation(ctx), [ctx]);
  const collectibles = useMemo(() => getCollectedCollectibles(ctx), [ctx]);

  const regionStatuses = useMemo(() => {
    const map: Record<string, RegionStatus> = {};
    regions.forEach((r) => {
      map[r.id] = getRegionStatus(r, ctx);
    });
    return map;
  }, [regions, ctx]);

  const completionPercents = useMemo(() => {
    const map: Record<string, number> = {};
    regions.forEach((r) => {
      map[r.id] = getRegionCompletionPercent(r, ctx);
    });
    return map;
  }, [regions, ctx]);

  const { wallet, levelInfo, toasts, dismissToast, levelUpEvent, dismissLevelUp } = useWalletSync(profile?.id ?? null, ctx);

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span />
        <p>Entering the Bible Adventure World…</p>
      </main>
    );
  }

  const isTeen = profile.kind === 'teen';
  const dashboardHref = isTeen ? '/teen-dashboard' : '/child-dashboard';
  const regionQuests = getQuestsForRegion(selectedRegion.id, ctx.kind);
  const regionStatus = regionStatuses[selectedRegion.id] || 'available';
  const isRegionUnlocked = regionStatus !== 'locked';
  const c = isTeen ? TEEN_COLORS : CHILD_COLORS;
  const ctaStyle = isTeen ? { background: c.ctaBg, color: c.ctaText, boxShadow: c.ctaShadow } : {};

  function handleCompleteChapter(chapter: StoryChapter) {
    if (!profile) return;
    markChapterCompleted(profile.id, chapter.id);
    setCtx((prev) => ({
      ...prev,
      completedChapterIds: [...(prev.completedChapterIds || []), chapter.id],
    }));
    setNotice(`🎉 Completed ${chapter.title}! (+40 XP)`);
    window.setTimeout(() => setNotice(null), 3500);
  }

  function handleBossVictory() {
    if (!profile) return;
    const rewards = selectedRegion.boss.reward;
    markBossCompleted(profile.id, selectedRegion.boss.id, rewards);
    setCtx((prev) => ({
      ...prev,
      completedBossIds: [...(prev.completedBossIds || []), selectedRegion.boss.id],
    }));
    setNotice(`👑 Mastered ${selectedRegion.name}! Next location unlocked!`);
    window.setTimeout(() => setNotice(null), 4000);
  }

  function handleDiscoverSecret(secretId: string, coins: number, gems: number) {
    if (!profile) return;
    markSecretDiscovered(profile.id, secretId, { coins, gems });
    setCtx((prev) => ({
      ...prev,
      discoveredSecretIds: [...(prev.discoveredSecretIds || []), secretId],
    }));
    setNotice(`✨ Discovered a secret! (+${coins} Coins, +${gems} Gems)`);
    window.setTimeout(() => setNotice(null), 3500);
  }

  const body = (
    <>
      <div style={{ maxWidth: embedded ? 'none' : '1400px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: onClose ? 'space-between' : 'flex-end', marginBottom: '1rem', alignItems: 'center' }}>
          {onClose && (
            <button
              type="button"
              className="button button-danger"
              onClick={onClose}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
            >
              ✕ Close
            </button>
          )}
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setShowPouch(true)}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
          >
            🎒 Collectibles ({collectibles.length})
          </button>
        </div>
        {notice && (
          <div
            style={{
              background: '#EFFDF4',
              color: '#15803D',
              border: '1.5px solid #15803D',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              marginBottom: '1rem',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {notice}
          </div>
        )}

        {/* Hero Mission Bar */}
        <section
          className="adv-hero-bar"
          style={{
            background: c.cardBg,
            border: `2px solid ${c.cardBorder}`,
            borderRadius: '18px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: `5px 5px 0 ${c.cardShadow}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, flexShrink: 0 }}>
              <CharacterAvatar appearance={appearance} equipment={equipment} size="small" showPedestal={false} />
            </div>
            <div>
              <small style={{ color: c.accent, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Active Expedition
              </small>
              <h2 style={{ margin: '0 0 0.2rem 0', fontSize: '1.2rem', fontWeight: 800, color: c.text }}>
                {nextMission.title}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: c.textMuted }}>{nextMission.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            className="button button-primary adv-hero-cta"
            onClick={() => {
              setSelectedRegionId(nextMission.region.id);
              if (nextMission.type === 'boss') setLocationTab('boss');
              else setLocationTab('chapters');
              setShowRegionModal(true);
            }}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', fontWeight: 800, ...ctaStyle }}
          >
            ▶ Continue Adventure →
          </button>
        </section>

        {/* 🗺️ Illustrated Interactive World Map */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: c.text }}>The Canonical Bible World Map</h2>
              <small style={{ color: c.textMuted }}>Tap any land to explore stories, games, memory verses, and Knowledge Bosses.</small>
            </div>
          </div>

          <WorldMapCanvas
            regions={regions}
            currentRegionId={selectedRegionId}
            regionStatuses={regionStatuses}
            completionPercents={completionPercents}
            playerAppearance={appearance}
            playerEquipment={equipment}
            isTeen={isTeen}
            onSelectRegion={(reg) => {
              setSelectedRegionId(reg.id);
              setLocationTab('chapters');
              setShowRegionModal(true);
            }}
          />
        </section>

        {/* 📍 Selected Location Detail Explorer — a popup over the map instead
            of a section further down the page, since nothing on the map
            hinted that scrolling would reveal it. */}
        {showRegionModal && (
        <div
          role="presentation"
          onClick={() => setShowRegionModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            background: 'rgba(30, 41, 59, 0.55)',
          }}
        >
        <section
          ref={regionModalRef}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 'min(880px, 100%)',
            maxHeight: '88vh',
            overflowY: 'auto',
            background: c.modalBg,
            border: `2px solid ${c.modalBorder}`,
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 15px 35px rgba(16, 42, 67, 0.35)',
          }}
        >
          <button
            type="button"
            onClick={() => setShowRegionModal(false)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              width: 34,
              height: 34,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              border: '1.5px solid var(--error-dark)',
              background: 'var(--error)',
              color: 'var(--white)',
              fontSize: '1rem',
              cursor: 'pointer',
              zIndex: 5,
            }}
          >
            ✕
          </button>
          {/* Location Header — desktop/tablet: icon + title + mastery in a row */}
          <div
            className="adv-location-header adv-location-header-desktop"
            style={{
              borderBottom: `1px solid ${c.surfaceAltBorder}`,
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
              paddingRight: '2.75rem',
            }}
          >
            <span style={{ fontSize: '3.5rem' }}>{selectedRegion.icon}</span>
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: '#ffffff', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 700 }}>
                  {selectedRegion.scriptureRange}
                </span>
                <span style={{ fontSize: '0.75rem', color: isRegionUnlocked ? c.unlockedText : c.lockedText, fontWeight: 600 }}>
                  {isRegionUnlocked ? '✨ Unlocked Land' : '🔒 Locked Land'}
                </span>
              </div>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.6rem', fontWeight: 900, color: c.text }}>
                {selectedRegion.name}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: c.textMuted }}>{selectedRegion.summary}</p>
            </div>

            <div className="adv-mastery-block">
              <strong style={{ fontSize: '1.4rem', color: c.gold, display: 'block' }}>
                {completionPercents[selectedRegion.id] || 0}%
              </strong>
              <small style={{ color: c.textMuted, fontSize: '0.75rem' }}>Mastery</small>
            </div>
          </div>

          {/* Location Header — mobile: everything stacked in a single
              column (icon top-left, then each piece full-width) instead
              of squeezing a 3-column layout into a narrow screen. */}
          <div
            className="adv-location-header-mobile"
            style={{
              borderBottom: `1px solid ${c.surfaceAltBorder}`,
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
              paddingRight: '2.75rem',
            }}
          >
            <span style={{ fontSize: '2.75rem', display: 'block', marginBottom: '0.75rem' }}>{selectedRegion.icon}</span>
            <span
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                textAlign: 'center',
                fontSize: '0.8rem',
                background: '#3b82f6',
                color: '#ffffff',
                padding: '0.5rem 0.75rem',
                borderRadius: '9999px',
                fontWeight: 700,
                marginBottom: '0.6rem',
              }}
            >
              {selectedRegion.scriptureRange}
            </span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: isRegionUnlocked ? c.unlockedText : c.lockedText, fontWeight: 600, marginBottom: '0.5rem' }}>
              {isRegionUnlocked ? '✨ Unlocked Land' : '🔒 Locked Land'}
            </span>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 900, color: c.text }}>
              {selectedRegion.name}
            </h2>
            <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.85rem', color: c.textMuted }}>{selectedRegion.summary}</p>
            <div>
              <strong style={{ fontSize: '1.4rem', color: c.gold }}>
                {completionPercents[selectedRegion.id] || 0}%
              </strong>
              <small style={{ color: c.textMuted, fontSize: '0.75rem', marginLeft: '0.4rem' }}>Mastery</small>
            </div>
          </div>

          {!isRegionUnlocked ? (
            <div
              style={{
                background: c.lockedBg,
                border: `1.5px dashed ${c.lockedBorder}`,
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                color: c.textMuted,
              }}
            >
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🔒</span>
              <h3 style={{ color: c.lockedTitle, margin: '0 0 0.5rem 0' }}>This Land is Locked</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
                Requirements to unlock: {selectedRegion.unlockRequirement.map((req) => describeRequirement(req)).join(' and ')}.
              </p>
            </div>
          ) : (
            <>
              {/* Location Subtabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.4rem',
                  background: c.surfaceAlt,
                  border: `1.5px solid ${c.surfaceAltBorder}`,
                  borderRadius: '14px',
                  padding: '0.4rem',
                  marginBottom: '1.5rem',
                  overflowX: 'auto',
                }}
              >
                <button
                  type="button"
                  className={`button ${locationTab === 'chapters' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setLocationTab('chapters')}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', whiteSpace: 'nowrap', ...(locationTab === 'chapters' ? ctaStyle : {}) }}
                >
                  📖 Stories ({selectedRegion.chapters.length})
                </button>
                <button
                  type="button"
                  className={`button ${locationTab === 'games' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setLocationTab('games')}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', whiteSpace: 'nowrap', ...(locationTab === 'games' ? ctaStyle : {}) }}
                >
                  🎮 Arcade Games ({regionQuests.length})
                </button>
                <button
                  type="button"
                  className={`button ${locationTab === 'memory-verse' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setLocationTab('memory-verse')}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', whiteSpace: 'nowrap', ...(locationTab === 'memory-verse' ? ctaStyle : {}) }}
                >
                  📜 Memory Verse
                </button>
                <button
                  type="button"
                  className={`button ${locationTab === 'boss' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setLocationTab('boss')}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', whiteSpace: 'nowrap', ...(locationTab === 'boss' ? ctaStyle : {}) }}
                >
                  👑 Knowledge Boss
                </button>
                <button
                  type="button"
                  className={`button ${locationTab === 'secrets' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setLocationTab('secrets')}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', whiteSpace: 'nowrap', ...(locationTab === 'secrets' ? ctaStyle : {}) }}
                >
                  🎁 Secrets &amp; Collectibles
                </button>
              </div>

              {/* TAB 1: STORIES & CHAPTERS */}
              {locationTab === 'chapters' && (
                <div>
                  {selectedRegion.chapters.map((chapter) => (
                    <StoryChapterReader
                      key={chapter.id}
                      chapter={chapter}
                      isCompleted={isChapterCompleted(chapter.id, ctx)}
                      onComplete={() => handleCompleteChapter(chapter)}
                    />
                  ))}
                </div>
              )}

              {/* TAB 2: GAMES & QUIZZES */}
              {locationTab === 'games' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {regionQuests.map((quest) => {
                    const qStatus = getQuestStatus(quest, ctx);
                    const qMins = getQuestEstimatedMinutes(quest);

                    return (
                      <div key={quest.id} style={{ background: c.tileBg, borderRadius: '12px', padding: '1rem', border: `1.5px solid ${c.tileBorder}` }}>
                        <QuestCard
                          quest={quest}
                          status={qStatus}
                          title={quest.linkedArcadeGame?.title || 'Bible Quest'}
                          theme={selectedRegion.tagline}
                          estimatedMinutes={qMins}
                          onSelect={() => {
                            if (quest.linkedArcadeGame) {
                              router.push(quest.linkedArcadeGame.href);
                            }
                          }}
                        />
                        {quest.linkedArcadeGame && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <Link href={quest.linkedArcadeGame.href} className="button button-primary" style={{ fontSize: '0.8rem', padding: '0.6rem 0.8rem', width: '100%', justifyContent: 'center', ...ctaStyle }}>
                              Launch Game →
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: MEMORY VERSE */}
              {locationTab === 'memory-verse' && (
                <MemoryVerseTrainer verse={selectedRegion.memoryVerse} />
              )}

              {/* TAB 4: KNOWLEDGE BOSS */}
              {locationTab === 'boss' && (
                <KnowledgeBossArena
                  boss={selectedRegion.boss}
                  isDefeated={isBossDefeated(selectedRegion.boss.id, ctx)}
                  onVictory={handleBossVictory}
                />
              )}

              {/* TAB 5: SECRETS & COLLECTIBLES */}
              {locationTab === 'secrets' && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: c.gold, margin: '0 0 0.75rem 0' }}>
                    Hidden Secrets in {selectedRegion.name}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {selectedRegion.secrets.map((sec) => {
                      const isDiscovered = ctx.discoveredSecretIds?.includes(sec.id) ?? false;
                      return (
                        <div
                          key={sec.id}
                          style={{
                            background: isDiscovered ? '#EFFDF4' : c.secretUndiscoveredBg,
                            border: isDiscovered ? '1.5px solid #15803D' : `1.5px dashed ${c.secretUndiscoveredBorder}`,
                            borderRadius: '12px',
                            padding: '1rem',
                          }}
                        >
                          <span style={{ fontSize: '2rem' }}>{isDiscovered ? sec.emoji : '❓'}</span>
                          <strong style={{ display: 'block', fontSize: '0.95rem', color: isDiscovered ? '#1E293B' : c.text, margin: '0.25rem 0' }}>
                            {isDiscovered ? sec.name : 'Undiscovered Secret'}
                          </strong>
                          <p style={{ fontSize: '0.8rem', color: isDiscovered ? '#64748B' : c.textMuted, margin: '0 0 0.75rem 0' }}>
                            {isDiscovered ? 'Secret unlocked!' : `Hint: ${sec.hint}`}
                          </p>
                          {!isDiscovered && (
                            <button
                              type="button"
                              className="button button-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.5rem 0.7rem', width: '100%', justifyContent: 'center' }}
                              onClick={() => handleDiscoverSecret(sec.id, sec.rewardCoins, sec.rewardGems)}
                            >
                              🔍 Search Area
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <h3 style={{ fontSize: '1.1rem', color: c.accent, margin: '0 0 0.75rem 0' }}>
                    Location Collectibles
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {selectedRegion.collectibles.map((col) => (
                      <div
                        key={col.id}
                        style={{
                          background: c.tileBg,
                          border: `1.5px solid ${c.tileBorder}`,
                          borderRadius: '10px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <span style={{ fontSize: '1.8rem' }}>{col.emoji}</span>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: c.text, display: 'block' }}>{col.name}</strong>
                          <small style={{ fontSize: '0.72rem', color: c.textMuted }}>{col.description}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
        </div>
        )}
      </div>

      {showPouch && (
        <CollectiblesPouchModal
          collectibles={collectibles}
          secrets={[]}
          onClose={() => setShowPouch(false)}
        />
      )}

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
      <XPToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );

  if (embedded) return body;

  const header = (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderBottom: `2px solid ${c.headerBorder}`,
        background: c.headerBg,
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: c.text }}>
          <Image src="/lantern-lion-logo.png" alt="" width={42} height={42} priority />
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 800 }}>Lantern &amp; Lion</strong>
            <small style={{ color: c.textMuted, fontSize: '0.75rem' }}>Bible Adventure World</small>
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link href={dashboardHref} className="button button-danger" style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </header>
  );

  if (!isTeen) {
    return (
      <main style={{ minHeight: '100vh', background: c.bg, color: c.text, paddingBottom: '4rem' }}>
        {header}
        {body}
      </main>
    );
  }

  return (
    <main className="teen-dashboard" style={{ paddingBottom: 0 }}>
      {header}
      <div className="teen-body-container">
        <TeenSidebar
          activeItem="adventure"
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />
        <div className="teen-main-canvas">{body}</div>
      </div>
    </main>
  );
}

export default function AdventurePage() {
  return <AdventureWorld />;
}
