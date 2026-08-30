'use client';

import Link from 'next/link';
import { useDialogA11y } from '../lib/use-dialog';
import { DIFFICULTY_LABEL } from './catalog';
import { DIFFICULTY_ORDER } from './types';
import type { DifficultyLevel, GameDefinition, PersonalBest } from './types';

export function DifficultyPicker({ value, onChange }: { value: DifficultyLevel; onChange: (level: DifficultyLevel) => void }) {
  return (
    <div className="arcade-difficulty-picker" role="group" aria-label="Difficulty">
      {DIFFICULTY_ORDER.map((level) => (
        <button key={level} type="button" className={value === level ? 'active' : ''} aria-pressed={value === level} onClick={() => onChange(level)}>
          {DIFFICULTY_LABEL[level]}
        </button>
      ))}
    </div>
  );
}

export function GameCard({ game, best, href }: { game: GameDefinition; best: PersonalBest | null; href: string | null }) {
  return (
    <article className={`arcade-game-card ${game.implemented ? '' : 'arcade-game-card-soon'}`}>
      <span className="arcade-game-icon" aria-hidden="true">{game.icon}</span>
      <h3>{game.name}</h3>
      <p>{game.description}</p>
      <div className="arcade-game-skills">
        {game.skills.map((skill) => (
          <span key={skill} className="arcade-skill-chip">{skill.replace(/-/g, ' ')}</span>
        ))}
      </div>
      <div className="arcade-game-meta">
        <span>✨ up to {game.baseXp * 2} XP</span>
        {best && <span>🏆 Best: {best.score}</span>}
      </div>
      {game.implemented && href ? (
        <Link className="button button-primary arcade-play-btn" href={href}>Play</Link>
      ) : (
        <span className="arcade-coming-soon">Coming soon</span>
      )}
    </article>
  );
}

export function GameResultModal({
  title = 'Game complete!',
  score,
  accuracy,
  best,
  isNewBest,
  xpEarned,
  coinsEarned,
  onPlayAgain,
  backHref,
}: {
  title?: string;
  score: number;
  accuracy: number;
  best: PersonalBest | null;
  isNewBest: boolean;
  xpEarned: number;
  coinsEarned: number;
  onPlayAgain: () => void;
  backHref: string;
}) {
  const dialogRef = useDialogA11y<HTMLElement>(true, onPlayAgain);
  return (
    <div className="help-overlay" role="presentation">
      <section ref={dialogRef} className="help-dialog arcade-result-dialog" role="dialog" aria-modal="true" aria-labelledby="arcade-result-title">
        <p className="child-kicker">{isNewBest ? '🏆 New personal best!' : 'Nicely done'}</p>
        <h2 id="arcade-result-title">{title}</h2>
        <div className="arcade-result-stats">
          <div><strong>{score}</strong><small>Score</small></div>
          <div><strong>{Math.round(accuracy)}%</strong><small>Accuracy</small></div>
          <div><strong>{best ? best.score : score}</strong><small>Best score</small></div>
        </div>
        <p className="arcade-result-xp">✨ +{xpEarned} XP{coinsEarned > 0 ? ` · 🪙 +${coinsEarned} coins` : ''}</p>
        <div className="arcade-result-actions">
          <button type="button" className="button button-primary" onClick={onPlayAgain}>Play again</button>
          <Link className="button button-secondary" href={backHref}>Back to Arcade</Link>
        </div>
      </section>
    </div>
  );
}
