'use client';

import React from 'react';
import Link from 'next/link';
import { getCurrentSeason, getDaysRemaining, getTierProgress } from './config';
import type { LeaderboardParticipant, LeaguePod } from './types';

interface LeagueCardProps {
  pod: LeaguePod;
  currentParticipant?: LeaderboardParticipant;
  isTeen?: boolean;
}

export function LeagueCard({ pod, currentParticipant, isTeen = false }: LeagueCardProps) {
  const season = getCurrentSeason();
  const participant = currentParticipant || pod.participants.find((p) => p.isCurrentUser) || pod.participants[0];
  const seasonXp = participant?.seasonXp || 0;
  const progress = getTierProgress(seasonXp);
  const diffDays = getDaysRemaining(season.endDate);

  // Find competitor right ahead of user
  const userRank = participant?.rank || 1;
  const aheadCompetitor = pod.participants.find((p) => p.rank === userRank - 1);
  const xpDeltaToAhead = aheadCompetitor ? Math.max(10, aheadCompetitor.seasonXp - seasonXp) : 0;

  const isPromotionZone = userRank <= pod.promotionCutoffRank;

  return (
    <section
      className={`ll-league-card ${isTeen ? 'll-league-card-teen' : ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: `1.5px solid ${progress.currentTier.badgeTone}`,
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        margin: '1.25rem 0',
        color: '#ffffff',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '2rem' }} aria-hidden="true">
            {progress.currentTier.emoji}
          </span>
          <div>
            <span
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
                color: progress.currentTier.badgeTone,
              }}
            >
              {season.name}
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              {progress.currentTier.name}
            </h3>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '0.8rem',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              fontWeight: 600,
              color: '#cbd5e1',
            }}
          >
            ⏱️ {diffDays} {diffDays === 1 ? 'day' : 'days'} left
          </span>
        </div>
      </div>

      {/* Main Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '0.75rem',
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '0.85rem',
          borderRadius: '12px',
          margin: '0.75rem 0',
        }}
      >
        <div>
          <small style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>Your Rank</small>
          <strong style={{ fontSize: '1.2rem', color: '#38bdf8' }}>
            #{userRank} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>of {pod.participants.length}</span>
          </strong>
        </div>

        <div>
          <small style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>Season XP</small>
          <strong style={{ fontSize: '1.2rem', color: '#fbbf24' }}>
            ⭐ {seasonXp.toLocaleString()}
          </strong>
        </div>

        <div>
          <small style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>Status</small>
          <strong style={{ fontSize: '0.95rem', color: isPromotionZone ? '#34d399' : '#e2e8f0' }}>
            {isPromotionZone ? '🚀 Promotion Zone' : '🛡️ Safe Zone'}
          </strong>
        </div>
      </div>

      {/* Encouragement & Progress to next rank */}
      <div style={{ margin: '0.75rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
        {aheadCompetitor ? (
          <p style={{ margin: '0 0 0.5rem 0' }}>
            🔥 <strong>+{xpDeltaToAhead} XP</strong> to pass <em>{aheadCompetitor.displayName}</em> for <strong>#{userRank - 1}</strong>!
          </p>
        ) : (
          <p style={{ margin: '0 0 0.5rem 0', color: '#fde047' }}>
            👑 You are currently in <strong>1st place</strong> in your league pod! Keep shining!
          </p>
        )}

        {progress.nextTier && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <span>Progress to {progress.nextTier.name}</span>
              <span>{seasonXp.toLocaleString()} / {progress.nextTier.minXp.toLocaleString()} XP</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress.progressPercent}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${progress.currentTier.badgeTone}, ${progress.nextTier.badgeTone})`,
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
        <Link
          href="/leagues"
          className="button button-primary"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.9rem',
            fontWeight: 700,
          }}
        >
          🏆 View League Standings &amp; Rewards →
        </Link>
      </div>
    </section>
  );
}
