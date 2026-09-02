'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { readActiveProfile } from '../adventure/storage';
import TeenSidebar from '../teen-dashboard/TeenSidebar';
import { getItemsUnlockedInLevelRange } from '../character/progression';
import type { EquipmentItem } from '../character/types';
import { LevelUpModal, XPToastStack } from '../lib/economy/components';
import type { AwardResult } from '../lib/economy/types';
import {
  ChoiceSceneView,
  DialogueSceneView,
  FinalChallengeSceneView,
  MemorySceneView,
  NarrationSceneView,
  QuizSceneView,
} from './components';
import { completeStory, fetchServerProgress, loadLocalStoryState, saveLocalStoryState, startStorySession, syncProgress } from './engine';
import {
  advance,
  correctCountForScene,
  getCurrentScene,
  isAtFinalScene,
  recordAnswer,
  recordChoice,
  type StoryProgressState,
} from './progression';
import type { InteractiveStory } from './types';
import { getLevelInfo } from '../lib/xp-levels';

type ToastEvent = { id: string; transaction: AwardResult['transaction'] };
type LevelUpEvent = { previousLevel: number; newLevel: number; unlockedItems: EquipmentItem[] };

export default function StoryPageClient({ story }: { story: InteractiveStory }) {
  const [profile, setProfile] = useState<{ id: number; kind: 'child' | 'teen' } | null>(null);
  const [state, setState] = useState<StoryProgressState | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [reward, setReward] = useState<{ xp: number; coins: number; gems: number } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<ToastEvent[]>([]);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [walletXp, setWalletXp] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const active = readActiveProfile();
      setProfile({ id: active.id, kind: active.kind });

      const local = loadLocalStoryState(active.id, story);
      setState(local);
      startStorySession(active.id, story);

      // Best-effort: if a real server session has *further* progress than
      // local storage (e.g. played on another device), prefer it.
      fetchServerProgress(story.id).then((server) => {
        if (server && server.status !== 'completed') {
          const serverScene = story.scenes.find((s) => s.id === server.currentSceneId);
          const localScene = story.scenes.find((s) => s.id === local.currentSceneId);
          if (serverScene && (!localScene || serverScene.order > localScene.order)) {
            const merged: StoryProgressState = {
              storyId: story.id,
              currentSceneId: server.currentSceneId,
              choices: server.choices,
              answers: server.answers,
              hintsUsed: server.hintsUsed,
              status: 'in_progress',
            };
            setState(merged);
            saveLocalStoryState(active.id, merged);
          }
        }
        setHydrated(true);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [story]);

  function dismissToast(id: string) {
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  const scene = useMemo(() => (state ? getCurrentScene(story, state) : null), [story, state]);
  const atFinal = state ? isAtFinalScene(story, state) : false;

  function persist(next: StoryProgressState) {
    if (!profile) return;
    setState(next);
    saveLocalStoryState(profile.id, next);
    void syncProgress(next);
  }

  function handleAdvance() {
    if (!profile || !state) return;
    const next = advance(story, state);
    persist(next);
  }

  async function handleFinish() {
    if (!profile || !state) return;
    const completed = { ...state, status: 'completed' as const };
    persist(completed);
    const outcome = await completeStory(profile.id, story, completed);
    setReward(outcome.reward);

    if (outcome.awards.length > 0) {
      setToasts((current) => [...current, ...outcome.awards.map((a) => ({ id: a.transaction.id, transaction: a.transaction }))]);
      const lastWallet = outcome.awards[outcome.awards.length - 1].wallet;
      setWalletXp(lastWallet.xp);

      const levelUps = outcome.awards.map((a) => a.levelUp).filter((lu): lu is NonNullable<typeof lu> => lu !== null);
      if (levelUps.length > 0) {
        const previousLevel = Math.min(...levelUps.map((lu) => lu.previousLevel));
        const newLevel = Math.max(...levelUps.map((lu) => lu.newLevel));
        setLevelUpEvent({ previousLevel, newLevel, unlockedItems: getItemsUnlockedInLevelRange(previousLevel, newLevel) });
      }
    }

    setShowComplete(true);
  }

  function handleChoose(sceneId: string, choiceId: string) {
    if (!state) return;
    persist(recordChoice(state, sceneId, choiceId));
  }

  function handleAnswer(sceneId: string, questionId: string, correct: boolean) {
    if (!state) return;
    persist(recordAnswer(state, sceneId, questionId, correct));
  }

  if (!hydrated || !profile || !state || !scene) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span />
        <p>Opening the story…</p>
      </main>
    );
  }

  const kind = profile.kind;
  const isTeen = kind === 'teen';
  const dashboardHref = isTeen ? '/teen-dashboard' : '/child-dashboard';

  // On the teen side, wrap the page content in the same sidebar + navy
  // shell as the rest of the Lion's Den so navigation isn't lost; children
  // keep the original single-column story-shell exactly as before.
  function withTeenShell(children: ReactNode) {
    if (!isTeen) return <main className="story-shell">{children}</main>;
    return (
      <main className="teen-dashboard">
        <header className="teen-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="teen-menu-trigger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <Link href="/teen-dashboard" className="teen-logo" aria-label="Lantern and Lion - Lion's Den">
              <div className="teen-logo-mark">
                <Image src="/lantern-lion-logo.png" alt="" width={44} height={44} priority />
              </div>
              <span className="teen-logo-text">
                <strong>Lion’s Den</strong>
                <small>Interactive Stories</small>
              </span>
            </Link>
          </div>
        </header>
        <div className="teen-body-container">
          <TeenSidebar
            activeItem="stories"
            mobileMenuOpen={mobileMenuOpen}
            onCloseMobileMenu={() => setMobileMenuOpen(false)}
          />
          <div className="teen-main-canvas">
            <div className="story-shell teen">{children}</div>
          </div>
        </div>
      </main>
    );
  }

  if (showComplete && reward) {
    return withTeenShell(
      <>
        <div className="story-complete-card">
          <span style={{ fontSize: 48 }}>🎉</span>
          <h2>Story Complete!</h2>
          <p style={{ fontWeight: 800, color: 'var(--teal-dark)' }}>{story.title}</p>
          <p style={{ color: 'var(--muted)', fontWeight: 700 }}>📖 Based on {story.scriptureRange}</p>

          <div className="story-reward-row">
            <span>⭐ +{reward.xp} XP</span>
            <span>🪙 +{reward.coins} Coins</span>
            {reward.gems > 0 && <span>💎 +{reward.gems} Gems</span>}
          </div>

          <Link href={dashboardHref} className="button button-primary story-primary-action">
            Continue your adventure →
          </Link>
        </div>

        {levelUpEvent && (
          <LevelUpModal
            previousLevel={levelUpEvent.previousLevel}
            newLevel={levelUpEvent.newLevel}
            newTitle={getLevelInfo(walletXp).title}
            xp={walletXp}
            unlockedItems={levelUpEvent.unlockedItems}
            onContinue={() => setLevelUpEvent(null)}
          />
        )}
        <XPToastStack toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return withTeenShell(
    <>
      <div className="story-topbar">
        <h1>
          {story.heroEmoji} {story.title}
        </h1>
        <Link href={dashboardHref} className="button button-danger" style={{ fontSize: 13, padding: '6px 12px' }}>
          Exit
        </Link>
      </div>

      {scene.type === 'NARRATION' && <NarrationSceneView story={story} scene={scene} kind={kind} onAdvance={handleAdvance} />}
      {scene.type === 'DIALOGUE' && <DialogueSceneView story={story} scene={scene} kind={kind} onAdvance={handleAdvance} />}
      {scene.type === 'CHOICE' && (
        <ChoiceSceneView
          story={story}
          scene={scene}
          kind={kind}
          onChoose={(choiceId) => handleChoose(scene.id, choiceId)}
          onAdvance={handleAdvance}
        />
      )}
      {scene.type === 'QUIZ' && (
        <QuizSceneView
          story={story}
          scene={scene}
          kind={kind}
          onAnswer={(questionId, correct) => handleAnswer(scene.id, questionId, correct)}
          onAdvance={handleAdvance}
        />
      )}
      {scene.type === 'MEMORY' && <MemorySceneView story={story} scene={scene} kind={kind} onAdvance={handleAdvance} />}
      {scene.type === 'FINAL_CHALLENGE' && (
        <FinalChallengeSceneView
          story={story}
          scene={scene}
          kind={kind}
          correctCount={correctCountForScene(state, scene.id)}
          onAnswer={(questionId, correct) => handleAnswer(scene.id, questionId, correct)}
          onFinish={atFinal ? handleFinish : handleAdvance}
        />
      )}

      <XPToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
