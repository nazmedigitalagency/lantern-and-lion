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

  // Teen ("Lion's Den") gets a clean, white, Cobalt + Violet league identity;
  // the child dashboard gets a flat, bright, high-contrast card with no
  // gradients or blur, matching the rest of the kids-dashboard game system.
  if (isTeen) {
    return (
      <section
        className="ll-league-card ll-league-card-teen"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f1',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          margin: '1.25rem 0',
          color: '#1E293B',
          boxShadow: '0 1px 2px rgba(19,45,70,.05), 0 16px 36px rgba(19,45,70,.06)',
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
                  fontWeight: 800,
                  color: '#6D28D9',
                }}
              >
                {season.name}
              </span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1E293B' }}>
                {progress.currentTier.name}
              </h3>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '0.8rem',
                background: '#f4f8fc',
                border: '1px solid #e2e8f1',
                padding: '0.25rem 0.6rem',
                borderRadius: '10px',
                fontWeight: 700,
                color: '#64748B',
              }}
            >
              ⏱️ {diffDays} {diffDays === 1 ? 'day' : 'days'} left
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '0.75rem',
            background: '#F5F3FF',
            border: '1px solid #7C3AED',
            padding: '0.85rem',
            borderRadius: '12px',
            margin: '0.75rem 0',
          }}
        >
          <div>
            <small style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', fontWeight: 700 }}>Your Rank</small>
            <strong style={{ fontSize: '1.2rem', color: '#3B82F6' }}>
              #{userRank} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>of {pod.participants.length}</span>
            </strong>
          </div>

          <div>
            <small style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', fontWeight: 700 }}>Season XP</small>
            <strong style={{ fontSize: '1.2rem', color: '#D97706' }}>
              ⭐ {seasonXp.toLocaleString()}
            </strong>
          </div>

          <div>
            <small style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', fontWeight: 700 }}>Status</small>
            <strong style={{ fontSize: '0.95rem', color: isPromotionZone ? '#15803D' : '#1E293B' }}>
              {isPromotionZone ? '🚀 Promotion Zone' : '🛡️ Safe Zone'}
            </strong>
          </div>
        </div>

        <div style={{ margin: '0.75rem 0', fontSize: '0.85rem', color: '#334155' }}>
          {aheadCompetitor ? (
            <p style={{ margin: '0 0 0.5rem 0' }}>
              🔥 <strong>+{xpDeltaToAhead} XP</strong> to pass <em>{aheadCompetitor.displayName}</em> for <strong>#{userRank - 1}</strong>!
            </p>
          ) : (
            <p style={{ margin: '0 0 0.5rem 0', color: '#D97706', fontWeight: 700 }}>
              👑 You are currently in <strong>1st place</strong> in your league pod! Keep shining!
            </p>
          )}

          {progress.nextTier && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700, color: '#1E293B' }}>
                <span>Progress to {progress.nextTier.name}</span>
                <span>{seasonXp.toLocaleString()} / {progress.nextTier.minXp.toLocaleString()} XP</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: '#e2e8f1',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress.progressPercent}%`,
                    height: '100%',
                    background: '#3B82F6',
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
            style={{ flex: 1, textAlign: 'center', padding: '0.65rem 1rem', fontSize: '0.9rem', fontWeight: 700 }}
          >
            🏆 View League Standings &amp; Rewards →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="ll-league-card"
      style={{
        background: '#ffffff',
        border: '2.5px solid #1E293B',
        borderRadius: '18px',
        padding: '1.25rem 1.5rem',
        margin: '1.25rem 0',
        color: '#1E293B',
        boxShadow: '5px 5px 0 #8b5cf6',
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
                fontWeight: 800,
                color: '#6D28D9',
              }}
            >
              {season.name}
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1E293B' }}>
              {progress.currentTier.name}
            </h3>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.8rem',
            background: '#EFF6FF',
            border: '1.5px solid #1E293B',
            padding: '0.25rem 0.6rem',
            borderRadius: '9999px',
            fontWeight: 700,
            color: '#1E293B',
          }}
        >
          ⏱️ {diffDays} {diffDays === 1 ? 'day' : 'days'} left
        </span>
      </div>

      {/* Main Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '0.75rem',
          background: '#F5F3FF',
          border: '1.5px solid #8b5cf6',
          padding: '0.85rem',
          borderRadius: '12px',
          margin: '0.75rem 0',
        }}
      >
        <div>
          <small style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', fontWeight: 700 }}>Your Rank</small>
          <strong style={{ fontSize: '1.2rem', color: '#1D4ED8' }}>
            #{userRank} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>of {pod.participants.length}</span>
          </strong>
        </div>

        <div>
          <small style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', fontWeight: 700 }}>Season XP</small>
          <strong style={{ fontSize: '1.2rem', color: '#D97706' }}>
            ⭐ {seasonXp.toLocaleString()}
          </strong>
        </div>

        <div>
          <small style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', fontWeight: 700 }}>Status</small>
          <strong style={{ fontSize: '0.95rem', color: isPromotionZone ? '#15803D' : '#1E293B' }}>
            {isPromotionZone ? '🚀 Promotion Zone' : '🛡️ Safe Zone'}
          </strong>
        </div>
      </div>

      {/* Encouragement & Progress to next rank */}
      <div style={{ margin: '0.75rem 0', fontSize: '0.85rem', color: '#334155' }}>
        {aheadCompetitor ? (
          <p style={{ margin: '0 0 0.5rem 0' }}>
            🔥 <strong>+{xpDeltaToAhead} XP</strong> to pass <em>{aheadCompetitor.displayName}</em> for <strong>#{userRank - 1}</strong>!
          </p>
        ) : (
          <p style={{ margin: '0 0 0.5rem 0', color: '#D97706', fontWeight: 700 }}>
            👑 You are currently in <strong>1st place</strong> in your league pod! Keep shining!
          </p>
        )}

        {progress.nextTier && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700, color: '#1E293B' }}>
              <span>Progress to {progress.nextTier.name}</span>
              <span>{seasonXp.toLocaleString()} / {progress.nextTier.minXp.toLocaleString()} XP</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '10px',
                background: '#eef3f7',
                border: '1.5px solid #1E293B',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress.progressPercent}%`,
                  height: '100%',
                  background: '#FBBF24',
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
