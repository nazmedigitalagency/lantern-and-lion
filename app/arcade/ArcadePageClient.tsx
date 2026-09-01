'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasActiveSession, readActiveProfile, type PlayerProfile } from '../adventure/storage';
import { GameHUD } from '../lib/economy/components';
import { getWallet } from '../lib/economy/wallet-service';
import { getLevelInfo } from '../lib/xp-levels';
import { getTodayDateKey } from '../lib/date';
import { GameCard } from './components';
import { GAME_DEFINITIONS, getGameDefinition } from './catalog';
import { getFeaturedGameId } from './progression';
import { getPersonalBest } from './storage';
import type { GameId } from './types';
import TeenSidebar from '../teen-dashboard/TeenSidebar';

const GAME_ROUTES: Partial<Record<GameId, string>> = {
  'scripture-maze': '/arcade/scripture-maze',
  'scripture-scramble': '/arcade/scripture-scramble',
  'verse-builder': '/arcade/verse-builder',
  'memory-match': '/arcade/memory-match',
  'lightning-quiz': '/arcade/lightning-quiz',
  'build-the-story': '/arcade/build-the-story',
  'bible-detective': '/arcade/bible-detective',
  'scripture-connections': '/arcade/scripture-connections',
};

export default function ArcadePage() {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasActiveSession()) { window.location.href = '/'; return; }
      setProfile(readActiveProfile());
      setHydrated(true);
    }, 0);
    const onVisible = () => document.visibilityState === 'visible' && setRefreshTick((t) => t + 1);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!hydrated || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Opening the Lantern Arcade…</p>
      </main>
    );
  }

  const wallet = getWallet(profile.id);
  const levelInfo = getLevelInfo(wallet.xp);
  const dashboardHref = profile.kind === 'teen' ? '/teen-dashboard' : '/child-dashboard';
  const featuredId = getFeaturedGameId(getTodayDateKey());
  const featuredGame = getGameDefinition(featuredId);
  const featuredBest = getPersonalBest(profile.id, featuredId);
  const isTeen = profile.kind === 'teen';
  void refreshTick;

  const pageContent = (
    <>
      <header className="child-topbar adv-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          <Link href={dashboardHref} className="child-logo">
            <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
            <span>
              <strong>Lantern Arcade</strong>
              <small>Lantern &amp; Lion</small>
            </span>
          </Link>
        </div>
        <div className="adv-topbar-center">
          <GameHUD level={levelInfo.level} wallet={wallet} />
        </div>
        <div className="child-header-actions">
          <Link href={dashboardHref} className="help-button">← Back to dashboard</Link>
        </div>
      </header>

      <div className="adv-body arcade-body">
        <div className="daily-intro">
          <p className="child-kicker">🎮 Lantern Arcade</p>
          <h1>Games that make Scripture stick.</h1>
          <p>Short, replayable games — beat your own best score, not anyone else’s.</p>
        </div>

        {featuredGame && (
          <section className="arcade-featured-card">
            <span className="arcade-featured-badge">🔥 Daily Challenge</span>
            <div className="arcade-featured-body">
              <span className="arcade-featured-icon" aria-hidden="true">{featuredGame.icon}</span>
              <div>
                <strong>{featuredGame.name}</strong>
                <p>{featuredBest ? `Beat your previous score of ${featuredBest.score}.` : 'Play today and set your first score.'}</p>
              </div>
            </div>
            <Link
              className="button button-primary"
              href={GAME_ROUTES[featuredGame.id] || '/arcade'}
              style={isTeen ? { background: 'var(--teen-cta-bg)', color: 'var(--teen-cta-text)', boxShadow: 'none' } : undefined}
            >
              Play now →
            </Link>
          </section>
        )}

        <div className="arcade-grid">
          {GAME_DEFINITIONS.map((game) => (
            <GameCard key={game.id} game={game} best={getPersonalBest(profile.id, game.id)} href={GAME_ROUTES[game.id] || null} />
          ))}
        </div>
      </div>
    </>
  );

  if (!isTeen) {
    return <main className="adventure-page arcade-page">{pageContent}</main>;
  }

  return (
    <main className="adventure-page arcade-page teen">
      <div className="teen-body-container">
        <TeenSidebar
          activeItem="arcade"
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />
        <div className="teen-main-canvas">{pageContent}</div>
      </div>
    </main>
  );
}
