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
  QUIZ_MODES,
  QUIZ_MODE_ORDER,
  buildQuizQueue,
  comboLabel,
  computeQuestionPoints,
  nowMs,
  summarizeRound,
  type AnswerRecord,
  type QuizCategory,
  type QuizModeId,
  type QuizQuestion,
} from './engine';
import { QUIZ_CATEGORIES } from './questions';

const GAME_DEF = getGameDefinition('lightning-quiz');
const FEEDBACK_MS = 1100;

function defaultModeForAge(age: number): QuizModeId {
  return age <= 11 ? 'questions-10' : 'timed-30';
}

export function LightningQuizGame({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [mode, setMode] = useState<QuizModeId>('questions-10');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [category, setCategory] = useState<QuizCategory | 'all'>('all');

  const [queue, setQueue] = useState<QuizQuestion[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [roundOver, setRoundOver] = useState(false);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);

  const roundStartedAtRef = useRef(0);
  const questionStartedAtRef = useRef(0);
  const remainingSecondsRef = useRef(0);
  const feedbackRef = useRef<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasActiveSession()) { window.location.href = '/'; return; }
      const activeProfile = readActiveProfile();
      setProfile(activeProfile);
      setDifficulty(defaultDifficultyFor(activeProfile));
      setMode(defaultModeForAge(activeProfile.age));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds]);

  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);

  const modeDef = QUIZ_MODES[mode];
  const isTimed = modeDef.kind === 'timed';

  function startGame() {
    if (!profile) return;
    const newQueue = buildQuizQueue(category, difficulty, modeDef);
    setQueue(newQueue);
    setQueueIndex(0);
    setAnswers([]);
    setStreak(0);
    setSelectedChoice(null);
    setFeedback(null);
    setRoundOver(false);
    const initialSeconds = isTimed ? modeDef.seconds ?? 30 : 0;
    setRemainingSeconds(initialSeconds);
    remainingSecondsRef.current = initialSeconds;
    roundStartedAtRef.current = nowMs();
    questionStartedAtRef.current = nowMs();
    setPhase('playing');
    logGameEvent('GAME_STARTED', {
      userId: profile.id,
      gameId: 'lightning-quiz',
      difficulty,
      category,
      skillsPracticed: GAME_DEF?.skills,
    });
  }

  function selectAnswer(index: number) {
    if (feedback !== null || roundOver) return;
    const question = queue[queueIndex];
    if (!question) return;
    const responseMs = nowMs() - questionStartedAtRef.current;
    const correct = index === question.correctIndex;
    const newStreak = correct ? streak + 1 : 0;
    const points = computeQuestionPoints(question.difficulty, correct, responseMs, newStreak);
    const record: AnswerRecord = {
      questionId: question.id,
      category: question.category,
      difficulty: question.difficulty,
      correct,
      responseMs,
      pointsEarned: points,
      streakAfter: newStreak,
    };

    setAnswers((prev) => [...prev, record]);
    setStreak(newStreak);
    setSelectedChoice(index);
    setFeedback(correct ? 'correct' : 'incorrect');
    if (correct) {
      playRewardSound('correct');
    } else {
      playRewardSound('wrong');
    }

    if (profile) {
      logGameEvent('QUESTION_ANSWERED', {
        userId: profile.id,
        gameId: 'lightning-quiz',
        difficulty: question.difficulty,
        category: question.category,
        score: points,
        combo: newStreak,
      });
    }

    window.setTimeout(() => advanceRound(), FEEDBACK_MS);
  }

  function advanceRound() {
    setFeedback(null);
    setSelectedChoice(null);
    const nextIndex = queueIndex + 1;
    const fixedDone = modeDef.kind === 'fixed' && nextIndex >= (modeDef.questionCount ?? 0);
    const timeUp = modeDef.kind === 'timed' && remainingSecondsRef.current <= 0;
    if (fixedDone || timeUp) {
      setRoundOver(true);
    } else {
      setQueueIndex(nextIndex);
      questionStartedAtRef.current = nowMs();
    }
  }

  function finishGame() {
    if (!profile) return;
    const timeSeconds = Math.round((nowMs() - roundStartedAtRef.current) / 1000);
    const summary = summarizeRound(answers);
    const previousBest = getPersonalBest(profile.id, 'lightning-quiz');
    const result = recordGameSession(profile.id, {
      gameId: 'lightning-quiz',
      score: summary.score,
      accuracy: summary.accuracy,
      timeSeconds,
      difficulty,
      mistakes: summary.questionsAnswered - summary.questionsCorrect,
      completed: true,
      highestCombo: summary.highestCombo,
      avgResponseMs: summary.avgResponseMs,
    });
    setOutcome(result);
    setPhase('result');

    logGameEvent('GAME_COMPLETED', {
      userId: profile.id,
      gameId: 'lightning-quiz',
      difficulty,
      category,
      score: summary.score,
      accuracy: summary.accuracy,
      timeSeconds,
      questionsAnswered: summary.questionsAnswered,
      questionsCorrect: summary.questionsCorrect,
      combo: summary.highestCombo,
      xpEarned: result.session.xpEarned,
      skillsPracticed: GAME_DEF?.skills,
    });

    const beatScore = result.isNewBest;
    const beatAccuracy = !previousBest || summary.accuracy > previousBest.accuracy;
    const beatCombo = !previousBest || summary.highestCombo > (previousBest.highestCombo ?? 0);
    const beatSpeed = !!previousBest && previousBest.avgResponseMs !== undefined && summary.avgResponseMs < previousBest.avgResponseMs;
    if (beatScore || beatAccuracy || beatCombo || beatSpeed) {
      logGameEvent('PERSONAL_BEST', {
        userId: profile.id,
        gameId: 'lightning-quiz',
        difficulty,
        category,
        score: summary.score,
        accuracy: summary.accuracy,
        combo: summary.highestCombo,
      });
    }
  }

  // Timed-mode countdown — ends the round from inside the interval's own
  // callback (not synchronously in the effect body) the moment it hits
  // zero, unless we're mid-feedback (advanceRound handles that case
  // instead once the feedback pause finishes).
  useEffect(() => {
    if (phase !== 'playing' || !isTimed) return;
    const interval = window.setInterval(() => {
      const next = Math.max(0, remainingSecondsRef.current - 1);
      remainingSecondsRef.current = next;
      setRemainingSeconds(next);
      if (next <= 0 && feedbackRef.current === null) setRoundOver(true);
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode]);

  useEffect(() => {
    if (phase === 'playing' && roundOver) finishGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundOver]);

  const best = profile ? getPersonalBest(profile.id, 'lightning-quiz') : null;
  const currentQuestion = queue[queueIndex] ?? null;
  const combo = comboLabel(streak);
  const totalSeconds = modeDef.seconds ?? 30;

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Loading Lightning Quiz…</p>
      </main>
    );
  }

  const body = (
      <div className="adv-body arcade-body arcade-game-body">
        {phase === 'setup' && (
          <section className="arcade-setup-card">
            <span className="arcade-setup-icon" aria-hidden="true">⚡</span>
            <h1>Lightning Quiz</h1>
            <p>Answer fast, build a combo. {best && `Your best score: ${best.score}.`}</p>

            <div className="lq-mode-picker" role="group" aria-label="Round">
              {QUIZ_MODE_ORDER.map((id) => (
                <button key={id} type="button" className={mode === id ? 'active' : ''} aria-pressed={mode === id} onClick={() => setMode(id)}>
                  {QUIZ_MODES[id].label}
                </button>
              ))}
            </div>
            <p className="arcade-setup-note">{modeDef.description}</p>

            <DifficultyPicker value={difficulty} onChange={setDifficulty} allowedLevels={profile ? allowedDifficultiesFor(profile.kind) : undefined} />

            <div className="lq-category-picker" role="group" aria-label="Category">
              <button type="button" className={category === 'all' ? 'active' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
                🔀 All categories
              </button>
              {QUIZ_CATEGORIES.map((c) => (
                <button key={c.id} type="button" className={category === c.id ? 'active' : ''} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            <button type="button" className="button button-primary arcade-start-btn" onClick={startGame}>Start game</button>
          </section>
        )}

        {phase === 'playing' && currentQuestion && (
          <section className={`arcade-play-card lq-play ${profile.age <= 8 ? 'lq-kid-mode' : ''}`}>
            <div className="arcade-play-meta">
              {modeDef.kind === 'fixed' ? (
                <span>❓ {queueIndex + 1} of {modeDef.questionCount}</span>
              ) : (
                <span className={remainingSeconds <= 5 ? 'arcade-timer-low' : ''}>⏱ {remainingSeconds}s</span>
              )}
              <span>⭐ {summarizeRound(answers).score}</span>
              {combo && <span className="lq-combo-badge">{combo}</span>}
            </div>

            {modeDef.kind === 'fixed' && (
              <div className="lq-progress-track"><i style={{ width: `${((queueIndex) / (modeDef.questionCount ?? 1)) * 100}%` }} /></div>
            )}
            {modeDef.kind === 'timed' && (
              <div className="lq-progress-track"><i style={{ width: `${(remainingSeconds / totalSeconds) * 100}%` }} /></div>
            )}

            <p className="lq-category-tag">{QUIZ_CATEGORIES.find((c) => c.id === currentQuestion.category)?.icon} {QUIZ_CATEGORIES.find((c) => c.id === currentQuestion.category)?.label}</p>
            <h2 className="lq-prompt">{currentQuestion.prompt}</h2>

            <div className="lq-choices">
              {currentQuestion.choices.map((choice, index) => {
                let choiceClass = '';
                if (feedback) {
                  if (index === currentQuestion.correctIndex) choiceClass = 'correct';
                  else if (index === selectedChoice) choiceClass = 'incorrect';
                }
                return (
                  <button
                    key={index}
                    type="button"
                    className={`lq-choice ${choiceClass}`}
                    disabled={feedback !== null || (isTimed && remainingSeconds <= 0)}
                    onClick={() => selectAnswer(index)}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div className={`lq-feedback ${feedback}`} role="status">
                <strong>{feedback === 'correct' ? 'Correct!' : 'Not quite!'}</strong>
                <p>{currentQuestion.explanation}</p>
                {currentQuestion.reference && <small>{currentQuestion.reference}</small>}
              </div>
            )}
          </section>
        )}

        {phase === 'result' && outcome && (
          <LightningResultScreen
            outcome={outcome}
            best={best}
            onPlayAgain={startGame}
            onChangeMode={() => setPhase('setup')}
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
            <strong>Lightning Quiz</strong>
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

export default function LightningQuizPage() {
  return <LightningQuizGame />;
}

function LightningResultScreen({
  outcome,
  best,
  onPlayAgain,
  onChangeMode,
  onBack,
}: {
  outcome: GameOutcome;
  best: ReturnType<typeof getPersonalBest>;
  onPlayAgain: () => void;
  onChangeMode: () => void;
  onBack?: () => void;
}) {
  const dialogRef = useDialogA11y<HTMLElement>(true, onChangeMode);
  const { session, isNewBest, previousBest } = outcome;
  const beatCombo = !!previousBest && (session.highestCombo ?? 0) > (previousBest.highestCombo ?? 0);
  const beatSpeed = !!previousBest && previousBest.avgResponseMs !== undefined && (session.avgResponseMs ?? Infinity) < previousBest.avgResponseMs;
  const anyRecord = isNewBest || beatCombo || beatSpeed;
  const avgSeconds = ((session.avgResponseMs ?? 0) / 1000).toFixed(1);

  return (
    <div className="help-overlay" role="presentation">
      <section ref={dialogRef} className="help-dialog arcade-result-dialog" role="dialog" aria-modal="true" aria-labelledby="lq-result-title">
        <p className="child-kicker">{anyRecord ? '🏆 New personal best!' : 'Nicely done'}</p>
        <h2 id="lq-result-title">Lightning Quiz complete!</h2>

        <div className="arcade-result-stats memory-result-stats">
          <div><strong>{session.score}</strong><small>⭐ Score</small></div>
          <div><strong>{Math.round(session.accuracy)}%</strong><small>🎯 Accuracy</small></div>
          <div><strong>{session.highestCombo ?? 0}x</strong><small>🔥 Best combo</small></div>
          <div><strong>{avgSeconds}s</strong><small>⚡ Avg speed</small></div>
        </div>

        <p className="memory-result-best">
          🏆 Best score: {best ? Math.max(best.score, session.score) : session.score}
          {previousBest && ` (previous: ${previousBest.score})`}
        </p>

        <p className="arcade-result-xp">⭐ +{session.xpEarned} XP{session.coinsEarned > 0 ? ` · 🪙 +${session.coinsEarned} coins` : ''}</p>

        <div className="arcade-result-actions">
          <button type="button" className="button button-primary" onClick={onPlayAgain}>Play again</button>
          <button type="button" className="button button-secondary" onClick={onChangeMode}>Change mode</button>
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
