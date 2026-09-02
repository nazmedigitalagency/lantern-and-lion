'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CharacterAvatar } from '../character/components';
import { readActiveProfile, readAppearance, readEquipment } from '../character/storage';
import type { CharacterAppearance, CharacterEquipment } from '../character/types';
import { getCurrentSeason, getDaysRemaining, getSeasonReward, getTierProgress, LEAGUE_TIERS } from '../lib/leagues/config';
import { claimSeasonReward, generateCertificate, getLeaguePod, getSeasonHistory } from '../lib/leagues/storage';
import type { LeaguePod, SeasonCertificate, SeasonResult } from '../lib/leagues/types';
import { CertificateModal } from '../lib/leagues/CertificateModal';
import TeenSidebar from '../teen-dashboard/TeenSidebar';

type Tab = 'leaderboard' | 'rewards' | 'history';

// Teen ("Lion's Den") vs. child color tokens for this page's inline styles,
// mirroring the navy hex values LeagueCard.tsx already uses for isTeen.
const CHILD_COLORS = {
  bg: '#FEF9F3', text: '#1E293B', textMuted: '#64748B', accent: '#1D4ED8',
  headerBg: 'rgba(255, 255, 255, 0.92)', headerBorder: '#1E293B',
  cardBg: '#ffffff', cardBorder: '#1E293B', surfaceAlt: '#EFF6FF', surfaceAltBorder: '#1E293B',
  rowBg: '#ffffff', rowBorder: '#e2e8f1', rowActiveBg: '#EFF6FF', rowActiveBorder: '#1D4ED8',
  trackBg: '#eef3f7', promoted: '#15803D',
  ctaBg: undefined as string | undefined, ctaText: undefined as string | undefined, ctaShadow: undefined as string | undefined,
};
const TEEN_COLORS = {
  bg: 'var(--teen-bg)', text: 'var(--teen-text)', textMuted: 'var(--teen-text-muted)', accent: 'var(--teen-accent-light)',
  headerBg: 'var(--teen-surface)', headerBorder: 'var(--teen-border)',
  cardBg: 'var(--teen-surface)', cardBorder: 'var(--teen-border)', surfaceAlt: 'var(--teen-surface-alt)', surfaceAltBorder: 'var(--teen-border)',
  rowBg: 'var(--teen-surface)', rowBorder: 'var(--teen-border)', rowActiveBg: 'var(--teen-surface-alt)', rowActiveBorder: 'var(--teen-accent)',
  trackBg: 'var(--teen-surface-alt)', promoted: 'var(--teen-success-text)',
  ctaBg: 'var(--teen-cta-bg)', ctaText: 'var(--teen-cta-text)', ctaShadow: 'none',
};

export function LeagueWorld({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<{ id: number; name: string; kind: 'child' | 'teen'; age?: number } | null>(null);
  const [appearance, setAppearance] = useState<CharacterAppearance>({ skinTone: 'honey', hairStyle: 'curls', face: 'smile' });
  const [equipment, setEquipment] = useState<CharacterEquipment>({});
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [pod, setPod] = useState<LeaguePod | null>(null);
  const [history, setHistory] = useState<SeasonResult[]>([]);
  const [activeCert, setActiveCert] = useState<SeasonCertificate | null>(null);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const season = useMemo(() => getCurrentSeason(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const active = readActiveProfile();
        if (!active) {
          if (!embedded) router.replace('/child-access');
          return;
        }
        setProfile(active);
        const app = readAppearance(active.id);
        const eq = readEquipment(active.id);
        setAppearance(app);
        setEquipment(eq);

        const loadedPod = getLeaguePod(
          active.id,
          active.name,
          active.kind === 'teen' ? 14 : 9,
          'lion',
          { skinTone: app.skinTone, hairStyle: app.hairStyle, clothing: eq.clothing }
        );
        setPod(loadedPod);
        setHistory(getSeasonHistory(active.id));
      } catch {
        // Fallback
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router, embedded]);

  if (!hydrated || !pod || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span />
        <p>Entering the League Arena…</p>
      </main>
    );
  }

  const currentUserParticipant = pod.participants.find((p) => p.isCurrentUser) || pod.participants[0];
  const userSeasonXp = currentUserParticipant.seasonXp;
  const progress = getTierProgress(userSeasonXp);
  const diffDays = getDaysRemaining(season.endDate);

  const isTeen = profile.kind === 'teen';
  const dashboardHref = isTeen ? '/teen-dashboard' : '/child-dashboard';
  const c = isTeen ? TEEN_COLORS : CHILD_COLORS;
  const ctaStyle = isTeen ? { background: c.ctaBg, color: c.ctaText, boxShadow: c.ctaShadow } : {};

  function handleClaimReward(seasonResult: SeasonResult) {
    if (!profile) return;
    const res = claimSeasonReward(profile.id, seasonResult.seasonId);
    if (res.success) {
      setRewardNotice(`🎉 Claimed rewards: +${seasonResult.rewards.coins} Coins & +${seasonResult.rewards.gems} Gems!`);
      setHistory(getSeasonHistory(profile.id));
      window.setTimeout(() => setRewardNotice(null), 4000);
    }
  }

  function handleViewCertificate(seasonResult: SeasonResult) {
    if (!profile) return;
    const cert = generateCertificate(seasonResult, profile.name);
    setActiveCert(cert);
  }

  const body = (
    <>
      <div style={{ maxWidth: embedded ? 'none' : '1300px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem', boxSizing: 'border-box' }}>
        {onClose && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
            <button
              type="button"
              className="button button-danger"
              onClick={onClose}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
            >
              ✕ Close
            </button>
          </div>
        )}
        {/* Season Hero Banner */}
        <section
          className="league-hero-card"
          style={{
            background: c.cardBg,
            border: `2px solid ${c.cardBorder}`,
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: `6px 6px 0 ${progress.currentTier.badgeTone}`,
          }}
        >
          <div style={{ fontSize: '3.5rem', textAlign: 'center' }} aria-hidden="true">
            {progress.currentTier.emoji}
          </div>

          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
                {season.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: c.textMuted }}>
                ⏱️ Season ends in {diffDays} {diffDays === 1 ? 'day' : 'days'}
              </span>
            </div>

            <h1 style={{ margin: '0 0 0.4rem 0', fontSize: '1.8rem', fontWeight: 900, color: c.text }}>
              {progress.currentTier.name}
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: c.textMuted, lineHeight: 1.4 }}>
              {progress.currentTier.description}
            </p>

            {/* Tier progress */}
            {progress.nextTier && (
              <div style={{ marginTop: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem', color: c.textMuted }}>
                  <span>Next: <strong>{progress.nextTier.name}</strong></span>
                  <span>{userSeasonXp.toLocaleString()} / {progress.nextTier.minXp.toLocaleString()} XP</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: c.trackBg, border: `1.5px solid ${c.cardBorder}`, borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progress.progressPercent}%`,
                      height: '100%',
                      background: progress.nextTier.badgeTone,
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ background: c.surfaceAlt, padding: '0.75rem 1rem', borderRadius: '12px', border: `1.5px solid ${c.surfaceAltBorder}` }}>
              <small style={{ color: c.textMuted, fontSize: '0.72rem', display: 'block' }}>Your Rank</small>
              <strong style={{ fontSize: '1.5rem', color: c.accent }}>#{currentUserParticipant.rank}</strong>
              <small style={{ color: c.textMuted, fontSize: '0.7rem', display: 'block' }}>of {pod.participants.length} in pod</small>
            </div>
          </div>
        </section>

        {rewardNotice && (
          <div
            style={{
              background: '#EFFDF4',
              color: '#15803D',
              border: '1.5px solid #15803D',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              marginBottom: '1rem',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {rewardNotice}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="league-tab-bar" style={{ borderBottom: `1px solid ${c.rowBorder}`, marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`button ${tab === 'leaderboard' ? 'button-primary' : 'button-secondary'}`}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', ...(tab === 'leaderboard' ? ctaStyle : {}) }}
            onClick={() => setTab('leaderboard')}
          >
            🏆 Pod Leaderboard
          </button>
          <button
            type="button"
            className={`button ${tab === 'rewards' ? 'button-primary' : 'button-secondary'}`}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', ...(tab === 'rewards' ? ctaStyle : {}) }}
            onClick={() => setTab('rewards')}
          >
            🎁 Season Rewards
          </button>
          <button
            type="button"
            className={`button ${tab === 'history' ? 'button-primary' : 'button-secondary'}`}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', ...(tab === 'history' ? ctaStyle : {}) }}
            onClick={() => setTab('history')}
          >
            📜 Season History {history.length > 0 ? `(${history.length})` : ''}
          </button>
        </div>

        {/* TAB 1: POD LEADERBOARD */}
        {tab === 'leaderboard' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: c.textMuted }}>
                  Pod: <strong>{pod.tier.toUpperCase()} · {pod.ageGroup === 'teen' ? 'Teens (13–17)' : 'Children (5–12)'}</strong>
                </p>
                <small style={{ color: c.textMuted }}>Top {pod.promotionCutoffRank} learners advance to the next league at season end.</small>
              </div>
              <Link href="/arcade" className="button button-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', ...ctaStyle }}>
                🎮 Earn XP in Arcade →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pod.participants.map((p) => {
                const isPromoted = p.rank <= pod.promotionCutoffRank;
                const isDividerAfter = p.rank === pod.promotionCutoffRank;

                return (
                  <React.Fragment key={String(p.id)}>
                    <article
                      className="league-leaderboard-row"
                      style={{
                        background: p.isCurrentUser
                          ? c.rowActiveBg
                          : c.rowBg,
                        border: p.isCurrentUser
                          ? `1.5px solid ${c.rowActiveBorder}`
                          : `1px solid ${c.rowBorder}`,
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      {/* Rank Number */}
                      <div style={{ textAlign: 'center' }}>
                        {p.rank === 1 ? (
                          <span style={{ fontSize: '1.3rem' }}>🥇</span>
                        ) : p.rank === 2 ? (
                          <span style={{ fontSize: '1.3rem' }}>🥈</span>
                        ) : p.rank === 3 ? (
                          <span style={{ fontSize: '1.3rem' }}>🥉</span>
                        ) : (
                          <strong style={{ fontSize: '1rem', color: isPromoted ? c.promoted : c.textMuted }}>
                            #{p.rank}
                          </strong>
                        )}
                      </div>

                      {/* Avatar preview */}
                      <div style={{ width: 44, height: 44, flexShrink: 0 }}>
                        <CharacterAvatar
                          appearance={
                            p.isCurrentUser
                              ? appearance
                              : { skinTone: p.skinTone || 'honey', hairStyle: p.hairStyle || 'curls', face: 'smile' }
                          }
                          equipment={p.isCurrentUser ? equipment : {}}
                          size="small"
                          showPedestal={false}
                        />
                      </div>

                      {/* Participant Info */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: p.isCurrentUser ? c.accent : c.text }}>
                            {p.displayName} {p.isCurrentUser ? '(You)' : ''}
                          </strong>
                          {p.streakDays > 1 && (
                            <span style={{ fontSize: '0.75rem', background: '#FFFBEB', color: '#D97706', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                              🔥 {p.streakDays}d
                            </span>
                          )}
                        </div>
                        <small style={{ color: c.textMuted, fontSize: '0.75rem' }}>
                          {isPromoted ? '🚀 Promotion Zone' : '🛡️ Safe Zone'}
                        </small>
                      </div>

                      {/* Season XP */}
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '1.05rem', color: isTeen ? 'var(--teen-gold-dark)' : '#D97706', display: 'block' }}>
                          ⭐ {p.seasonXp.toLocaleString()}
                        </strong>
                        <small style={{ color: c.textMuted, fontSize: '0.72rem' }}>Season XP</small>
                      </div>
                    </article>

                    {/* Promotion Zone Divider */}
                    {isDividerAfter && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          margin: '0.5rem 0',
                          padding: '0.25rem 0.5rem',
                        }}
                      >
                        <div style={{ flex: 1, height: '1px', background: c.promoted }} />
                        <span style={{ fontSize: '0.72rem', color: c.promoted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ↑ Promotion Cutoff (Top {pod.promotionCutoffRank})
                        </span>
                        <div style={{ flex: 1, height: '1px', background: c.promoted }} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 2: SEASON REWARDS */}
        {tab === 'rewards' && (
          <section>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: c.text }}>
                Rewards for {progress.currentTier.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: c.textMuted, margin: 0 }}>
                Finishing the season in your pod awards generous Lantern Coins, Gems, Titles, and Badges.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {/* 1st Place */}
              {(() => {
                const r = getSeasonReward(pod.tier, 1);
                return (
                  <article style={{ background: c.cardBg, border: '2px solid #D97706', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '2.5rem' }}>🥇</span>
                    <h3 style={{ margin: '0.5rem 0 0.25rem 0', color: isTeen ? 'var(--teen-gold-dark)' : '#92400e', fontSize: '1.15rem' }}>1st Place Champion</h3>
                    <p style={{ fontSize: '0.8rem', color: c.textMuted, margin: '0 0 1rem 0' }}>Title: <strong>{r.title}</strong></p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                      <span style={{ background: '#ecfdf5', color: '#065f46', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>🪙 +{r.coins}</span>
                      <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>💎 +{r.gems}</span>
                    </div>
                  </article>
                );
              })()}

              {/* Podium */}
              {(() => {
                const r = getSeasonReward(pod.tier, 2);
                return (
                  <article style={{ background: c.cardBg, border: '2px solid #94a3b8', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '2.5rem' }}>🥈</span>
                    <h3 style={{ margin: '0.5rem 0 0.25rem 0', color: c.text, fontSize: '1.15rem' }}>2nd &amp; 3rd Place</h3>
                    <p style={{ fontSize: '0.8rem', color: c.textMuted, margin: '0 0 1rem 0' }}>Title: <strong>{r.title}</strong></p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                      <span style={{ background: '#ecfdf5', color: '#065f46', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>🪙 +{r.coins}</span>
                      <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>💎 +{r.gems}</span>
                    </div>
                  </article>
                );
              })()}

              {/* Finishers */}
              {(() => {
                const r = getSeasonReward(pod.tier, 10);
                return (
                  <article style={{ background: c.cardBg, border: `1.5px solid ${c.rowBorder}`, borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '2.5rem' }}>🌟</span>
                    <h3 style={{ margin: '0.5rem 0 0.25rem 0', color: c.text, fontSize: '1.15rem' }}>Season Participant</h3>
                    <p style={{ fontSize: '0.8rem', color: c.textMuted, margin: '0 0 1rem 0' }}>Title: <strong>{r.title}</strong></p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                      <span style={{ background: '#ecfdf5', color: '#065f46', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>🪙 +{r.coins}</span>
                      <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>💎 +{r.gems}</span>
                    </div>
                  </article>
                );
              })()}
            </div>
          </section>
        )}

        {/* TAB 3: SEASON HISTORY */}
        {tab === 'history' && (
          <section>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: c.text }}>
                Your Season Journey
              </h2>
              <p style={{ fontSize: '0.85rem', color: c.textMuted, margin: 0 }}>
                Every season completed earns permanent recognition, rewards, and verifiable certificates.
              </p>
            </div>

            {history.length === 0 ? (
              <div
                style={{
                  background: c.surfaceAlt,
                  border: `1.5px dashed ${c.rowBorder}`,
                  borderRadius: '12px',
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: c.textMuted,
                }}
              >
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🌱</span>
                <strong style={{ display: 'block', color: c.text, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                  You are competing in your first season!
                </strong>
                <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                  Keep learning and earning XP. When <strong>{season.name}</strong> concludes, your final rank, rewards, and certificate will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.map((h) => {
                  const tier = LEAGUE_TIERS[h.finalTier] || LEAGUE_TIERS.bronze;
                  return (
                    <article
                      key={h.seasonId}
                      style={{
                        background: c.cardBg,
                        border: `1.5px solid ${tier.badgeTone}`,
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '2rem' }}>{tier.emoji}</span>
                        <div>
                          <strong style={{ fontSize: '1rem', display: 'block', color: c.text }}>{h.seasonName}</strong>
                          <small style={{ color: c.textMuted, fontSize: '0.75rem' }}>
                            Finished #{h.finalRank} in {tier.name} · ⭐ {h.totalSeasonXp.toLocaleString()} XP
                          </small>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {!h.rewardClaimed ? (
                          <button
                            type="button"
                            className="button button-primary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', ...ctaStyle }}
                            onClick={() => handleClaimReward(h)}
                          >
                            🎁 Claim Rewards
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: c.promoted, fontWeight: 600 }}>
                            ✓ Rewards Claimed
                          </span>
                        )}

                        <button
                          type="button"
                          className="button button-secondary"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                          onClick={() => handleViewCertificate(h)}
                        >
                          📜 Certificate
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Certificate Modal */}
      {activeCert && (
        <CertificateModal certificate={activeCert} onClose={() => setActiveCert(null)} />
      )}
    </>
  );

  if (embedded) return body;

  const header = (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderBottom: `2px solid ${c.headerBorder}`,
        background: c.headerBg,
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isTeen && (
          <button
            type="button"
            className="teen-menu-trigger"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        )}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: c.text }}>
          <Image src="/lantern-lion-logo.png" alt="" width={42} height={42} priority />
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 800 }}>Lantern &amp; Lion</strong>
            <small style={{ color: c.textMuted, fontSize: '0.75rem' }}>League Arena</small>
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href={dashboardHref} className="button button-danger" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </header>
  );

  if (!isTeen) {
    return (
      <main className="league-page" style={{ minHeight: '100vh', background: c.bg, color: c.text, paddingBottom: '4rem' }}>
        {header}
        {body}
      </main>
    );
  }

  return (
    <main className="league-page teen-dashboard" style={{ paddingBottom: 0 }}>
      {header}
      <div className="teen-body-container">
        <TeenSidebar
          activeItem="leagues"
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />
        <div className="teen-main-canvas">{body}</div>
      </div>
    </main>
  );
}

export default function LeaguePageClient() {
  return <LeagueWorld />;
}
