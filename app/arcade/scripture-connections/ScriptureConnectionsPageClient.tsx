'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { hasActiveSession, readActiveProfile, type PlayerProfile } from '../../adventure/storage';
import { logGameEvent } from '../../lib/analytics';
import { getTodayDateKey } from '../../lib/date';
import { useDialogA11y } from '../../lib/use-dialog';
import { DifficultyPicker } from '../components';
import { defaultDifficultyForAge } from '../catalog';
import { getPersonalBest, recordGameSession } from '../storage';
import type { DifficultyLevel, GameOutcome } from '../types';
import { getDailyStreak, markDailyCompleted } from './daily-history';
import {
  buildBoard,
  computeConnectionsScore,
  getDailyPuzzle,
  isOneAway,
  nowMs,
  pickPracticePuzzle,
  type ConnectionsGroup,
  type PuzzleDefinition,
  type Tile,
} from './engine';
import { PUZZLE_BANK } from './puzzles';

const SOLVE_PAUSE_MS = 700;
const MISTAKE_PAUSE_MS = 1300;

type Mode = 'daily' | 'practice';
type ResolvedGroup = { group: ConnectionsGroup; way: 'solved' | 'revealed' };

export default function ScriptureConnectionsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [mode, setMode] = useState<Mode>('daily');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');

  const [puzzle, setPuzzle] = useState<PuzzleDefinition | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resolvedGroups, setResolvedGroups] = useState<ResolvedGroup[]>([]);
  const [mistakesRemaining, setMistakesRemaining] = useState(0);
  const [hintedGroupIds, setHintedGroupIds] = useState<Set<string>>(new Set());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState<'wrong' | 'oneAway' | null>(null);
  const [resolving, setResolving] = useState(false);
  const [pendingFinish, setPendingFinish] = useState(false);

  const [result, setResult] = useState<{ outcome: GameOutcome; wasRevealed: boolean } | null>(null);

  const startedAtRef = useRef(0);
  const todayKey = getTodayDateKey();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasActiveSession()) { window.location.href = '/'; return; }
      const activeProfile = readActiveProfile();
      setProfile(activeProfile);
      setDifficulty(defaultDifficultyForAge(activeProfile.age));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function startPuzzle(selectedMode: Mode) {
    if (!profile) return;
    const selectedPuzzle = selectedMode === 'daily' ? getDailyPuzzle(PUZZLE_BANK, todayKey) : pickPracticePuzzle(PUZZLE_BANK, difficulty);
    setMode(selectedMode);
    setPuzzle(selectedPuzzle);
    setTiles(buildBoard(selectedPuzzle));
    setSelectedIds(new Set());
    setResolvedGroups([]);
    setMistakesRemaining(selectedPuzzle.maxMistakes);
    setHintedGroupIds(new Set());
    setHintsUsed(0);
    setFeedback(null);
    setResolving(false);
    setPendingFinish(false);
    setResult(null);
    startedAtRef.current = nowMs();
    setPhase('playing');
    logGameEvent('GAME_STARTED', {
      userId: profile.id,
      gameId: 'scripture-connections',
      difficulty: selectedPuzzle.difficulty,
      puzzleId: selectedPuzzle.id,
      mode: selectedMode,
      skillsPracticed: selectedPuzzle.skills,
    });
  }

  function toggleTile(tile: Tile) {
    if (resolving) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tile.id)) {
        next.delete(tile.id);
      } else if (next.size < 4) {
        next.add(tile.id);
      }
      return next;
    });
  }

  function submitGroup() {
    if (!puzzle || resolving || selectedIds.size !== 4) return;
    const selectedTiles = tiles.filter((t) => selectedIds.has(t.id));
    const groupIds = selectedTiles.map((t) => t.groupId);
    const matchedGroupId = groupIds.every((id) => id === groupIds[0]) ? groupIds[0] : null;

    if (matchedGroupId) {
      const matchedGroup = puzzle.groups.find((g) => g.id === matchedGroupId)!;
      setResolving(true);
      if (profile) {
        logGameEvent('GROUP_SOLVED', {
          userId: profile.id,
          gameId: 'scripture-connections',
          difficulty: puzzle.difficulty,
          puzzleId: puzzle.id,
          mode,
          category: matchedGroup.category,
        });
      }
      const newResolvedCount = resolvedGroups.length + 1;
      window.setTimeout(() => {
        setTiles((prev) => prev.filter((t) => t.groupId !== matchedGroupId));
        setSelectedIds(new Set());
        setResolving(false);
        setResolvedGroups((prev) => [...prev, { group: matchedGroup, way: 'solved' }]);
        if (newResolvedCount === puzzle.groups.length) setPendingFinish(true);
      }, SOLVE_PAUSE_MS);
      return;
    }

    const wasOneAway = isOneAway(groupIds);
    setFeedback(wasOneAway ? 'oneAway' : 'wrong');
    setResolving(true);
    if (profile) {
      logGameEvent('MISTAKE_MADE', {
        userId: profile.id,
        gameId: 'scripture-connections',
        difficulty: puzzle.difficulty,
        puzzleId: puzzle.id,
        mode,
      });
    }
    const remainingAfter = mistakesRemaining - 1;
    setMistakesRemaining(remainingAfter);
    window.setTimeout(() => {
      setFeedback(null);
      setResolving(false);
      if (remainingAfter <= 0) {
        const remainingGroups = puzzle.groups.filter((g) => !resolvedGroups.some((r) => r.group.id === g.id));
        setResolvedGroups((prev) => [...prev, ...remainingGroups.map((g) => ({ group: g, way: 'revealed' as const }))]);
        setTiles([]);
        setPendingFinish(true);
      }
    }, MISTAKE_PAUSE_MS);
  }

  function requestHint() {
    if (!puzzle || resolving) return;
    const nextGroup = puzzle.groups.find((g) => !resolvedGroups.some((r) => r.group.id === g.id) && !hintedGroupIds.has(g.id));
    if (!nextGroup) return;
    setHintedGroupIds((prev) => new Set(prev).add(nextGroup.id));
    setHintsUsed((h) => h + 1);
    if (profile) {
      logGameEvent('HINT_USED', {
        userId: profile.id,
        gameId: 'scripture-connections',
        difficulty: puzzle.difficulty,
        puzzleId: puzzle.id,
        mode,
        hintsUsed: hintsUsed + 1,
      });
    }
  }

  function finishPuzzle() {
    if (!profile || !puzzle) return;
    const timeSeconds = Math.round((nowMs() - startedAtRef.current) / 1000);
    const mistakesMade = puzzle.maxMistakes - mistakesRemaining;
    const { score, accuracy } = computeConnectionsScore({ groupsTotal: puzzle.groups.length, mistakes: mistakesMade, hintsUsed, timeSeconds });
    const wasRevealed = resolvedGroups.some((r) => r.way === 'revealed');

    const outcome = recordGameSession(profile.id, {
      gameId: 'scripture-connections',
      score,
      accuracy,
      timeSeconds,
      difficulty: puzzle.difficulty,
      mistakes: mistakesMade,
      completed: true,
      hintsUsed,
    });

    if (mode === 'daily') markDailyCompleted(profile.id, todayKey);
    setResult({ outcome, wasRevealed });
    setPhase('result');

    logGameEvent('GAME_COMPLETED', {
      userId: profile.id,
      gameId: 'scripture-connections',
      difficulty: puzzle.difficulty,
      puzzleId: puzzle.id,
      mode,
      score,
      accuracy,
      timeSeconds,
      mistakes: mistakesMade,
      hintsUsed,
      xpEarned: outcome.session.xpEarned,
      skillsPracticed: puzzle.skills,
    });
  }

  useEffect(() => {
    if (phase === 'playing' && pendingFinish) finishPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFinish]);

  const best = profile ? getPersonalBest(profile.id, 'scripture-connections') : null;
  const streak = profile ? getDailyStreak(profile.id) : null;
  const allSelected = selectedIds.size === 4;

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Loading Scripture Connections…</p>
      </main>
    );
  }

  return (
    <main className="adventure-page arcade-page">
      <header className="child-topbar adv-topbar">
        <Link href="/arcade" className="child-logo">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span>
            <strong>Scripture Connections</strong>
            <small>Lantern Arcade</small>
          </span>
        </Link>
        <div className="child-header-actions">
          <Link href="/arcade" className="help-button">← Arcade</Link>
        </div>
      </header>

      <div className="adv-body arcade-body arcade-game-body">
        {phase === 'setup' && (
          <section className="sc-setup">
            <span className="arcade-setup-icon" aria-hidden="true">🔗</span>
            <h1>Scripture Connections</h1>
            <p>Find the four groups of four. {best && `Your best score: ${best.score}.`}</p>

            <div className="lq-mode-picker" role="group" aria-label="Mode">
              <button type="button" className={mode === 'daily' ? 'active' : ''} aria-pressed={mode === 'daily'} onClick={() => setMode('daily')}>🗓️ Today’s Puzzle</button>
              <button type="button" className={mode === 'practice' ? 'active' : ''} aria-pressed={mode === 'practice'} onClick={() => setMode('practice')}>🎯 Practice Mode</button>
            </div>

            {mode === 'daily' && streak && (
              <div className="sc-streak-card">
                <span>🔥 Current streak: <strong>{streak.current}</strong> day{streak.current === 1 ? '' : 's'}</span>
                <span>🏆 Longest streak: <strong>{streak.longest}</strong> day{streak.longest === 1 ? '' : 's'}</span>
              </div>
            )}

            {mode === 'practice' && <DifficultyPicker value={difficulty} onChange={setDifficulty} />}

            <button type="button" className="button button-primary arcade-start-btn" onClick={() => startPuzzle(mode)}>
              {mode === 'daily' ? 'Play today’s puzzle' : 'Start practice puzzle'}
            </button>
          </section>
        )}

        {phase === 'playing' && puzzle && (
          <section className="arcade-play-card sc-play">
            <div className="arcade-play-meta">
              <span>{mode === 'daily' ? '🗓️ Today’s Puzzle' : '🎯 Practice'}</span>
              <span className="sc-mistakes">
                Mistakes remaining:
                {Array.from({ length: puzzle.maxMistakes }).map((_, i) => (
                  <span key={i} className={`sc-mistake-dot ${i < mistakesRemaining ? 'active' : ''}`} />
                ))}
              </span>
            </div>

            <div className="sc-solved-stack">
              {resolvedGroups.map((r, i) => (
                <div key={r.group.id} className={`sc-solved-bar sc-tone-${i % 4} ${r.way === 'revealed' ? 'revealed' : ''}`}>
                  <strong>{r.group.category}</strong>
                  <span>{r.group.items.join(' · ')}</span>
                </div>
              ))}
            </div>

            {feedback && (
              <p className={`sc-feedback ${feedback}`} role="status">
                {feedback === 'oneAway' ? 'So close — one of these belongs elsewhere.' : 'Not quite. Try another connection.'}
              </p>
            )}

            {tiles.length > 0 && (
              <div className="sc-board" style={{ ['--sc-columns' as string]: 4 }}>
                {tiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    className={`sc-tile ${selectedIds.has(tile.id) ? 'selected' : ''}`}
                    disabled={resolving}
                    onClick={() => toggleTile(tile)}
                  >
                    {tile.text}
                  </button>
                ))}
              </div>
            )}

            {tiles.length > 0 && (
              <div className="sc-actions">
                <button type="button" className="button button-secondary" disabled={selectedIds.size === 0 || resolving} onClick={() => setSelectedIds(new Set())}>Deselect all</button>
                <button type="button" className="button button-primary" disabled={!allSelected || resolving} onClick={submitGroup}>Submit group</button>
              </div>
            )}

            <div className="bd-hint-row">
              <button type="button" className="button button-secondary bd-hint-btn" disabled={resolving || hintedGroupIds.size + resolvedGroups.length >= puzzle.groups.length} onClick={requestHint}>
                💡 Get a hint
              </button>
              {puzzle.groups
                .filter((g) => hintedGroupIds.has(g.id) && !resolvedGroups.some((r) => r.group.id === g.id))
                .map((g) => (
                  <div key={g.id} className="lq-feedback bd-hint-banner sc-hint-banner" role="status">
                    <strong>Hint</strong>
                    <p>One connection is: “{g.category}”</p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {phase === 'result' && result && puzzle && (
          <ConnectionsResultScreen
            result={result}
            puzzle={puzzle}
            mode={mode}
            best={best}
            streak={streak}
            onPlayAgain={() => startPuzzle(mode)}
            onSwitchMode={() => setPhase('setup')}
          />
        )}
      </div>
    </main>
  );
}

function ConnectionsResultScreen({
  result,
  puzzle,
  mode,
  best,
  streak,
  onPlayAgain,
  onSwitchMode,
}: {
  result: { outcome: GameOutcome; wasRevealed: boolean };
  puzzle: PuzzleDefinition;
  mode: Mode;
  best: ReturnType<typeof getPersonalBest>;
  streak: ReturnType<typeof getDailyStreak> | null;
  onPlayAgain: () => void;
  onSwitchMode: () => void;
}) {
  const dialogRef = useDialogA11y<HTMLElement>(true, onSwitchMode);
  const { session, isNewBest } = result.outcome;

  return (
    <div className="help-overlay" role="presentation">
      <section ref={dialogRef} className="help-dialog arcade-result-dialog bts-result-dialog" role="dialog" aria-modal="true" aria-labelledby="sc-result-title">
        <p className="child-kicker">{result.wasRevealed ? 'Puzzle complete' : isNewBest ? '🏆 New personal best!' : 'Nicely solved'}</p>
        <h2 id="sc-result-title">Scripture Connections complete!</h2>

        <div className="arcade-result-stats memory-result-stats">
          <div><strong>{session.score}</strong><small>⭐ Score</small></div>
          <div><strong>{Math.round(session.accuracy)}%</strong><small>🎯 Accuracy</small></div>
          <div><strong>{session.timeSeconds}s</strong><small>⏱ Time</small></div>
          <div><strong>{session.hintsUsed ?? 0}</strong><small>💡 Hints</small></div>
        </div>

        {mode === 'daily' && streak && (
          <p className="sc-streak-result">🔥 Daily streak: {streak.current} day{streak.current === 1 ? '' : 's'} (longest: {streak.longest})</p>
        )}

        <div className="bts-learning-card sc-learning-card">
          <p className="bts-order-heading">Today’s connections:</p>
          {puzzle.groups.map((g) => (
            <div key={g.id} className="sc-learning-group">
              <strong>{g.category}</strong> — {g.items.join(', ')}
              <p>{g.explanation}</p>
            </div>
          ))}
        </div>

        <p className="arcade-result-xp">⭐ +{session.xpEarned} XP{session.coinsEarned > 0 ? ` · 🪙 +${session.coinsEarned} coins` : ''}</p>
        {best && <p className="memory-result-best">🏆 Best score: {Math.max(best.score, session.score)}</p>}

        <div className="arcade-result-actions">
          <button type="button" className="button button-primary" onClick={onPlayAgain}>Play again</button>
          <button type="button" className="button button-secondary" onClick={onSwitchMode}>Change mode</button>
          <Link className="button button-secondary" href="/arcade">Back to Arcade</Link>
        </div>
      </section>
    </div>
  );
}
