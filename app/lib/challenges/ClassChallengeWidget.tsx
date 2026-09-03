'use client';

import { useStudentChallenges } from './useStudentChallenges';
import { GOAL_TYPE_UNIT } from './types';

/**
 * "Your class is working toward…" — a compact banner for the Home/Today
 * tab, shown only while a class challenge is genuinely active or was just
 * completed. Renders nothing while loading, on error, or when there's no
 * challenge to show, so a quiet dashboard never flashes an empty card.
 */
export function ClassChallengeWidget({ tone }: { tone: 'child' | 'teen' }) {
  const { challenges, state } = useStudentChallenges();

  if (state === 'loading' || state === 'error' || !challenges || challenges.length === 0) return null;

  // Prefer the furthest-along active challenge; a just-completed one still gets shown for its celebratory window (see aggregate.ts).
  const active = challenges.filter((c) => c.status === 'active').sort((a, b) => b.percentComplete - a.percentComplete)[0];
  const completed = challenges.filter((c) => c.status === 'completed').sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
  const challenge = active || completed;
  if (!challenge) return null;

  const unit = GOAL_TYPE_UNIT[challenge.goalType];

  return (
    <section className={`class-challenge-widget class-challenge-widget-${tone}`} aria-label="Your class challenge">
      <p className="class-challenge-widget-kicker">{tone === 'teen' ? 'CLASS CHALLENGE' : '🎯 Your class challenge'}</p>
      {challenge.status === 'completed' ? (
        <p className="class-challenge-widget-headline">🎉 Class Challenge Complete! “{challenge.name}”</p>
      ) : (
        <p className="class-challenge-widget-headline">Your class is working toward &ldquo;{challenge.name}&rdquo;</p>
      )}

      <div className="class-challenge-widget-progress">
        <i><b style={{ width: `${challenge.percentComplete}%` }} /></i>
        <span>{challenge.progress} / {challenge.goalTarget} {unit} · {challenge.percentComplete}%</span>
      </div>

      <p className="class-challenge-widget-mine">
        {challenge.myContribution > 0
          ? `You've contributed ${challenge.myContribution} ${challenge.goalType === 'xp' ? 'XP' : unit}!`
          : `Join in — every ${challenge.goalType === 'xp' ? 'bit of XP' : unit.replace(/s$/, '')} counts.`}
      </p>

      {challenge.status === 'completed' && challenge.rewardType === 'xp' && challenge.rewardAmount > 0 && challenge.myContribution > 0 && (
        <p className="class-challenge-widget-reward">+{challenge.rewardAmount} bonus XP earned!</p>
      )}
    </section>
  );
}
