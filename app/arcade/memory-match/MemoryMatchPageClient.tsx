'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { hasActiveSession, readActiveProfile, type PlayerProfile } from '../../adventure/storage';
import { logGameEvent } from '../../lib/analytics';
import { useDialogA11y } from '../../lib/use-dialog';
import { DifficultyPicker } from '../components';
import { allowedDifficultiesFor, defaultDifficultyFor, getGameDefinition } from '../catalog';
import { getPersonalBest, recordGameSession } from '../storage';
import { playRewardSound } from '../../lib/sound/sound-effects';
import type { DifficultyLevel, GameOutcome } from '../types';
import {
  DEFAULT_MATCH_MODE,
  computeMemoryMatchScore,
  generateDeck,
  gridColumnsFor,
  hasTimeChallenge,
  type MemoryCard,
} from './engine';

const GAME_DEF = getGameDefinition('memory-match');
const MISMATCH_PAUSE_MS = 800;
const MATCH_PAUSE_MS = 450;

export function MemoryMatchGame({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [deck, setDeck] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);
  const startedAtRef = useRef(0);

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

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase]);

  function startGame() {
    if (!profile) return;
    const newDeck = generateDeck(DEFAULT_MATCH_MODE, difficulty);
    setDeck(newDeck);
    setFlipped([]);
    setMatchedPairs(0);
    setMistakes(0);
    setResolving(false);
    setElapsedSeconds(0);
    startedAtRef.current = Date.now();
    setPhase('playing');
    logGameEvent('GAME_STARTED', {
      userId: profile.id,
      gameId: 'memory-match',
      difficulty,
      skillsPracticed: GAME_DEF?.skills,
    });
  }

  function flipCard(uid: number) {
    if (resolving) return;
    const card = deck.find((c) => c.uid === uid);
    if (!card || card.matched || flipped.includes(uid) || flipped.length >= 2) return;

    playRewardSound('tap');
    const nextFlipped = [...flipped, uid];
    setFlipped(nextFlipped);
    if (nextFlipped.length < 2) return;

    setResolving(true);
    const [firstUid, secondUid] = nextFlipped;
    const first = deck.find((c) => c.uid === firstUid);
    const second = deck.find((c) => c.uid === secondUid);
    const isMatch = !!first && !!second && first.pairId === second.pairId;

    window.setTimeout(() => {
      if (isMatch) {
        playRewardSound('correct');
        setDeck((prev) => prev.map((c) => (c.uid === firstUid || c.uid === secondUid ? { ...c, matched: true } : c)));
        setMatchedPairs((count) => count + 1);
        setFlipped([]);
        setResolving(false);
      } else {
        playRewardSound('wrong');
        setMistakes((m) => m + 1);
        setFlipped([]);
        setResolving(false);
      }
    }, isMatch ? MATCH_PAUSE_MS : MISMATCH_PAUSE_MS);
  }

  function finishGame(finalMatchedPairs: number) {
    if (!profile) return;
    playRewardSound('questComplete');
    const timeSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
    const { score, accuracy } = computeMemoryMatchScore({ pairCount: finalMatchedPairs, mistakes, timeSeconds, difficulty });
    const result = recordGameSession(profile.id, {
      gameId: 'memory-match',
      score,
      accuracy,
      timeSeconds,
      difficulty,
      mistakes,
      completed: true,
    });
    setOutcome(result);
    setPhase('result');
    logGameEvent('GAME_COMPLETED', {
      userId: profile.id,
      gameId: 'memory-match',
      difficulty,
      score,
      accuracy,
      timeSeconds,
      mistakes,
      matches: finalMatchedPairs,
      xpEarned: result.session.xpEarned,
      skillsPracticed: GAME_DEF?.skills,
    });
  }

  useEffect(() => {
    if (phase !== 'playing' || deck.length === 0) return;
    if (matchedPairs > 0 && matchedPairs * 2 === deck.length) finishGame(matchedPairs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedPairs]);

  const best = profile ? getPersonalBest(profile.id, 'memory-match') : null;
  const totalPairs = deck.length / 2;
  const columns = gridColumnsFor(deck.length);

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Loading Memory Match…</p>
      </main>
    );
  }

  const body = (
      <div className="adv-body arcade-body arcade-game-body">
        {phase === 'setup' && (
          <section className="arcade-setup-card">
            <span className="arcade-setup-icon" aria-hidden="true">🃏</span>
            <h1>Memory Match</h1>
            <p>Flip cards to match Bible characters to their icon. {best && `Your best score: ${best.score}.`}</p>
            <DifficultyPicker value={difficulty} onChange={setDifficulty} allowedLevels={profile ? allowedDifficultiesFor(profile.kind) : undefined} />
            {hasTimeChallenge(difficulty) && <p className="arcade-setup-note">⏱ Expert includes a soft time challenge — no penalty for going over, just a fun target.</p>}
            <button type="button" className="button button-primary arcade-start-btn" onClick={startGame}>Start game</button>
          </section>
        )}

        {phase === 'playing' && deck.length > 0 && (
          <section className="arcade-play-card memory-match-play">
            <div className="arcade-play-meta">
              <span>🧩 {matchedPairs}/{totalPairs} matched</span>
              <span>❌ {mistakes} mistakes</span>
              <span>⏱ {elapsedSeconds}s</span>
            </div>

            <div className="memory-match-grid" style={{ ['--mm-columns' as string]: columns }}>
              {deck.map((card) => {
                const faceUp = card.matched || flipped.includes(card.uid);
                const label = card.face.kind === 'emoji' ? `Picture card${faceUp ? `: ${card.face.caption ?? ''}` : ''}` : faceUp ? card.face.value : 'Face-down card';
                return (
                  <button
                    key={card.uid}
                    type="button"
                    className={`memory-card ${faceUp ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
                    onClick={() => flipCard(card.uid)}
                    disabled={card.matched || (resolving && !faceUp)}
                    aria-label={label}
                    aria-pressed={faceUp}
                  >
                    <span className="memory-card-inner">
                      <span className="memory-card-back" aria-hidden="true">🏮</span>
                      <span className="memory-card-front" aria-hidden="true">{card.face.value}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {phase === 'result' && outcome && (
          <MemoryResultScreen
            outcome={outcome}
            best={getPersonalBest(profile.id, 'memory-match')}
            onPlayAgain={startGame}
            onChangeDifficulty={() => setPhase('setup')}
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
            <strong>Memory Match</strong>
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

export default function MemoryMatchPage() {
  return <MemoryMatchGame />;
}

function MemoryResultScreen({
  outcome,
  best,
  onPlayAgain,
  onChangeDifficulty,
  onBack,
}: {
  outcome: GameOutcome;
  best: ReturnType<typeof getPersonalBest>;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
  onBack?: () => void;
}) {
  const dialogRef = useDialogA11y<HTMLElement>(true, onChangeDifficulty);
  const { session, isNewBest, previousBest } = outcome;
  const beatTime = !!previousBest && session.timeSeconds < previousBest.timeSeconds;
  const beatMistakes = !!previousBest && previousBest.mistakes !== undefined && session.mistakes < previousBest.mistakes;
  const anyRecord = isNewBest || beatTime || beatMistakes;

  return (
    <div className="help-overlay" role="presentation">
      <section ref={dialogRef} className="help-dialog arcade-result-dialog" role="dialog" aria-modal="true" aria-labelledby="memory-result-title">
        <p className="child-kicker">{anyRecord ? '🏆 New personal best!' : 'Nicely done'}</p>
        <h2 id="memory-result-title">Memory Match complete!</h2>

        <div className="arcade-result-stats memory-result-stats">
          <div><strong>{session.score}</strong><small>⭐ Score</small></div>
          <div><strong>{Math.round(session.accuracy)}%</strong><small>🎯 Accuracy</small></div>
          <div><strong>{session.timeSeconds}s</strong><small>⏱ Time</small></div>
          <div><strong>{session.mistakes}</strong><small>❌ Mistakes</small></div>
        </div>

        <p className="memory-result-best">
          🏆 Best score: {best ? Math.max(best.score, session.score) : session.score}
          {previousBest && ` (previous: ${previousBest.score})`}
        </p>

        <p className="arcade-result-xp">⭐ +{session.xpEarned} XP{session.coinsEarned > 0 ? ` · 🪙 +${session.coinsEarned} coins` : ''}</p>

        <div className="arcade-result-actions">
          <button type="button" className="button button-primary" onClick={onPlayAgain}>Play again</button>
          <button type="button" className="button button-secondary" onClick={onChangeDifficulty}>Change difficulty</button>
          {onBack ? (
            <button type="button" className="button button-danger" onClick={onBack}>Back to Arcade</button>
          ) : (
            <Link className="button button-danger" href="/arcade">Back to Arcade</Link>
          )}
        </div>
      </section>
    </div>
  );
}
