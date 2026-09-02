'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CharacterAvatar } from '../character/components';
import { readActiveProfile, readAppearance, readEquipment } from '../character/storage';
import type { CharacterAppearance, CharacterEquipment } from '../character/types';
import { useDialogA11y } from '../lib/use-dialog';
import { DIFFICULTY_LABEL } from './catalog';
import { DIFFICULTY_ORDER } from './types';
import type { DifficultyLevel, GameDefinition, PersonalBest } from './types';

export function DifficultyPicker({ value, onChange, allowedLevels }: { value: DifficultyLevel; onChange: (level: DifficultyLevel) => void; allowedLevels?: DifficultyLevel[] }) {
  const levels = allowedLevels ?? DIFFICULTY_ORDER;
  return (
    <div className="arcade-difficulty-picker" role="group" aria-label="Difficulty">
      {levels.map((level) => (
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
  onBack,
}: {
  title?: string;
  score: number;
  accuracy: number;
  best: PersonalBest | null;
  isNewBest: boolean;
  xpEarned: number;
  coinsEarned: number;
  onPlayAgain: () => void;
  /** Either backHref (standalone page: navigates away) or onBack (embedded/modal: closes in place) — pass whichever fits how this game is being rendered. */
  backHref?: string;
  onBack?: () => void;
}) {
  const dialogRef = useDialogA11y<HTMLElement>(true, onPlayAgain);
  const [appearance] = useState<CharacterAppearance>(() => {
    try {
      const active = readActiveProfile();
      if (active?.id) {
        const app = readAppearance(active.id);
        return { ...app, face: 'celebrating' };
      }
    } catch {
      // Fallback
    }
    return { skinTone: 'honey', hairStyle: 'curls', face: 'celebrating' };
  });

  const [equipment] = useState<CharacterEquipment>(() => {
    try {
      const active = readActiveProfile();
      if (active?.id) {
        const eq = readEquipment(active.id);
        return { ...eq, emote: 'emote-celebrate' };
      }
    } catch {
      // Fallback
    }
    return { emote: 'emote-celebrate' };
  });

  return (
    <div className="help-overlay" role="presentation">
      <section ref={dialogRef} className="help-dialog arcade-result-dialog" role="dialog" aria-modal="true" aria-labelledby="arcade-result-title">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ width: 110, height: 110, margin: '0 auto 0.5rem' }}>
            <CharacterAvatar appearance={appearance} equipment={equipment} size="medium" showPedestal={false} />
          </div>
          <p className="child-kicker" style={{ margin: 0 }}>{isNewBest ? '🏆 New personal best!' : '🎉 Great work, Adventurer!'}</p>
        </div>
        <h2 id="arcade-result-title">{title}</h2>
        <div className="arcade-result-stats">
          <div><strong>{score}</strong><small>Score</small></div>
          <div><strong>{Math.round(accuracy)}%</strong><small>Accuracy</small></div>
          <div><strong>{best ? best.score : score}</strong><small>Best score</small></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.95rem' }}>✨ +{xpEarned} XP</span>
          {coinsEarned > 0 && (
            <span style={{ background: '#ecfdf5', color: '#065f46', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.95rem' }}>🪙 +{coinsEarned} Coins</span>
          )}
        </div>
        <div className="arcade-result-actions">
          <button type="button" className="button button-primary" onClick={onPlayAgain}>Play again</button>
          {onBack ? (
            <button type="button" className="button button-danger" onClick={onBack}>Back to Arcade</button>
          ) : (
            <Link className="button button-danger" href={backHref || '/arcade'}>Back to Arcade</Link>
          )}
        </div>
      </section>
    </div>
  );
}
