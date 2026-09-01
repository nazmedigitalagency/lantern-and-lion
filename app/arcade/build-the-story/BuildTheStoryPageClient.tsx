'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { hasActiveSession, readActiveProfile, type PlayerProfile } from '../../adventure/storage';
import { logGameEvent } from '../../lib/analytics';
import { useDialogA11y } from '../../lib/use-dialog';
import { getPersonalBest, recordGameSession } from '../storage';
import type { AgeBand, GameOutcome } from '../types';
import { STORY_BANK } from './stories';
import {
  computeStoryScore,
  findFirstMismatch,
  getHint,
  nowMs,
  scrambleEvents,
  type StoryDefinition,
  type StoryEvent,
} from './engine';

const RESOLVE_PAUSE_MS = 700;

function ageBandForAge(age: number): AgeBand {
  if (age <= 8) return 'kids';
  if (age <= 12) return 'tweens';
  return 'teens';
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

export function BuildTheStoryGame({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [phase, setPhase] = useState<'browse' | 'playing' | 'result'>('browse');
  const [ageFilter, setAgeFilter] = useState<AgeBand | 'all'>('all');
  const [story, setStory] = useState<StoryDefinition | null>(null);

  const [bank, setBank] = useState<StoryEvent[]>([]);
  const [slots, setSlots] = useState<(StoryEvent | null)[]>([]);
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const [hintText, setHintText] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);

  const startedAtRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasActiveSession()) { window.location.href = '/'; return; }
      const activeProfile = readActiveProfile();
      setProfile(activeProfile);
      setAgeFilter(ageBandForAge(activeProfile.age));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function openStory(def: StoryDefinition) {
    setStory(def);
    setBank(scrambleEvents(def.events));
    setSlots(new Array(def.events.length).fill(null));
    setWrongIndices(new Set());
    setHintText('');
    setAttempts(0);
    setHintsUsed(0);
    setResolving(false);
    startedAtRef.current = nowMs();
    setPhase('playing');
    if (profile) {
      logGameEvent('GAME_STARTED', {
        userId: profile.id,
        gameId: 'build-the-story',
        difficulty: def.difficulty,
        story: def.title,
        skillsPracticed: def.skills,
      });
    }
  }

  function placeInSlot(event: StoryEvent, slotIndex: number) {
    setSlots((prev) => {
      const next = [...prev];
      const bumped = next[slotIndex];
      next[slotIndex] = event;
      setBank((bankPrev) => {
        let nextBank = bankPrev.filter((b) => b.id !== event.id);
        if (bumped) nextBank = [...nextBank, bumped];
        return nextBank;
      });
      return next;
    });
    setWrongIndices(new Set());
  }

  function tapEvent(event: StoryEvent) {
    if (resolving) return;
    const firstEmpty = slots.findIndex((s) => s === null);
    if (firstEmpty === -1) return;
    placeInSlot(event, firstEmpty);
  }

  function tapSlot(slotIndex: number) {
    if (resolving) return;
    const event = slots[slotIndex];
    if (!event) return;
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? null : s)));
    setBank((prev) => [...prev, event]);
    setWrongIndices(new Set());
  }

  function onDrop(slotIndex: number) {
    if (resolving || dragId === null) return;
    const event = bank.find((b) => b.id === dragId) || slots.find((s) => s?.id === dragId) || null;
    if (event) placeInSlot(event, slotIndex);
    setDragId(null);
  }

  function submitOrder() {
    if (!story || resolving || slots.some((s) => s === null)) return;
    const mismatchIndex = findFirstMismatch(slots, story.events);

    if (mismatchIndex === -1) {
      setResolving(true);
      setHintText('');
      window.setTimeout(() => finishStory(attempts + 1), RESOLVE_PAUSE_MS);
      return;
    }

    const wrong = new Set<number>();
    slots.forEach((slot, index) => {
      if (slot && slot.id !== story.events[index].id) wrong.add(index);
    });
    setWrongIndices(wrong);
    setAttempts((a) => a + 1);
    setHintsUsed((h) => h + 1);
    const hint = getHint(story, slots);
    setHintText(hint);
    if (profile) {
      logGameEvent('HINT_USED', {
        userId: profile.id,
        gameId: 'build-the-story',
        difficulty: story.difficulty,
        story: story.title,
        hintsUsed: hintsUsed + 1,
      });
    }
  }

  function finishStory(finalAttempts: number) {
    if (!profile || !story) return;
    const timeSeconds = Math.round((nowMs() - startedAtRef.current) / 1000);
    const { score, accuracy } = computeStoryScore({ eventCount: story.events.length, attempts: finalAttempts, timeSeconds });
    const previousBest = getPersonalBest(profile.id, 'build-the-story');
    const result = recordGameSession(profile.id, {
      gameId: 'build-the-story',
      score,
      accuracy,
      timeSeconds,
      difficulty: story.difficulty,
      mistakes: finalAttempts - 1,
      completed: true,
      attempts: finalAttempts,
      hintsUsed,
    });
    setOutcome(result);
    setPhase('result');

    logGameEvent('GAME_COMPLETED', {
      userId: profile.id,
      gameId: 'build-the-story',
      difficulty: story.difficulty,
      story: story.title,
      score,
      accuracy,
      timeSeconds,
      attempts: finalAttempts,
      hintsUsed,
      xpEarned: result.session.xpEarned,
      skillsPracticed: story.skills,
    });

    if (finalAttempts === 1) {
      logGameEvent('STORY_MASTERED', {
        userId: profile.id,
        gameId: 'build-the-story',
        difficulty: story.difficulty,
        story: story.title,
        score,
        accuracy,
        timeSeconds,
      });
    }

    const beatScore = result.isNewBest;
    const beatAttempts = !!previousBest && previousBest.attempts !== undefined && finalAttempts < previousBest.attempts;
    const beatTime = !!previousBest && timeSeconds < previousBest.timeSeconds;
    if (beatScore || beatAttempts || beatTime) {
      logGameEvent('PERSONAL_BEST', {
        userId: profile.id,
        gameId: 'build-the-story',
        difficulty: story.difficulty,
        story: story.title,
        score,
        accuracy,
        attempts: finalAttempts,
      });
    }
  }

  const visibleStories = ageFilter === 'all' ? STORY_BANK : STORY_BANK.filter((s) => s.ageGroup === ageFilter);
  const best = story && profile ? getPersonalBest(profile.id, 'build-the-story') : null;
  const allFilled = slots.length > 0 && slots.every((s) => s !== null);
  const showAudio = profile ? ageBandForAge(profile.age) === 'kids' : false;

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Loading Build the Story…</p>
      </main>
    );
  }

  const body = (
      <div className="adv-body arcade-body arcade-game-body">
        {phase === 'browse' && (
          <section className="bts-browse">
            <span className="arcade-setup-icon" aria-hidden="true">📖</span>
            <h1>Build the Story</h1>
            <p>Pick a story and put its events back in order.</p>

            <div className="lq-category-picker" role="group" aria-label="Age group">
              {(['all', 'kids', 'tweens', 'teens'] as const).map((band) => (
                <button key={band} type="button" className={ageFilter === band ? 'active' : ''} aria-pressed={ageFilter === band} onClick={() => setAgeFilter(band)}>
                  {band === 'all' ? '🔀 All stories' : band === 'kids' ? '🧒 Kids' : band === 'tweens' ? '🧑 Tweens' : '🧑‍🎓 Teens'}
                </button>
              ))}
            </div>

            <div className="bts-story-grid">
              {visibleStories.map((s) => {
                const storyBest = profile ? getPersonalBest(profile.id, 'build-the-story') : null;
                return (
                  <article key={s.id} className="bts-story-card">
                    {s.image && <div className="bts-story-image"><Image src={s.image} alt="" fill sizes="280px" /></div>}
                    <div className="bts-story-body">
                      <h3>{s.title}</h3>
                      <p>{s.description}</p>
                      <div className="bts-story-meta">
                        <span>{s.reference}</span>
                        <span className="bts-difficulty-badge">{s.difficulty}</span>
                        <span>{s.events.length} events</span>
                      </div>
                      <div className="arcade-game-meta">
                        <span>✨ up to {s.xpReward} XP</span>
                        {storyBest && <span>🏆 Best: {storyBest.score}</span>}
                      </div>
                      <button type="button" className="button button-primary arcade-play-btn" onClick={() => openStory(s)}>Play</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {phase === 'playing' && story && (
          <section className="arcade-play-card bts-play">
            <div className="arcade-play-meta">
              <span>📖 {story.title}</span>
              <span>🔁 {attempts} {attempts === 1 ? 'retry' : 'retries'}</span>
            </div>

            <div className="bts-slots">
              {slots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  className={`bts-slot ${slot ? 'filled' : ''} ${wrongIndices.has(index) ? 'wrong' : ''}`}
                  onClick={() => tapSlot(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(index)}
                >
                  <span className="bts-slot-number">{index + 1}</span>
                  <span className="bts-slot-text">{slot ? slot.text : 'Tap or drag an event here'}</span>
                </button>
              ))}
            </div>

            {hintText && (
              <div className="lq-feedback incorrect" role="status">
                <strong>Not quite yet — here’s a hint</strong>
                <p>{hintText}</p>
              </div>
            )}

            <div className="bts-bank" role="list" aria-label="Story events">
              {bank.map((event) => (
                <div key={event.id} className="bts-bank-card-wrap">
                  <button
                    type="button"
                    className="bts-bank-card"
                    draggable
                    onDragStart={() => setDragId(event.id)}
                    onClick={() => tapEvent(event)}
                  >
                    {event.text}
                  </button>
                  {showAudio && (
                    <button type="button" className="bts-audio-btn" aria-label={`Listen to: ${event.text}`} onClick={() => speak(event.text)}>🔊</button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="button button-primary arcade-start-btn" disabled={!allFilled || resolving} onClick={submitOrder}>Check order</button>
          </section>
        )}

        {phase === 'result' && outcome && story && (
          <StoryResultScreen
            outcome={outcome}
            story={story}
            best={best}
            onPlayAgain={() => openStory(story)}
            onChooseAnother={() => setPhase('browse')}
            {...(embedded && onClose ? { onBack: onClose } : {})}
          />
        )}
      </div>
  );

  if (embedded) return body;

  return (
    <main className="adventure-page arcade-page">
      <header className="child-topbar adv-topbar">
        <Link href="/arcade" className="child-logo">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span>
            <strong>Build the Story</strong>
            <small>Lantern Arcade</small>
          </span>
        </Link>
        <div className="child-header-actions">
          <Link href="/arcade" className="help-button">← Arcade</Link>
        </div>
      </header>
      {body}
    </main>
  );
}

export default function BuildTheStoryPage() {
  return <BuildTheStoryGame />;
}

function StoryResultScreen({
  outcome,
  story,
  best,
  onPlayAgain,
  onChooseAnother,
  onBack,
}: {
  outcome: GameOutcome;
  story: StoryDefinition;
  best: ReturnType<typeof getPersonalBest>;
  onPlayAgain: () => void;
  onChooseAnother: () => void;
  onBack?: () => void;
}) {
  const dialogRef = useDialogA11y<HTMLElement>(true, onChooseAnother);
  const { session, isNewBest, previousBest } = outcome;
  const beatAttempts = !!previousBest && previousBest.attempts !== undefined && (session.attempts ?? Infinity) < previousBest.attempts;
  const beatTime = !!previousBest && session.timeSeconds < previousBest.timeSeconds;
  const anyRecord = isNewBest || beatAttempts || beatTime;

  return (
    <div className="help-overlay" role="presentation">
      <section ref={dialogRef} className="help-dialog arcade-result-dialog bts-result-dialog" role="dialog" aria-modal="true" aria-labelledby="bts-result-title">
        <p className="child-kicker">{anyRecord ? '🏆 New personal best!' : 'Nicely done'}</p>
        <h2 id="bts-result-title">Build the Story complete!</h2>

        <div className="arcade-result-stats memory-result-stats">
          <div><strong>{session.score}</strong><small>⭐ Score</small></div>
          <div><strong>{Math.round(session.accuracy)}%</strong><small>🎯 Accuracy</small></div>
          <div><strong>{session.timeSeconds}s</strong><small>⏱ Time</small></div>
          <div><strong>{session.attempts ?? 1}</strong><small>🔁 Attempts</small></div>
        </div>

        <div className="bts-learning-card">
          <p className="bts-order-heading">The correct order was:</p>
          <ol>
            {story.events.map((e) => <li key={e.id}>{e.text}</li>)}
          </ol>
          <p className="bts-summary">{story.summary}</p>
          <small>{story.reference}</small>
        </div>

        <p className="arcade-result-xp">⭐ +{session.xpEarned} XP{session.coinsEarned > 0 ? ` · 🪙 +${session.coinsEarned} coins` : ''}</p>
        {best && <p className="memory-result-best">🏆 Best score for this story: {Math.max(best.score, session.score)}</p>}

        <div className="arcade-result-actions">
          <button type="button" className="button button-primary" onClick={onPlayAgain}>Play again</button>
          <button type="button" className="button button-secondary" onClick={onChooseAnother}>Choose another story</button>
          {onBack ? (
            <button type="button" className="button button-secondary" onClick={onBack}>Back to Arcade</button>
          ) : (
            <Link className="button button-secondary" href="/arcade">Back to Arcade</Link>
          )}
        </div>
      </section>
    </div>
  );
}
