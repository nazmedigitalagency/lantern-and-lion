'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { curriculumModules } from '../curriculum-data';
import { GameHUD, LevelUpModal, XPToastStack } from '../lib/economy/components';
import { useWalletSync } from '../lib/economy/use-wallet-sync';
import { useDialogA11y } from '../lib/use-dialog';
import { DifficultyStars, QuestCard, QuestStatusPill, RegionNode } from './components';
import {
  describeRequirement,
  getCollectedCollectibles,
  getCurrentRegionId,
  getQuestEstimatedMinutes,
  getQuestStatus,
  getRegionQuestSummary,
  getRegionStatus,
  type WorldContext,
} from './progression';
import { hasActiveSession, loadWorldContext, markQuestMastered, readActiveProfile, type PlayerProfile } from './storage';
import { getQuest, getQuestsForRegion, getRegion, getRegions } from './world-data';
import type { RegionId } from './types';

type View = 'map' | 'region';

export default function AdventurePage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ctx, setCtx] = useState<WorldContext>({ moduleProgress: {}, masteredQuestIds: [], kind: 'child' });
  const [view, setView] = useState<View>('map');
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  function refresh() {
    const activeProfile = readActiveProfile();
    setProfile(activeProfile);
    setCtx(loadWorldContext(activeProfile.id, activeProfile.kind));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Adventure/Character/Arcade have no login of their own — they only make
      // sense reached from an already-signed-in dashboard. Without this check,
      // a signed-out visitor (or a stale identity cursor with no live session)
      // would still see whichever child's data was last active on this device.
      if (!hasActiveSession()) {
        router.replace('/');
        return;
      }
      refresh();
      setHydrated(true);
    }, 0);
    const onVisible = () => document.visibilityState === 'visible' && hasActiveSession() && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const currentRegionId = useMemo(() => getCurrentRegionId(ctx), [ctx]);
  const collectibles = useMemo(() => getCollectedCollectibles(ctx), [ctx]);
  const worldRegions = useMemo(() => getRegions(ctx.kind), [ctx.kind]);

  const { wallet, levelInfo, toasts, dismissToast, levelUpEvent, dismissLevelUp } = useWalletSync(profile?.id ?? null, ctx);
  const { level, xpToNextLevel } = levelInfo;

  const selectedRegion = selectedRegionId ? getRegion(selectedRegionId, ctx.kind) : undefined;
  const regionQuests = selectedRegionId ? getQuestsForRegion(selectedRegionId, ctx.kind) : [];
  const selectedQuest = selectedQuestId ? getQuest(selectedQuestId, ctx.kind) : undefined;
  const selectedModule = selectedQuest ? curriculumModules.find((m) => m.id === selectedQuest.moduleId) : undefined;
  const selectedQuestStatus = selectedQuest ? getQuestStatus(selectedQuest, ctx) : undefined;
  const selectedQuestMinutes = selectedQuest ? getQuestEstimatedMinutes(selectedQuest) : 0;

  function openRegion(regionId: RegionId) {
    setSelectedRegionId(regionId);
    setView('region');
  }

  const questModalRef = useDialogA11y<HTMLElement>(Boolean(selectedQuestId), () => setSelectedQuestId(null));

  function backToMap() {
    setView('map');
    setSelectedRegionId(null);
  }

  function replayForMastery() {
    if (!profile || !selectedQuest) return;
    markQuestMastered(profile.id, selectedQuest.id);
    setCtx((prev) => ({ ...prev, masteredQuestIds: [...prev.masteredQuestIds, selectedQuest.id] }));
    setNotice('Marked as mastered! Enjoy revisiting the story.');
    router.push(`/learn?module=${selectedQuest.moduleId}`);
  }

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Opening the Adventure World…</p>
      </main>
    );
  }

  const dashboardHref = profile.kind === 'teen' ? '/teen-dashboard' : '/child-dashboard';

  return (
    <main className="adventure-page">
      <header className="child-topbar adv-topbar">
        <Link href={dashboardHref} className="child-logo">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span>
            <strong>Adventure World</strong>
            <small>Lantern &amp; Lion</small>
          </span>
        </Link>
        <div className="adv-topbar-center">
          <GameHUD level={level} wallet={wallet} />
        </div>
        <div className="child-header-actions">
          <Link href="/character" className="help-button adv-cross-link">🧑 Character</Link>
          <Link href={dashboardHref} className="help-button">← Back to dashboard</Link>
        </div>
      </header>

      {view === 'map' && (
        <div className="adv-body">
          <div className="adv-intro">
            <p className="child-kicker">Hi, {profile.name}</p>
            <h1>Explore the Lantern &amp; Lion World</h1>
            <p>
              Walk the Bible’s story region by region. Finish quests to light up new places on the map — some places
              need a little more courage (and a higher level) to reach.
            </p>
            {xpToNextLevel !== null && (
              <p className="adv-level-hint">
                <b>{xpToNextLevel} XP</b> more to reach Level {level + 1}.
              </p>
            )}
          </div>

          <section className="adv-map-scene" aria-label="World map">
            <svg className="adv-map-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {worldRegions.flatMap((region) =>
                region.connectsTo
                  .filter((targetId) => worldRegions.findIndex((r) => r.id === targetId) > worldRegions.findIndex((r) => r.id === region.id))
                  .map((targetId) => {
                    const target = getRegion(targetId, ctx.kind)!;
                    const targetStatus = getRegionStatus(target, ctx);
                    return (
                      <line
                        key={`${region.id}-${targetId}`}
                        x1={region.mapPosition.x}
                        y1={region.mapPosition.y}
                        x2={target.mapPosition.x}
                        y2={target.mapPosition.y}
                        className={targetStatus === 'locked' ? 'adv-path-locked' : 'adv-path-open'}
                      />
                    );
                  })
              )}
            </svg>
            {worldRegions.map((region) => (
              <RegionNode
                key={region.id}
                region={region}
                status={getRegionStatus(region, ctx)}
                isCurrent={region.id === currentRegionId}
                questSummary={getRegionQuestSummary(region, ctx)}
                onSelect={() => openRegion(region.id)}
              />
            ))}
          </section>

          <section className="adv-sidebar-row">
            <div className="adv-collectibles-panel">
              <p className="child-kicker">Collectibles found</p>
              <div className="adv-collectibles-strip">
                {collectibles.length === 0 && <p className="adv-empty-note">Complete a quest to find your first collectible.</p>}
                {collectibles.map((item) => (
                  <span key={item.id} className="adv-collectible-chip" title={item.name}>
                    <span aria-hidden="true">{item.emoji}</span>
                    <small>{item.name}</small>
                  </span>
                ))}
              </div>
            </div>
            <div className="adv-legend">
              <p className="child-kicker">Map key</p>
              <ul>
                <li><span className="adv-legend-dot adv-region-available" /> Ready to explore</li>
                <li><span className="adv-legend-dot adv-region-in-progress" /> In progress</li>
                <li><span className="adv-legend-dot adv-region-completed" /> Completed</li>
                <li><span className="adv-legend-dot adv-region-locked" /> Locked</li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {view === 'region' && selectedRegion && (
        <div className="adv-body adv-region-view">
          <button type="button" className="teen-back adv-back-to-map" onClick={backToMap}>← World map</button>
          <section className={`adv-region-hero adv-tone-${selectedRegion.tone}`}>
            <span className="adv-region-hero-icon" aria-hidden="true">{selectedRegion.icon}</span>
            <div>
              <p className="child-kicker">{REGION_STATUS_COPY[getRegionStatus(selectedRegion, ctx)]}</p>
              <h1>{selectedRegion.name}</h1>
              <p>{selectedRegion.tagline}</p>
            </div>
            <div className="adv-region-hero-progress">
              {(() => {
                const summary = getRegionQuestSummary(selectedRegion, ctx);
                return <><b>{summary.completed}/{summary.total}</b><small>quests complete</small></>;
              })()}
            </div>
          </section>

          <div className="adv-quest-grid">
            {regionQuests.map((quest) => {
              const mod = curriculumModules.find((m) => m.id === quest.moduleId);
              return (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  status={getQuestStatus(quest, ctx)}
                  title={mod?.title || 'Quest'}
                  theme={mod?.theme || ''}
                  estimatedMinutes={getQuestEstimatedMinutes(quest)}
                  onSelect={() => setSelectedQuestId(quest.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {selectedQuest && selectedQuestStatus && (
        <div className="help-overlay" role="presentation" onClick={() => setSelectedQuestId(null)}>
          <section ref={questModalRef} className="help-dialog adv-quest-modal" role="dialog" aria-modal="true" aria-labelledby="adv-quest-title" onClick={(e) => e.stopPropagation()}>
            <button className="close-help" aria-label="Close" onClick={() => setSelectedQuestId(null)}>×</button>
            <span className="adv-quest-modal-icon" aria-hidden="true">{selectedQuest.icon}</span>
            <p className="child-kicker">{selectedModule?.theme}</p>
            <h2 id="adv-quest-title">{selectedModule?.title}</h2>
            <p>{selectedModule?.description}</p>

            <div className="adv-quest-modal-meta">
              <DifficultyStars level={selectedQuest.difficulty} />
              <span>⏱ {selectedQuestMinutes} minutes</span>
              <span>✨ +{selectedQuest.reward.xp} XP</span>
              <QuestStatusPill status={selectedQuestStatus} />
            </div>

            {selectedQuest.reward.collectible && (
              <p className="adv-quest-modal-collectible">
                <span aria-hidden="true">{selectedQuest.reward.collectible.emoji}</span> Find the <b>{selectedQuest.reward.collectible.name}</b> collectible
              </p>
            )}

            {selectedQuestStatus === 'locked' ? (
              <div className="adv-locked-note">
                <p><b>Locked.</b> To unlock this quest:</p>
                <ul>
                  {selectedQuest.unlockRequirement.map((req, i) => (
                    <li key={i}>{describeRequirement(req, ctx.kind)}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="adv-quest-modal-actions">
                {(selectedQuestStatus === 'available' || selectedQuestStatus === 'in-progress') && (
                  <Link className="button button-primary" href={`/learn?module=${selectedQuest.moduleId}`}>
                    {selectedQuestStatus === 'in-progress' ? 'Continue quest' : 'Start quest'}
                  </Link>
                )}
                {selectedQuestStatus === 'completed' && (
                  <>
                    <Link className="button button-secondary" href={`/learn?module=${selectedQuest.moduleId}`}>Review quest</Link>
                    <button type="button" className="button button-primary" onClick={replayForMastery}>✨ Replay for mastery</button>
                  </>
                )}
                {selectedQuestStatus === 'mastered' && (
                  <>
                    <p className="adv-mastered-note">⭐ You’ve mastered this quest!</p>
                    <Link className="button button-secondary" href={`/learn?module=${selectedQuest.moduleId}`}>Review again</Link>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {notice && (
        <div className="child-help-confirmation" role="status">
          <span>✓</span>
          <p>{notice}</p>
          <button onClick={() => setNotice('')}>Close</button>
        </div>
      )}

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

const REGION_STATUS_COPY: Record<string, string> = {
  locked: 'Locked region',
  available: 'Ready to explore',
  'in-progress': 'In progress',
  completed: 'Fully explored',
};
