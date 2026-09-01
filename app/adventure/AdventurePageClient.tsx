'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CharacterAvatar } from '../character/components';
import { readAppearance, readEquipment } from '../character/storage';
import type { CharacterAppearance, CharacterEquipment } from '../character/types';
import { LevelUpModal, XPToastStack } from '../lib/economy/components';
import { useWalletSync } from '../lib/economy/use-wallet-sync';
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
  const [showPouch, setShowPouch] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  const regions = useMemo(() => getRegions(), []);
  const selectedRegion = useMemo(() => getRegion(selectedRegionId) || canonicalRegions[0], [selectedRegionId]);
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

  const dashboardHref = profile.kind === 'teen' ? '/teen-dashboard' : '/child-dashboard';
  const regionQuests = getQuestsForRegion(selectedRegion.id);
  const regionStatus = regionStatuses[selectedRegion.id] || 'available';
  const isRegionUnlocked = regionStatus !== 'locked';

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
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
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
          style={{
            background: '#EFF6FF',
            border: '2px solid #1E293B',
            borderRadius: '18px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '5px 5px 0 #3B82F6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, flexShrink: 0 }}>
              <CharacterAvatar appearance={appearance} equipment={equipment} size="small" showPedestal={false} />
            </div>
            <div>
              <small style={{ color: '#1D4ED8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Active Expedition
              </small>
              <h2 style={{ margin: '0 0 0.2rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#1E293B' }}>
                {nextMission.title}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>{nextMission.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setSelectedRegionId(nextMission.region.id);
              if (nextMission.type === 'boss') setLocationTab('boss');
              else setLocationTab('chapters');
              setShowRegionModal(true);
            }}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', fontWeight: 800 }}
          >
            ▶ Continue Adventure →
          </button>
        </section>

        {/* 🗺️ Illustrated Interactive World Map */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>The Canonical Bible World Map</h2>
              <small style={{ color: '#64748B' }}>Tap any land to explore stories, games, memory verses, and Knowledge Bosses.</small>
            </div>
          </div>

          <WorldMapCanvas
            regions={regions}
            currentRegionId={selectedRegionId}
            regionStatuses={regionStatuses}
            completionPercents={completionPercents}
            playerAppearance={appearance}
            playerEquipment={equipment}
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
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 'min(880px, 100%)',
            maxHeight: '88vh',
            overflowY: 'auto',
            background: '#ffffff',
            border: '2px solid #1E293B',
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
              right: '1rem',
              width: 38,
              height: 38,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              border: '1.5px solid #1E293B',
              background: '#EFF6FF',
              color: '#1E293B',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
          {/* Location Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: '1.25rem',
              alignItems: 'center',
              borderBottom: '1px solid #e2e8f1',
              paddingBottom: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <span style={{ fontSize: '3.5rem' }}>{selectedRegion.icon}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: '#ffffff', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 700 }}>
                  {selectedRegion.scriptureRange}
                </span>
                <span style={{ fontSize: '0.75rem', color: isRegionUnlocked ? '#15803D' : '#B91C1C', fontWeight: 600 }}>
                  {isRegionUnlocked ? '✨ Unlocked Land' : '🔒 Locked Land'}
                </span>
              </div>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.6rem', fontWeight: 900, color: '#1E293B' }}>
                {selectedRegion.name}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>{selectedRegion.summary}</p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <strong style={{ fontSize: '1.4rem', color: '#D97706', display: 'block' }}>
                {completionPercents[selectedRegion.id] || 0}%
              </strong>
              <small style={{ color: '#64748B', fontSize: '0.75rem' }}>Mastery</small>
            </div>
          </div>

          {!isRegionUnlocked ? (
            <div
              style={{
                background: '#FEF2F2',
                border: '1.5px dashed #DC2626',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                color: '#64748B',
              }}
            >
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🔒</span>
              <h3 style={{ color: '#B91C1C', margin: '0 0 0.5rem 0' }}>This Land is Locked</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
                Requirements to unlock: {selectedRegion.unlockRequirement.map((req) => describeRequirement(req)).join(' and ')}.
              </p>
            </div>
          ) : (
            <>
              {/* Location Subtabs */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f1', marginBottom: '1.25rem', overflowX: 'auto' }}>
                <button
                  type="button"
                  className={`button ${locationTab === 'chapters' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setLocationTab('chapters')}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
                >
                  📖 Stories ({selectedRegion.chapters.length})
                </button>
                <button
                  type="button"
                  className={`button ${locationTab === 'games' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setLocationTab('games')}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
                >
                  🎮 Arcade Games ({regionQuests.length})
                </button>
                <button
                  type="button"
                  className={`button ${locationTab === 'memory-verse' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setLocationTab('memory-verse')}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
                >
                  📜 Memory Verse
                </button>
                <button
                  type="button"
                  className={`button ${locationTab === 'boss' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setLocationTab('boss')}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
                >
                  👑 Knowledge Boss
                </button>
                <button
                  type="button"
                  className={`button ${locationTab === 'secrets' ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => setLocationTab('secrets')}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
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
                      <div key={quest.id} style={{ background: '#EFF6FF', borderRadius: '12px', padding: '1rem', border: '1.5px solid #1E293B' }}>
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
                          <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                            <Link href={quest.linkedArcadeGame.href} className="button button-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
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
                  <h3 style={{ fontSize: '1.1rem', color: '#D97706', margin: '0 0 0.75rem 0' }}>
                    Hidden Secrets in {selectedRegion.name}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {selectedRegion.secrets.map((sec) => {
                      const isDiscovered = ctx.discoveredSecretIds?.includes(sec.id) ?? false;
                      return (
                        <div
                          key={sec.id}
                          style={{
                            background: isDiscovered ? '#EFFDF4' : '#f4f8fc',
                            border: isDiscovered ? '1.5px solid #15803D' : '1.5px dashed #94a3b8',
                            borderRadius: '12px',
                            padding: '1rem',
                          }}
                        >
                          <span style={{ fontSize: '2rem' }}>{isDiscovered ? sec.emoji : '❓'}</span>
                          <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1E293B', margin: '0.25rem 0' }}>
                            {isDiscovered ? sec.name : 'Undiscovered Secret'}
                          </strong>
                          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 0.75rem 0' }}>
                            {isDiscovered ? 'Secret unlocked!' : `Hint: ${sec.hint}`}
                          </p>
                          {!isDiscovered && (
                            <button
                              type="button"
                              className="button button-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                              onClick={() => handleDiscoverSecret(sec.id, sec.rewardCoins, sec.rewardGems)}
                            >
                              🔍 Search Area
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <h3 style={{ fontSize: '1.1rem', color: '#1D4ED8', margin: '0 0 0.75rem 0' }}>
                    Location Collectibles
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {selectedRegion.collectibles.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          background: '#EFF6FF',
                          border: '1.5px solid #1E293B',
                          borderRadius: '10px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <span style={{ fontSize: '1.8rem' }}>{c.emoji}</span>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#1E293B', display: 'block' }}>{c.name}</strong>
                          <small style={{ fontSize: '0.72rem', color: '#64748B' }}>{c.description}</small>
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

  return (
    <main style={{ minHeight: '100vh', background: '#FEF9F3', color: '#1E293B', paddingBottom: '4rem' }}>
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '2px solid #1E293B',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#1E293B' }}>
          <Image src="/lantern-lion-logo.png" alt="" width={42} height={42} priority />
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 800 }}>Lantern &amp; Lion</strong>
            <small style={{ color: '#64748B', fontSize: '0.75rem' }}>Bible Adventure World</small>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href={dashboardHref} className="button button-secondary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </header>
      {body}
    </main>
  );
}

export default function AdventurePage() {
  return <AdventureWorld />;
}
