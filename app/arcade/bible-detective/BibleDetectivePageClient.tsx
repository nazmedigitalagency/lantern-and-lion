'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { hasActiveSession, readActiveProfile, type PlayerProfile } from '../../adventure/storage';
import { logGameEvent } from '../../lib/analytics';
import { useDialogA11y } from '../../lib/use-dialog';
import { getPersonalBest, recordGameSession } from '../storage';
import type { AgeBand, GameOutcome } from '../types';
import { hasBadge, markCaseSolved } from './badges';
import { CASE_BANK } from './cases';
import {
  CLUE_ICON,
  CLUE_LABEL,
  computeCaseScore,
  isCaseMastered,
  nowMs,
  totalClueCount,
  totalQuestionCount,
  type CaseDefinition,
  type CaseQuestion,
  type ClueDefinition,
} from './engine';

const RESOLVE_CORRECT_MS = 900;
const RESOLVE_WRONG_MS = 1100;

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

type Subphase = 'clues' | 'question' | 'final';

export default function BibleDetectivePage() {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [phase, setPhase] = useState<'browse' | 'case' | 'result'>('browse');
  const [ageFilter, setAgeFilter] = useState<AgeBand | 'all'>('all');

  const [caseDef, setCaseDef] = useState<CaseDefinition | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [subphase, setSubphase] = useState<Subphase>('clues');
  const [viewedClueIds, setViewedClueIds] = useState<Set<string>>(new Set());
  const [expandedClueId, setExpandedClueId] = useState<string | null>(null);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [hasAttemptedCurrent, setHasAttemptedCurrent] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [questionsCorrectFirstTry, setQuestionsCorrectFirstTry] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [pendingFinish, setPendingFinish] = useState(false);

  const [result, setResult] = useState<{ outcome: GameOutcome; badgeEarned: boolean } | null>(null);

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

  function openCase(def: CaseDefinition) {
    setCaseDef(def);
    setStageIndex(0);
    setSubphase('clues');
    setViewedClueIds(new Set());
    setExpandedClueId(null);
    setSelectedOption(null);
    setFeedback(null);
    setHasAttemptedCurrent(false);
    setHintVisible(false);
    setHintsUsed(0);
    setWrongAttempts(0);
    setQuestionsCorrectFirstTry(0);
    setResolving(false);
    setResult(null);
    startedAtRef.current = nowMs();
    setPhase('case');
    if (profile) {
      logGameEvent('GAME_STARTED', {
        userId: profile.id,
        gameId: 'bible-detective',
        difficulty: def.difficulty,
        caseId: def.id,
        skillsPracticed: def.skills,
      });
    }
  }

  function toggleClue(clue: ClueDefinition) {
    if (!caseDef) return;
    setExpandedClueId((prev) => (prev === clue.id ? null : clue.id));
    if (!viewedClueIds.has(clue.id)) {
      setViewedClueIds((prev) => new Set(prev).add(clue.id));
      if (profile) {
        logGameEvent('CLUE_VIEWED', {
          userId: profile.id,
          gameId: 'bible-detective',
          difficulty: caseDef.difficulty,
          caseId: caseDef.id,
          clue: `${clue.type}:${clue.id}`,
        });
      }
    }
  }

  function continueFromClues() {
    if (!caseDef) return;
    const stage = caseDef.stages[stageIndex];
    setSelectedOption(null);
    setFeedback(null);
    setHasAttemptedCurrent(false);
    setHintVisible(false);
    if (stage.question) {
      setSubphase('question');
    } else {
      advanceStage();
    }
  }

  function advanceStage() {
    if (!caseDef) return;
    setSelectedOption(null);
    setFeedback(null);
    setHasAttemptedCurrent(false);
    setHintVisible(false);
    if (stageIndex + 1 < caseDef.stages.length) {
      setStageIndex((i) => i + 1);
      setSubphase('clues');
    } else {
      setSubphase('final');
    }
  }

  function currentQuestion(): CaseQuestion | null {
    if (!caseDef) return null;
    if (subphase === 'final') return { id: 'final', ...caseDef.finalAnswer };
    return caseDef.stages[stageIndex].question ?? null;
  }

  function answerQuestion(index: number) {
    if (resolving || !caseDef) return;
    const question = currentQuestion();
    if (!question) return;
    const correct = index === question.correctIndex;
    setSelectedOption(index);
    setFeedback(correct ? 'correct' : 'incorrect');

    if (profile) {
      logGameEvent('QUESTION_ANSWERED', {
        userId: profile.id,
        gameId: 'bible-detective',
        difficulty: caseDef.difficulty,
        caseId: caseDef.id,
        questionsAnswered: 1,
        questionsCorrect: correct ? 1 : 0,
      });
    }

    if (correct) {
      if (!hasAttemptedCurrent) setQuestionsCorrectFirstTry((c) => c + 1);
      setResolving(true);
      window.setTimeout(() => {
        setFeedback(null);
        setSelectedOption(null);
        setHintVisible(false);
        setResolving(false);
        if (subphase === 'final') {
          setPendingFinish(true);
        } else {
          advanceStage();
        }
      }, RESOLVE_CORRECT_MS);
    } else {
      setWrongAttempts((w) => w + 1);
      setHasAttemptedCurrent(true);
      setResolving(true);
      window.setTimeout(() => {
        setFeedback(null);
        setSelectedOption(null);
        setResolving(false);
      }, RESOLVE_WRONG_MS);
    }
  }

  function requestHint() {
    if (hintVisible) return;
    setHintVisible(true);
    setHintsUsed((h) => h + 1);
    if (profile && caseDef) {
      logGameEvent('HINT_USED', {
        userId: profile.id,
        gameId: 'bible-detective',
        difficulty: caseDef.difficulty,
        caseId: caseDef.id,
        hintsUsed: hintsUsed + 1,
      });
    }
  }

  function finishCase() {
    if (!profile || !caseDef) return;
    const timeSeconds = Math.round((nowMs() - startedAtRef.current) / 1000);
    const clueCount = totalClueCount(caseDef);
    const questionCount = totalQuestionCount(caseDef);
    const { score, accuracy } = computeCaseScore({ clueCount, questionCount, questionsCorrectFirstTry, wrongAttempts, hintsUsed, timeSeconds });
    const mastered = isCaseMastered(wrongAttempts, hintsUsed);

    const outcome = recordGameSession(profile.id, {
      gameId: 'bible-detective',
      score,
      accuracy,
      timeSeconds,
      difficulty: caseDef.difficulty,
      mistakes: wrongAttempts,
      completed: true,
      attempts: questionCount + wrongAttempts,
      hintsUsed,
    });
    const isNewBadge = markCaseSolved(profile.id, caseDef.id);
    setResult({ outcome, badgeEarned: isNewBadge });
    setPhase('result');

    logGameEvent('CASE_COMPLETED', {
      userId: profile.id,
      gameId: 'bible-detective',
      difficulty: caseDef.difficulty,
      caseId: caseDef.id,
      score,
      accuracy,
      timeSeconds,
      hintsUsed,
      mistakes: wrongAttempts,
      xpEarned: outcome.session.xpEarned,
      skillsPracticed: caseDef.skills,
    });

    if (mastered) {
      logGameEvent('CASE_MASTERED', {
        userId: profile.id,
        gameId: 'bible-detective',
        difficulty: caseDef.difficulty,
        caseId: caseDef.id,
        score,
        accuracy,
      });
    }
  }

  // Runs finishCase() from a fresh render's closure once the final answer's
  // correctness has actually committed to state — calling it directly from
  // the setTimeout in `answerQuestion` would read a stale snapshot of
  // `questionsCorrectFirstTry`/`wrongAttempts`/`hintsUsed` from the render
  // the timeout was scheduled in, not the one after the final update landed.
  useEffect(() => {
    if (phase === 'case' && pendingFinish) finishCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFinish]);

  const visibleCases = ageFilter === 'all' ? CASE_BANK : CASE_BANK.filter((c) => c.ageGroup === ageFilter);
  const showAudio = profile ? ageBandForAge(profile.age) === 'kids' : false;
  const stage = caseDef ? caseDef.stages[stageIndex] : null;
  const allCluesViewed = stage ? stage.clues.every((c) => viewedClueIds.has(c.id)) : false;
  const question = currentQuestion();
  const best = profile && caseDef ? getPersonalBest(profile.id, 'bible-detective') : null;

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Loading Bible Detective…</p>
      </main>
    );
  }

  return (
    <main className="adventure-page arcade-page">
      <header className="child-topbar adv-topbar">
        <Link href="/arcade" className="child-logo">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span>
            <strong>Bible Detective</strong>
            <small>Lantern Arcade</small>
          </span>
        </Link>
        <div className="child-header-actions">
          <Link href="/arcade" className="help-button">← Arcade</Link>
        </div>
      </header>

      <div className="adv-body arcade-body arcade-game-body">
        {phase === 'browse' && (
          <section className="bd-browse">
            <span className="arcade-setup-icon" aria-hidden="true">🕵️</span>
            <h1>Bible Detective</h1>
            <p>Choose a case. Gather evidence. Solve the mystery.</p>

            <div className="lq-category-picker" role="group" aria-label="Age group">
              {(['all', 'kids', 'tweens', 'teens'] as const).map((band) => (
                <button key={band} type="button" className={ageFilter === band ? 'active' : ''} aria-pressed={ageFilter === band} onClick={() => setAgeFilter(band)}>
                  {band === 'all' ? '🔀 All cases' : band === 'kids' ? '🧒 Kids' : band === 'tweens' ? '🧑 Tweens' : '🧑‍🎓 Teens'}
                </button>
              ))}
            </div>

            <div className="bd-case-grid">
              {visibleCases.map((c) => {
                const caseBest = getPersonalBest(profile.id, 'bible-detective');
                const solved = hasBadge(profile.id, c.id);
                return (
                  <article key={c.id} className="bd-case-card">
                    {c.image && <div className="bd-case-image"><Image src={c.image} alt="" fill sizes="280px" />{solved && <span className="bd-case-badge" title="Case solved">🔎</span>}</div>}
                    <div className="bd-case-body">
                      <h3>{c.title}</h3>
                      <p>{c.intro}</p>
                      <div className="bts-story-meta">
                        <span>{c.reference}</span>
                        <span className="bts-difficulty-badge">{c.difficulty}</span>
                        <span>{totalClueCount(c)} clues</span>
                      </div>
                      <div className="arcade-game-meta">
                        <span>✨ up to {c.xpReward} XP</span>
                        {caseBest && <span>🏆 Best: {caseBest.score}</span>}
                      </div>
                      <button type="button" className="button button-primary arcade-play-btn" onClick={() => openCase(c)}>Investigate</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {phase === 'case' && caseDef && stage && (
          <section className="bd-case-shell">
            <div className="bd-case-header">
              <p className="bd-case-kicker">🕵️ Case File</p>
              <h1>{caseDef.title}</h1>
              <p className="bd-case-intro">{caseDef.intro}</p>
            </div>

            {(subphase === 'clues') && (
              <>
                <h2 className="bd-section-heading">🔎 Evidence — Stage {stageIndex + 1} of {caseDef.stages.length}</h2>
                <div className="bd-clue-grid">
                  {stage.clues.map((clue) => {
                    const viewed = viewedClueIds.has(clue.id);
                    const expanded = expandedClueId === clue.id;
                    return (
                      <button key={clue.id} type="button" className={`bd-clue-card ${viewed ? 'viewed' : ''} ${expanded ? 'expanded' : ''}`} onClick={() => toggleClue(clue)}>
                        <span className="bd-clue-icon" aria-hidden="true">{CLUE_ICON[clue.type]}</span>
                        <span className="bd-clue-title">{clue.title}</span>
                        <span className="bd-clue-type">{CLUE_LABEL[clue.type]}</span>
                        {expanded && (
                          <span className="bd-clue-content">
                            {clue.content}
                            {showAudio && (
                              <span
                                role="button"
                                tabIndex={0}
                                className="bts-audio-btn bd-audio-btn"
                                aria-label={`Listen to clue: ${clue.title}`}
                                onClick={(e) => { e.stopPropagation(); speak(clue.content); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); speak(clue.content); } }}
                              >🔊</span>
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="button button-primary arcade-start-btn" disabled={!allCluesViewed} onClick={continueFromClues}>
                  {allCluesViewed ? 'Continue the investigation →' : 'Explore every clue above to continue'}
                </button>
              </>
            )}

            {(subphase === 'question' || subphase === 'final') && question && (
              <>
                <h2 className="bd-section-heading">{subphase === 'final' ? '🗂️ Final Verdict' : `❓ What does the evidence say?`}</h2>
                <p className="lq-prompt bd-question-prompt">{question.prompt}</p>
                <div className="lq-choices bd-choices">
                  {question.options.map((opt, index) => {
                    let choiceClass = '';
                    if (feedback && selectedOption === index) choiceClass = feedback === 'correct' ? 'correct' : 'incorrect';
                    return (
                      <button key={index} type="button" className={`lq-choice ${choiceClass}`} disabled={resolving} onClick={() => answerQuestion(index)}>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {feedback === 'incorrect' && (
                  <div className="lq-feedback incorrect" role="status">
                    <strong>Not quite — review the evidence and try again.</strong>
                  </div>
                )}

                <div className="bd-hint-row">
                  {!hintVisible ? (
                    <button type="button" className="button button-secondary bd-hint-btn" onClick={requestHint}>💡 Get a hint</button>
                  ) : (
                    <div className="lq-feedback bd-hint-banner" role="status">
                      <strong>Hint</strong>
                      <p>{question.hint}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {phase === 'result' && result && caseDef && (
          <CaseResultScreen
            outcome={result.outcome}
            caseDef={caseDef}
            best={best}
            badgeEarned={result.badgeEarned}
            onPlayAgain={() => openCase(caseDef)}
            onChooseAnother={() => setPhase('browse')}
          />
        )}
      </div>
    </main>
  );
}

function CaseResultScreen({
  outcome,
  caseDef,
  best,
  badgeEarned,
  onPlayAgain,
  onChooseAnother,
}: {
  outcome: GameOutcome;
  caseDef: CaseDefinition;
  best: ReturnType<typeof getPersonalBest>;
  badgeEarned: boolean;
  onPlayAgain: () => void;
  onChooseAnother: () => void;
}) {
  const dialogRef = useDialogA11y<HTMLElement>(true, onChooseAnother);
  const { session, isNewBest } = outcome;

  return (
    <div className="help-overlay" role="presentation">
      <section ref={dialogRef} className="help-dialog arcade-result-dialog bts-result-dialog" role="dialog" aria-modal="true" aria-labelledby="bd-result-title">
        <p className="child-kicker">{badgeEarned ? '🔎 New detective badge!' : isNewBest ? '🏆 New personal best!' : 'Case closed'}</p>
        <h2 id="bd-result-title">Case Solved!</h2>

        <div className="arcade-result-stats memory-result-stats">
          <div><strong>{session.score}</strong><small>⭐ Score</small></div>
          <div><strong>{Math.round(session.accuracy)}%</strong><small>🎯 Accuracy</small></div>
          <div><strong>{session.timeSeconds}s</strong><small>⏱ Time</small></div>
          <div><strong>{session.hintsUsed ?? 0}</strong><small>💡 Hints</small></div>
        </div>

        <div className="bts-learning-card">
          <p className="bts-order-heading">What happened:</p>
          <p className="bts-summary">{caseDef.explanation}</p>
          <small>{caseDef.reference}</small>
        </div>

        {badgeEarned && <p className="bd-badge-earned">🔎 DETECTIVE BADGE earned for “{caseDef.title}”!</p>}

        <p className="arcade-result-xp">⭐ +{session.xpEarned} XP{session.coinsEarned > 0 ? ` · 🪙 +${session.coinsEarned} coins` : ''}</p>
        {best && <p className="memory-result-best">🏆 Best score: {Math.max(best.score, session.score)}</p>}

        <div className="arcade-result-actions">
          <button type="button" className="button button-primary" onClick={onPlayAgain}>Play again</button>
          <button type="button" className="button button-secondary" onClick={onChooseAnother}>Choose another case</button>
          <Link className="button button-secondary" href="/arcade">Back to Arcade</Link>
        </div>
      </section>
    </div>
  );
}
