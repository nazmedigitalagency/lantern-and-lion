'use client';

import Link from 'next/link';

export type ConceptRef = { conceptId: string; label: string; masteryScore?: number };

export type LearningPlanResponse = {
  summary: {
    counts: Record<string, number>;
    strengths: ConceptRef[];
    needsPractice: ConceptRef[];
    dueReviews: { conceptId: string; label: string }[];
  };
  recommended: {
    type: 'review' | 'reinforce' | 'new' | 'explore';
    conceptId: string | null;
    label: string;
    reason: string;
  };
};

const TYPE_KICKER: Record<LearningPlanResponse['recommended']['type'], string> = {
  review: '🧠 Quick review',
  reinforce: '💪 Needs a little practice',
  new: '📖 New story to discover',
  explore: '🎮 Free play',
};

export function LearningJourneyCard({ plan, isTeen = false }: { plan: LearningPlanResponse; isTeen?: boolean }) {
  const { summary, recommended } = plan;
  const tone = isTeen ? 'teen' : 'child';
  const heading = isTeen ? 'Personalized learning' : 'Your Learning Journey';

  return (
    <section className={`learning-journey-card learning-journey-${tone}`} aria-label="Your personalized learning plan">
      <h2>🧠 {heading}</h2>

      <div className="learning-journey-recommend">
        <span className="learning-journey-kicker">{TYPE_KICKER[recommended.type]}</span>
        <strong>{recommended.label}</strong>
        <p>{recommended.reason}</p>
        {recommended.conceptId && (
          <Link className="button button-primary" href={`/curriculum/${recommended.conceptId}`}>
            {recommended.type === 'review' ? 'Start review' : recommended.type === 'reinforce' ? 'Practice now' : 'Start learning'} →
          </Link>
        )}
      </div>

      {(summary.strengths.length > 0 || summary.needsPractice.length > 0) && (
        <div className="learning-journey-lists">
          {summary.strengths.length > 0 && (
            <div>
              <span>Strong areas</span>
              <ul>{summary.strengths.map((c) => <li key={c.conceptId}>✓ {c.label}</li>)}</ul>
            </div>
          )}
          {summary.needsPractice.length > 0 && (
            <div>
              <span>Needs more practice</span>
              <ul>{summary.needsPractice.map((c) => <li key={c.conceptId}>→ {c.label}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {summary.dueReviews.length > 1 && (
        <p className="learning-journey-review-count">🧠 {summary.dueReviews.length} concepts ready for review.</p>
      )}
    </section>
  );
}
