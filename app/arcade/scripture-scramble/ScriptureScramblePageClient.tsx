'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasActiveSession, readActiveProfile, type PlayerProfile } from '../../adventure/storage';
import StudioAudioPlayer from '../../components/StudioAudioPlayer';
import { pickRandomUnique, shuffle } from '../../lib/shuffle';
import { DifficultyPicker, GameResultModal } from '../components';
import { DIFFICULTY_LABEL, SCRAMBLE_ROUNDS_PER_SESSION, SCRAMBLE_WORD_POOLS, defaultDifficultyForAge } from '../catalog';
import { getPersonalBest, recordGameSession } from '../storage';
import type { DifficultyLevel, GameOutcome } from '../types';

function shuffleLetters(word: string): { l: string; i: number }[] {
  const arr = shuffle(word.split('').map((l, i) => ({ l, i })));
  // Guarantee the scramble isn't accidentally already in order for short words.
  if (arr.every((entry, idx) => entry.i === idx) && arr.length > 1) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

function pickWords(difficulty: DifficultyLevel, count: number): string[] {
  return pickRandomUnique(SCRAMBLE_WORD_POOLS[difficulty], count);
}

export default function ScriptureScramblePage() {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [words, setWords] = useState<string[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [bank, setBank] = useState<{ l: string; i: number }[]>([]);
  const [chosen, setChosen] = useState<{ l: string; i: number }[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [roundMistakes, setRoundMistakes] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [roundTimeLeft, setRoundTimeLeft] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);
  const [resolving, setResolving] = useState(false);

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

  const currentWord = words[roundIndex];
  const timedRound = difficulty === 'hard' || difficulty === 'expert';
  const showAssist = difficulty === 'easy' || difficulty === 'medium';

  function startGame() {
    const gameWords = pickWords(difficulty, SCRAMBLE_ROUNDS_PER_SESSION);
    setWords(gameWords);
    setRoundIndex(0);
    setRoundScores([]);
    setTotalMistakes(0);
    setStartedAt(Date.now());
    beginRound(gameWords[0]);
    setPhase('playing');
  }

  function beginRound(word: string) {
    setBank(shuffleLetters(word));
    setChosen([]);
    setRevealedCount(0);
    setRoundMistakes(0);
    setRoundTimeLeft(timedRound ? 20 : null);
    setResolving(false);
  }

  useEffect(() => {
    if (phase !== 'playing' || roundTimeLeft === null) return;
    if (roundTimeLeft <= 0) {
      finishRound(0);
      return;
    }
    const t = window.setTimeout(() => setRoundTimeLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundTimeLeft, phase]);

  function pick(item: { l: string; i: number }) {
    if (!currentWord || resolving) return;
    if (item.i === chosen.length) {
      const nextChosen = [...chosen, item];
      setChosen(nextChosen);
      setBank((prev) => prev.filter((b) => b.i !== item.i));
      if (nextChosen.length === currentWord.length) {
        const roundScore = Math.max(20, 100 - roundMistakes * 15 - revealedCount * 20);
        finishRound(roundScore);
      }
    } else {
      setRoundMistakes((m) => m + 1);
      setTotalMistakes((m) => m + 1);
      setWrongFlash(true);
      window.setTimeout(() => setWrongFlash(false), 350);
    }
  }

  function revealHint() {
    if (!currentWord) return;
    const nextIndex = chosen.length;
    const item = bank.find((b) => b.i === nextIndex);
    if (!item) return;
    setRevealedCount((c) => c + 1);
    pick(item);
  }

  function finishRound(score: number) {
    if (resolving) return;
    setResolving(true);
    window.setTimeout(() => {
      const next = [...roundScores, score];
      setRoundScores(next);
      if (roundIndex + 1 >= words.length) {
        finishGame(next);
      } else {
        setRoundIndex(roundIndex + 1);
        beginRound(words[roundIndex + 1]);
      }
    }, score === 0 ? 900 : 500);
  }

  function finishGame(finalRoundScores: number[]) {
    if (!profile) return;
    const timeSeconds = Math.round((Date.now() - startedAt) / 1000);
    const totalScore = finalRoundScores.reduce((a, b) => a + b, 0);
    const accuracy = Math.round(finalRoundScores.reduce((a, b) => a + b, 0) / (finalRoundScores.length * 100) * 100);
    const result = recordGameSession(profile.id, {
      gameId: 'scripture-scramble',
      score: totalScore,
      accuracy,
      timeSeconds,
      difficulty,
      mistakes: totalMistakes,
      completed: true,
    });
    setOutcome(result);
    setPhase('result');
  }

  const best = profile ? getPersonalBest(profile.id, 'scripture-scramble') : null;

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Loading Scripture Scramble…</p>
      </main>
    );
  }

  return (
    <main className="adventure-page arcade-page">
      <header className="child-topbar adv-topbar">
        <Link href="/arcade" className="child-logo">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span>
            <strong>Scripture Scramble</strong>
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
            <span className="arcade-setup-icon" aria-hidden="true">🔤</span>
            <h1>Scripture Scramble</h1>
            <p>Unscramble {SCRAMBLE_ROUNDS_PER_SESSION} Bible words. {best && `Your best score: ${best.score}.`}</p>
            <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            <p className="arcade-setup-note">
              {difficulty === 'easy' || difficulty === 'medium' ? 'Hints and audio pronunciation available.' : 'No hints, no audio — timed rounds.'}
            </p>
            <button type="button" className="button button-primary arcade-start-btn" onClick={startGame}>Start game</button>
          </section>
        )}

        {phase === 'playing' && currentWord && (
          <section className="arcade-play-card">
            <div className="arcade-play-meta">
              <span>Round {roundIndex + 1} of {words.length}</span>
              <span>{DIFFICULTY_LABEL[difficulty]}</span>
              {roundTimeLeft !== null && <span className={roundTimeLeft <= 5 ? 'arcade-timer-low' : ''}>⏱ {roundTimeLeft}s</span>}
            </div>

            {showAssist && (
              <StudioAudioPlayer text={currentWord} title="Word pronunciation" compact defaultVoiceId="en-GB-Journey-F" />
            )}

            <p className={`daily-widget-target daily-widget-word arcade-scramble-target ${wrongFlash ? 'shake' : ''}`}>
              {currentWord.split('').map((_, i) => (
                <span key={i} className={i < chosen.length ? 'filled' : 'blank'}>{i < chosen.length ? chosen[i].l : '_'}</span>
              ))}
            </p>

            <div className="daily-widget-bank">
              {bank.map((item) => (
                <button key={item.i} type="button" onClick={() => pick(item)}>{item.l}</button>
              ))}
            </div>

            {showAssist && (
              <button type="button" className="family-text-button" onClick={revealHint}>💡 Reveal next letter</button>
            )}
          </section>
        )}

        {phase === 'result' && outcome && (
          <GameResultModal
            title="Scramble complete!"
            score={outcome.session.score}
            accuracy={outcome.session.accuracy}
            best={getPersonalBest(profile.id, 'scripture-scramble')}
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
