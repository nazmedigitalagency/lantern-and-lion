'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasActiveSession, readActiveProfile, type PlayerProfile } from '../../adventure/storage';
import { pickRandomUnique, shuffle } from '../../lib/shuffle';
import { DifficultyPicker, GameResultModal } from '../components';
import { VERSE_POOLS, VERSE_ROUNDS_PER_SESSION, allowedDifficultiesFor, defaultDifficultyFor } from '../catalog';
import { getPersonalBest, recordGameSession } from '../storage';
import { playRewardSound } from '../../lib/sound/sound-effects';
import type { DifficultyLevel, GameOutcome } from '../types';

type WordSlotItem = { w: string; i: number };

function shuffleWords(words: string[]): WordSlotItem[] {
  return shuffle(words.map((w, i) => ({ w, i })));
}

function pickVerses(difficulty: DifficultyLevel, count: number): { reference: string; text: string }[] {
  return pickRandomUnique(VERSE_POOLS[difficulty], count);
}

/**
 * The actual game. Rendered standalone (its own page, full topbar) by
 * default; pass `embedded` to drop the page chrome and render just the
 * game surface for use inside a modal (e.g. launched from the dashboard's
 * Arcade tab without leaving the dashboard) — `onClose` is called instead
 * of navigating back to /arcade in that case.
 */
export function VerseBuilderGame({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [verses, setVerses] = useState<{ reference: string; text: string }[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [bank, setBank] = useState<WordSlotItem[]>([]);
  const [slots, setSlots] = useState<(WordSlotItem | null)[]>([]);
  const [wrongSlots, setWrongSlots] = useState<Set<number>>(new Set());
  const [roundAttempts, setRoundAttempts] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasActiveSession()) { window.location.href = '/'; return; }
      const activeProfile = readActiveProfile();
      setProfile(activeProfile);
      setDifficulty(defaultDifficultyFor(activeProfile));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function startGame() {
    const gameVerses = pickVerses(difficulty, VERSE_ROUNDS_PER_SESSION);
    setVerses(gameVerses);
    setRoundIndex(0);
    setRoundScores([]);
    setTotalAttempts(0);
    setStartedAt(Date.now());
    beginRound(gameVerses[0]);
    setPhase('playing');
  }

  function beginRound(verse: { reference: string; text: string }) {
    const roundWords = verse.text.replace(/[.,]/g, '').split(' ');
    setWords(roundWords);
    setBank(shuffleWords(roundWords));
    setSlots(new Array(roundWords.length).fill(null));
    setWrongSlots(new Set());
    setRoundAttempts(0);
    setResolving(false);
  }

  function placeInSlot(item: WordSlotItem, slotIndex: number) {
    playRewardSound('tap');
    setSlots((prev) => {
      const next = [...prev];
      const bumped = next[slotIndex];
      next[slotIndex] = item;
      setBank((bankPrev) => {
        let nextBank = bankPrev.filter((b) => b !== item);
        if (bumped) nextBank = [...nextBank, bumped];
        return nextBank;
      });
      return next;
    });
    setWrongSlots(new Set());
  }

  function tapWord(item: WordSlotItem) {
    const firstEmpty = slots.findIndex((s) => s === null);
    if (firstEmpty === -1) return;
    placeInSlot(item, firstEmpty);
  }

  function tapSlot(slotIndex: number) {
    const item = slots[slotIndex];
    if (!item) return;
    playRewardSound('tap');
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? null : s)));
    setBank((prev) => [...prev, item]);
    setWrongSlots(new Set());
  }

  function onDrop(slotIndex: number) {
    if (dragIndex === null) return;
    const item = bank.find((b) => b.i === dragIndex) || slots.find((s) => s?.i === dragIndex) || null;
    if (item) placeInSlot(item, slotIndex);
    setDragIndex(null);
  }

  function submitRound() {
    if (resolving || slots.some((s) => s === null)) return;
    const wrong = new Set<number>();
    slots.forEach((slot, index) => {
      if (slot && slot.i !== index) wrong.add(index);
    });
    setRoundAttempts((a) => a + 1);
    setTotalAttempts((a) => a + 1);

    if (wrong.size === 0) {
      playRewardSound('correct');
      setResolving(true);
      const roundScore = Math.max(20, 100 - roundAttempts * 20);
      window.setTimeout(() => {
        const next = [...roundScores, roundScore];
        setRoundScores(next);
        if (roundIndex + 1 >= verses.length) {
          finishGame(next);
        } else {
          setRoundIndex(roundIndex + 1);
          beginRound(verses[roundIndex + 1]);
        }
      }, 500);
    } else {
      playRewardSound('wrong');
      setWrongSlots(wrong);
    }
  }

  function finishGame(finalRoundScores: number[]) {
    if (!profile) return;
    playRewardSound('questComplete');
    const timeSeconds = Math.round((Date.now() - startedAt) / 1000);
    const totalScore = finalRoundScores.reduce((a, b) => a + b, 0);
    const accuracy = Math.round((finalRoundScores.reduce((a, b) => a + b, 0) / (finalRoundScores.length * 100)) * 100);
    const result = recordGameSession(profile.id, {
      gameId: 'verse-builder',
      score: totalScore,
      accuracy,
      timeSeconds,
      difficulty,
      mistakes: totalAttempts,
      completed: true,
    });
    setOutcome(result);
    setPhase('result');
  }

  const best = profile ? getPersonalBest(profile.id, 'verse-builder') : null;
  const allFilled = slots.length > 0 && slots.every((s) => s !== null);

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Loading Verse Builder…</p>
      </main>
    );
  }

  const body = (
    <div className="adv-body arcade-body arcade-game-body">
        {phase === 'setup' && (
          <section className="arcade-setup-card">
            <span className="arcade-setup-icon" aria-hidden="true">🧱</span>
            <h1>Verse Builder</h1>
            <p>Arrange {VERSE_ROUNDS_PER_SESSION} verses in the right order. {best && `Your best score: ${best.score}.`}</p>
            <DifficultyPicker value={difficulty} onChange={setDifficulty} allowedLevels={profile ? allowedDifficultiesFor(profile.kind) : undefined} />
            <button type="button" className="button button-primary arcade-start-btn" onClick={startGame}>Start game</button>
          </section>
        )}

        {phase === 'playing' && words.length > 0 && (
          <section className="arcade-play-card">
            <div className="arcade-play-meta">
              <span>Verse {roundIndex + 1} of {verses.length}</span>
              <span>{verses[roundIndex].reference}</span>
            </div>

            <div className="verse-builder-slots">
              {slots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  className={`verse-builder-slot ${slot ? 'filled' : ''} ${wrongSlots.has(index) ? 'wrong' : ''}`}
                  onClick={() => tapSlot(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(index)}
                >
                  {slot ? slot.w : '__'}
                </button>
              ))}
            </div>

            <div className="daily-widget-bank verse-builder-bank">
              {bank.map((item) => (
                <button
                  key={item.i}
                  type="button"
                  draggable
                  onDragStart={() => setDragIndex(item.i)}
                  onClick={() => tapWord(item)}
                >
                  {item.w}
                </button>
              ))}
            </div>

            <p className="daily-widget-hint">Tap a word to place it, tap a filled slot to remove it — or drag words with a mouse.</p>
            <button type="button" className="button button-primary arcade-start-btn" disabled={!allFilled || resolving} onClick={submitRound}>Check order</button>
          </section>
        )}

        {phase === 'result' && outcome && (
          <GameResultModal
            title="Verse Builder complete!"
            score={outcome.session.score}
            accuracy={outcome.session.accuracy}
            best={getPersonalBest(profile.id, 'verse-builder')}
            isNewBest={outcome.isNewBest}
            xpEarned={outcome.session.xpEarned}
            coinsEarned={outcome.session.coinsEarned}
            onPlayAgain={() => setPhase('setup')}
            {...(embedded && onClose ? { onBack: onClose } : { backHref: '/arcade' })}
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
            <strong>Verse Builder</strong>
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

export default function VerseBuilderPage() {
  return <VerseBuilderGame />;
}
