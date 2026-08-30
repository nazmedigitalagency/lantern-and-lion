'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasActiveSession, readActiveProfile, type PlayerProfile } from '../../adventure/storage';
import { useDialogA11y } from '../../lib/use-dialog';
import { DifficultyPicker, GameResultModal } from '../components';
import { defaultDifficultyForAge } from '../catalog';
import { canMove, DIRECTION_DELTA, generateMaze, pickQuestions, type MazeLayout, type MazeQuestion } from '../maze-engine';
import { getPersonalBest, recordGameSession } from '../storage';
import type { DifficultyLevel, GameOutcome } from '../types';

type Pos = { row: number; col: number };
type Direction = 'N' | 'E' | 'S' | 'W';

function key(pos: Pos): string {
  return `${pos.row},${pos.col}`;
}

export default function ScriptureMazePage() {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [layout, setLayout] = useState<MazeLayout | null>(null);
  const [player, setPlayer] = useState<Pos>({ row: 0, col: 0 });
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [questions, setQuestions] = useState<MazeQuestion[]>([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState<{ pos: Pos; question: MazeQuestion } | null>(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [notice, setNotice] = useState('');
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);

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

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = window.setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [phase, startedAt]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(t);
  }, [notice]);

  function startGame() {
    const maze = generateMaze(difficulty);
    setLayout(maze);
    setPlayer(maze.start);
    setCollected(new Set());
    setAnswered(new Set());
    setQuestions(pickQuestions(difficulty, maze.checkpoints.length));
    setMistakes(0);
    setCorrectAnswers(0);
    setActiveCheckpoint(null);
    setStartedAt(Date.now());
    setElapsed(0);
    setPhase('playing');
  }

  function move(direction: Direction) {
    if (!layout || activeCheckpoint) return;
    if (!canMove(layout.cells, player, direction)) return;
    const delta = DIRECTION_DELTA[direction];
    const next = { row: player.row + delta.dr, col: player.col + delta.dc };
    setPlayer(next);

    const nextKey = key(next);
    if (layout.fragments.some((f) => key(f) === nextKey) && !collected.has(nextKey)) {
      setCollected((prev) => new Set(prev).add(nextKey));
    }

    const checkpointIndex = layout.checkpoints.findIndex((c) => key(c) === nextKey);
    if (checkpointIndex >= 0 && !answered.has(nextKey)) {
      setActiveCheckpoint({ pos: next, question: questions[checkpointIndex] });
      setCheckpointFeedback('');
      return;
    }

    if (key(next) === key(layout.exit)) {
      if (answered.size >= layout.checkpoints.length) {
        finishGame(next);
      } else {
        setNotice('Answer every checkpoint before you can finish the maze.');
      }
    }
  }

  function answerCheckpoint(optionIndex: number) {
    if (!activeCheckpoint) return;
    if (optionIndex === activeCheckpoint.question.correct) {
      setAnswered((prev) => new Set(prev).add(key(activeCheckpoint.pos)));
      setCorrectAnswers((c) => c + 1);
      setActiveCheckpoint(null);
    } else {
      setMistakes((m) => m + 1);
      setCheckpointFeedback('Not quite — try again.');
    }
  }

  function finishGame(finalPos: Pos) {
    if (!profile || !layout) return;
    void finalPos;
    const timeSeconds = Math.round((Date.now() - startedAt) / 1000);
    const attempts = correctAnswers + mistakes;
    const accuracy = attempts > 0 ? Math.round((correctAnswers / attempts) * 100) : 100;
    const score = Math.max(50, 1000 - timeSeconds * 4 - mistakes * 40 + collected.size * 25);
    const result = recordGameSession(profile.id, {
      gameId: 'scripture-maze',
      score,
      accuracy,
      timeSeconds,
      difficulty,
      mistakes,
      completed: true,
    });
    setOutcome(result);
    setPhase('result');
  }

  useEffect(() => {
    if (phase !== 'playing' || activeCheckpoint) return;
    function onKeyDown(e: KeyboardEvent) {
      const map: Record<string, Direction> = { ArrowUp: 'N', w: 'N', ArrowRight: 'E', d: 'E', ArrowDown: 'S', s: 'S', ArrowLeft: 'W', a: 'W' };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeCheckpoint, player, layout, collected, answered]);

  // No dismiss action makes sense here — the checkpoint must be answered to continue —
  // so Escape is a deliberate no-op; the hook still moves focus in and locks scroll.
  const checkpointDialogRef = useDialogA11y<HTMLElement>(Boolean(activeCheckpoint), () => {});

  const best = profile ? getPersonalBest(profile.id, 'scripture-maze') : null;

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Loading Scripture Maze…</p>
      </main>
    );
  }

  return (
    <main className="adventure-page arcade-page">
      <header className="child-topbar adv-topbar">
        <Link href="/arcade" className="child-logo">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span>
            <strong>Scripture Maze</strong>
            <small>Lantern Arcade</small>
          </span>
        </Link>
        <div className="child-header-actions">
          <Link href="/arcade" className="help-button">← Arcade</Link>
        </div>
      </header>

      <div className="adv-body arcade-body arcade-game-body">
        {phase === 'setup' && (
          <section className="arcade-setup-card">
            <span className="arcade-setup-icon" aria-hidden="true">🌀</span>
            <h1>Scripture Maze</h1>
            <p>Collect Scripture fragments and answer every checkpoint to reach the exit. {best && `Your best score: ${best.score}.`}</p>
            <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            <button type="button" className="button button-primary arcade-start-btn" onClick={startGame}>Start game</button>
          </section>
        )}

        {phase === 'playing' && layout && (
          <section className="arcade-maze-shell">
            <div className="arcade-play-meta">
              <span>⏱ {elapsed}s</span>
              <span>💎 {collected.size}/{layout.fragments.length}</span>
              <span>🚩 {answered.size}/{layout.checkpoints.length}</span>
              <span>❌ {mistakes}</span>
            </div>

            <div className="arcade-maze-grid" style={{ ['--maze-size' as string]: layout.size }}>
              {layout.cells.flat().map((cell) => {
                const cellKey = key(cell);
                const isPlayer = key(player) === cellKey;
                const isExit = key(layout.exit) === cellKey;
                const isFragment = layout.fragments.some((f) => key(f) === cellKey) && !collected.has(cellKey);
                const isCheckpoint = layout.checkpoints.some((c) => key(c) === cellKey);
                const isCheckpointDone = isCheckpoint && answered.has(cellKey);
                return (
                  <div
                    key={cellKey}
                    className="arcade-maze-cell"
                    style={{
                      borderTop: cell.walls.N ? '2px solid var(--navy)' : 'none',
                      borderRight: cell.walls.E ? '2px solid var(--navy)' : 'none',
                      borderBottom: cell.walls.S ? '2px solid var(--navy)' : 'none',
                      borderLeft: cell.walls.W ? '2px solid var(--navy)' : 'none',
                    }}
                  >
                    {isPlayer ? '🦁' : isExit ? '🏮' : isFragment ? '📜' : isCheckpoint ? (isCheckpointDone ? '✅' : '❓') : ''}
                  </div>
                );
              })}
            </div>

            <div className="arcade-maze-dpad" role="group" aria-label="Move">
              <button type="button" aria-label="Move up" onClick={() => move('N')}>▲</button>
              <div>
                <button type="button" aria-label="Move left" onClick={() => move('W')}>◀</button>
                <button type="button" aria-label="Move down" onClick={() => move('S')}>▼</button>
                <button type="button" aria-label="Move right" onClick={() => move('E')}>▶</button>
              </div>
            </div>
            <p className="daily-widget-hint">Arrow keys or WASD also work.</p>
          </section>
        )}

        {notice && (
          <div className="child-help-confirmation" role="status">
            <span>💡</span>
            <p>{notice}</p>
            <button onClick={() => setNotice('')}>Close</button>
          </div>
        )}

        {activeCheckpoint && (
          <div className="help-overlay" role="presentation">
            <section ref={checkpointDialogRef} className="help-dialog arcade-checkpoint-dialog" role="dialog" aria-modal="true" aria-labelledby="checkpoint-title">
              <p className="child-kicker">🚩 Checkpoint</p>
              <h2 id="checkpoint-title">{activeCheckpoint.question.prompt}</h2>
              <div className="arcade-checkpoint-options">
                {activeCheckpoint.question.options.map((option, i) => (
                  <button key={i} type="button" onClick={() => answerCheckpoint(i)}>{option}</button>
                ))}
              </div>
              {checkpointFeedback && <p className="arcade-checkpoint-feedback">{checkpointFeedback}</p>}
            </section>
          </div>
        )}

        {phase === 'result' && outcome && (
          <GameResultModal
            title="Maze complete!"
            score={outcome.session.score}
            accuracy={outcome.session.accuracy}
            best={getPersonalBest(profile.id, 'scripture-maze')}
            isNewBest={outcome.isNewBest}
            xpEarned={outcome.session.xpEarned}
            coinsEarned={outcome.session.coinsEarned}
            onPlayAgain={() => setPhase('setup')}
            backHref="/arcade"
          />
        )}
      </div>
    </main>
  );
}
