'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import ChatAssistant from '../chat-assistant';
import { curriculumModules, type CurriculumModule } from '../curriculum-data';
import { getModuleLessons } from '../curriculum-lessons';
import { computeStreak, getCompletedCount } from '../daily-quests/progression';
import { getOrCreateTodaySet, readHistory } from '../daily-quests/storage';
import { readCharacterName, readAppearance, readEquipment } from '../character/storage';
import type { CharacterAppearance, CharacterEquipment } from '../character/types';
import { CharacterAvatar } from '../character/components';
import { useActivityHeartbeat } from '../lib/activity/idle-tracker';
import { StreakCard } from '../lib/streak/StreakCard';
import { claimStreakMilestoneIfNew } from '../lib/streak/client';
import type { StreakStatus } from '../lib/streak/server';
import { getNextMissionRecommendation } from '../adventure/progression';
import { canonicalRegions } from '../adventure/world-data';
import { loadWorldContext } from '../adventure/storage';
import { getWallet, getCurrentLevel } from '../lib/economy/wallet-service';
import type { Wallet } from '../lib/economy/types';
import type { LevelInfo } from '../lib/xp-levels';
import { GAME_DEFINITIONS } from '../arcade/catalog';
import { VerseBuilderGame } from '../arcade/verse-builder/VerseBuilderPageClient';
import { STORY_CATALOG } from '../stories/catalog';
import { signOutOfPersona } from '../lib/session';

// id is a number for a locally-created demo profile, or a UUID string for
// an account fetched from the real server (see /api/child-auth/login).
type Child = { id: number | string; name: string; username?: string; age: number; avatar: string; pin: string };
type DashboardTab = 'today' | 'adventure' | 'stories' | 'arcade' | 'leagues' | 'explore' | 'progress';
type ModuleFilter = 'All lessons' | 'Not started' | 'In progress' | 'Completed';
type ModuleProgressEntry = { completedIndices: number[]; lastCompletedIndex: number };

const fallbackChildren: Child[] = [
  { id: 1, name: 'Amara', age: 9, avatar: 'lion', pin: '2468' },
  { id: 2, name: 'Tobi', age: 14, avatar: 'lantern', pin: '1357' },
];

function trackForAge(age: number): CurriculumModule['track'] {
  if (age <= 5) return 'early';
  if (age <= 10) return 'pathfinder';
  return 'teen';
}

function readModuleProgressForChild(childId: number | string): Record<string, ModuleProgressEntry> {
  try {
    const progressMap = JSON.parse(localStorage.getItem('lanternLionModuleProgress') || '{}');
    return progressMap?.[childId] || {};
  } catch {
    return {};
  }
}

export default function ChildDashboardPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>(fallbackChildren);
  const [activeId, setActiveId] = useState<number | string>(fallbackChildren[0].id);
  const [activeTab, setActiveTab] = useState<DashboardTab>('today');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [familyData, setFamilyData] = useState({ familyName: 'The Adeyemi Family', parentName: 'Jordan Adeyemi', country: 'Nigeria' });
  const [showHelp, setShowHelp] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [helpNotice, setHelpNotice] = useState('');
  const [filter, setFilter] = useState<ModuleFilter>('All lessons');
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgressEntry>>({});
  const [dailySummary, setDailySummary] = useState({ completed: 0, total: 4, streak: 0 });
  const [charDisplayName, setCharDisplayName] = useState<string>('Amara');
  const [charAppearance, setCharAppearance] = useState<CharacterAppearance>({ skinTone: 'honey', hairStyle: 'curls', face: 'smile' });
  const [charEquipment, setCharEquipment] = useState<CharacterEquipment>({});
  const [wallet, setWallet] = useState<Wallet>({ xp: 0, coins: 0, gems: 0 });
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  const closeHelpRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [isPreview, setIsPreview] = useState(false);
  // Games that have been converted to open as an in-dashboard popup instead
  // of navigating to their own page (see VerseBuilderGame's `embedded` mode)
  // — a pilot for the pattern before rolling it out to the rest of the arcade.
  const [activeGameModal, setActiveGameModal] = useState<string | null>(null);
  const EMBEDDABLE_GAME_IDS = new Set(['verse-builder']);
  type TodaySummaryData = { active_seconds: number; games_played: number; quests_completed: number; xp_earned: number; achievements_earned: number };
  const [learningStreak, setLearningStreak] = useState<StreakStatus | null>(null);

  useActivityHeartbeat(hydrated && !isPreview);

  useEffect(() => {
    if (!hydrated || isPreview) return;
    fetch('/api/child/today')
      .then((res) => (res.ok ? (res.json() as Promise<{ summary: TodaySummaryData; streak: StreakStatus }>) : null))
      .then((data) => {
        if (data?.summary) {
          setDailySummary((prev) => ({
            ...prev,
            completed: Math.max(prev.completed, data.summary.quests_completed),
          }));
        }
        if (data?.streak) {
          setLearningStreak(data.streak);
          setDailySummary((prev) => ({
            ...prev,
            streak: Math.max(prev.streak, data.streak.currentStreak),
          }));
          claimStreakMilestoneIfNew(activeId, data.streak.currentStreak);
        }
      })
      .catch(() => { /* Offline — widget stays hidden. */ });
  }, [hydrated, isPreview, activeId]);

  async function fetchStreakCalendar() {
    try {
      const res = await fetch('/api/child/streak-calendar?days=7');
      if (!res.ok) return [];
      const data = (await res.json()) as { calendar: { date: string; state: 'complete' | 'grace' | 'pending' | 'none' }[] };
      return data.calendar || [];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const previewFlag = new URLSearchParams(window.location.search).get('preview') === '1';
      setIsPreview(previewFlag);
      const savedChildSession = localStorage.getItem('lanternLionActiveChild') || localStorage.getItem('lanternLionActiveChildId');
      const childSessionJson = localStorage.getItem('lanternLionChildSession');
      const storedFamilyRaw = localStorage.getItem('lanternLionDemoFamily') || localStorage.getItem('lanternLionFamilyData');

      if (!previewFlag && !savedChildSession && !childSessionJson && !storedFamilyRaw) {
        router.replace('/child-access');
        return;
      }

      // childSessionJson.childId carries its original type (a number for a
      // locally-created demo profile, a UUID string for a real server
      // account) — parseInt/Number() on savedChildSession would truncate a
      // UUID down to its leading digits and silently match the wrong
      // child, so prefer the JSON session and only fall back to the loose
      // legacy key when it's missing.
      let activeChildId: number | string = fallbackChildren[0].id;
      if (childSessionJson) {
        try {
          const parsed = JSON.parse(childSessionJson);
          if (parsed.childId !== undefined && parsed.childId !== null) activeChildId = parsed.childId;
        } catch { /* Use fallback */ }
      } else if (savedChildSession) {
        const n = Number(savedChildSession);
        activeChildId = Number.isNaN(n) ? savedChildSession : n;
      }

      try {
        const family = JSON.parse(storedFamilyRaw || '{}');
        if (family.children?.length) {
          setChildren(family.children);
          const found = family.children.find((c: Child) => c.id === activeChildId);
          if (found) {
            setActiveId(found.id);
          } else {
            setActiveId(family.children[0].id);
          }
        } else {
          setActiveId(activeChildId);
        }
        if (family.familyName) setFamilyData(family);
      } catch {
        setActiveId(activeChildId);
      }

      const progress = JSON.parse(localStorage.getItem('lanternLionModuleProgress') || '{}');
      setModuleProgress(progress[activeChildId] || {});

      try {
        const history = readHistory(activeId);
        const streakInfo = computeStreak(history);
        const streak = streakInfo.current;
        const questsCtx = {
          moduleProgress: progress[activeId] || {},
          masteredQuestIds: [],
          arcadeHighScores: {},
          kind: 'child' as const,
        };
        const todaySet = getOrCreateTodaySet(activeId, questsCtx);
        const completed = getCompletedCount(todaySet);
        setDailySummary({ completed, total: todaySet.quests.length || 4, streak });
      } catch {
        setDailySummary({ completed: 0, total: 4, streak: 0 });
      }

      setCharDisplayName(readCharacterName(activeId, children.find((c) => c.id === activeId)?.name || 'Amara'));
      setCharAppearance(readAppearance(activeId));
      setCharEquipment(readEquipment(activeId));

      const w = getWallet(activeId);
      setWallet(w);
      setLevelInfo(getCurrentLevel(activeId));

      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router, activeId, children]);

  useEffect(() => {
    if (!showHelp) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeHelpRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setShowHelp(false); return; }
      if (event.key !== 'Tab') return;
      const dialog = closeHelpRef.current?.closest<HTMLElement>('.help-dialog');
      const focusable: HTMLElement[] = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])')) : [];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    const triggerEl = helpTriggerRef.current;
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); triggerEl?.focus(); };
  }, [showHelp]);

  useEffect(() => {
    if (!showProfiles) return;
    const close = (event: Event) => {
      if ((event as KeyboardEvent).key && (event as KeyboardEvent).key !== 'Escape') return;
      if (event.type === 'pointerdown' && (event.target as HTMLElement).closest('.profile-switch')) return;
      setShowProfiles(false); window.setTimeout(() => profileButtonRef.current?.focus(), 0);
    };
    document.addEventListener('keydown', close); document.addEventListener('pointerdown', close);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', close); };
  }, [showProfiles]);

  const child = children.find((item) => item.id === activeId) || children[0];
  const teen = child.age >= 13;
  const childTrack = trackForAge(child.age);
  const trackModules = curriculumModules.filter((m) => m.track === childTrack);

  function lessonCountFor(moduleId: string) {
    const mod = curriculumModules.find((m) => m.id === moduleId);
    return mod ? getModuleLessons(mod).length : 0;
  }
  function doneCountFor(moduleId: string) {
    return moduleProgress[moduleId]?.completedIndices.length || 0;
  }
  function isModuleStarted(moduleId: string) {
    return doneCountFor(moduleId) > 0;
  }
  function isModuleComplete(moduleId: string) {
    const total = lessonCountFor(moduleId);
    return total > 0 && doneCountFor(moduleId) >= total;
  }

  const totalSubLessonsCompleted = trackModules.reduce((sum, m) => sum + doneCountFor(m.id), 0);
  const starsEarned = wallet.xp > 0 ? wallet.xp : totalSubLessonsCompleted * 8;

  const adventureCtx = useMemo(() => loadWorldContext(child.id, teen ? 'teen' : 'child'), [child.id, teen]);
  const nextExpedition = useMemo(() => getNextMissionRecommendation(adventureCtx), [adventureCtx]);

  function statsForChild(c: Child) {
    const track = trackForAge(c.age);
    const modules = curriculumModules.filter((m) => m.track === track);
    const progress = c.id === activeId ? moduleProgress : readModuleProgressForChild(c.id);
    const done = modules.reduce((sum, m) => sum + (progress[m.id]?.completedIndices.length || 0), 0);
    const childW = c.id === activeId ? wallet : getWallet(c.id);
    const points = childW.xp > 0 ? childW.xp : done * 8;
    const childLevel = c.id === activeId ? levelInfo : getCurrentLevel(c.id);
    return {
      track,
      done,
      points,
      coins: childW.coins,
      gems: childW.gems,
      level: childLevel?.level ?? Math.floor(points / 100) + 1,
      levelTitle: childLevel?.title ?? 'New Explorer',
      appearance: readAppearance(c.id),
      equipment: readEquipment(c.id),
    };
  }

  const filteredModules = trackModules.filter((m) => {
    if (filter === 'Not started') return !isModuleStarted(m.id);
    if (filter === 'In progress') return isModuleStarted(m.id) && !isModuleComplete(m.id);
    if (filter === 'Completed') return isModuleComplete(m.id);
    return true;
  });

  function submitHelp(kind: string) {
    const report = { child: child.name, kind, time: new Date().toISOString() };
    localStorage.setItem('lanternLionDemoHelpRequest', JSON.stringify(report));
    setShowHelp(false);
    setHelpNotice('Your grown-up has been told. You did the right thing by asking.');
  }

  function handleChatSafetyFlag(message: string) {
    const report = { child: child.name, kind: 'Chat: please check in', message, time: new Date().toISOString() };
    localStorage.setItem('lanternLionSafetyAlert', JSON.stringify(report));
    setHelpNotice('A note has been shared with your family.');
  }

  if (!hydrated) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Opening your Lantern &amp; Lion world…</p>
      </main>
    );
  }

  const currentLevelNum = levelInfo?.level ?? Math.floor(starsEarned / 100) + 1;
  const currentLevelTitle = levelInfo?.title ?? (currentLevelNum === 1 ? 'New Explorer' : currentLevelNum === 2 ? 'Lantern Seeker' : 'Level 3 Explorer');
  const nextLevelRequirement = levelInfo?.nextLevelXp ?? (currentLevelNum * 100);

  return (
    <div className={`kid-app-layout ${teen ? 'child-dashboard-teen' : ''}`}>
      {/* PREVIEW BANNER */}
      {isPreview && (
        <div className="preview-mode-banner" role="status">
          <p>
            <strong>Preview Mode:</strong> You are viewing the children’s interactive learning dashboard.
          </p>
          <button type="button" className="button button-secondary" onClick={() => router.push('/onboarding')}>
            Create your account
          </button>
        </div>
      )}

      {/* ── TOP HEADER BAR (Logo, Level, XP, Coins, Gems, Help, Profile) ── */}
      <header className="kid-topbar">
        <div className="kid-topbar-left">
          <button
            type="button"
            className="kid-hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            ☰
          </button>
          <Link href="/child-dashboard" className="kid-brand-header-link">
            <div className="kid-logo-bubble">
              <Image src="/lantern-lion-logo.png" alt="Lantern & Lion" width={44} height={44} priority />
            </div>
            <div className="kid-brand-header-text">
              <strong>Lantern &amp; Lion</strong>
              <small>Learn &amp; Play · Courage &amp; Faith</small>
            </div>
          </Link>
        </div>

        <div className="kid-topbar-right">
          {/* Level Pill */}
          <div className="kid-hud-chip chip-level" title="Your Explorer Level">
            <span aria-hidden="true">👑</span>
            <strong>Lvl {currentLevelNum}</strong>
          </div>

          {/* XP / Stars */}
          <Link href="/adventure" className="kid-hud-chip chip-stars" title="Stars & XP Earned">
            <span aria-hidden="true">⭐</span>
            <strong>{starsEarned.toLocaleString()} XP</strong>
            <span className="chip-plus-badge" aria-hidden="true">+</span>
          </Link>

          {/* Coins */}
          <div className="kid-hud-chip chip-coins" title="Lantern Coins">
            <span aria-hidden="true">🪙</span>
            <strong>{wallet.coins.toLocaleString()}</strong>
          </div>

          {/* Gems */}
          <div className="kid-hud-chip chip-gems" title="Kingdom Gems">
            <span aria-hidden="true">💎</span>
            <strong>{wallet.gems.toLocaleString()}</strong>
          </div>

          {/* Ask for Help Button */}
          <button
            ref={helpTriggerRef}
            type="button"
            className="kid-help-trigger-btn"
            onClick={() => setShowHelp(true)}
            aria-label="Ask for help from parent or teacher"
          >
            <span aria-hidden="true">🛡️</span>
            <span>Ask for Help</span>
          </button>

          {/* Child Profile Capsule */}
          <div className="profile-switch">
            <button
              ref={profileButtonRef}
              type="button"
              className="kid-profile-capsule"
              onClick={() => setShowProfiles((prev) => !prev)}
              aria-expanded={showProfiles}
              aria-haspopup="menu"
            >
              <div className="kid-profile-avatar-bubble">
                {charDisplayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="kid-profile-text">
                <strong>{charDisplayName}</strong>
                <small>{currentLevelTitle} ▾</small>
              </div>
            </button>

            {showProfiles && (
              <div className="profile-menu" role="menu">
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveId(c.id);
                      localStorage.setItem('lanternLionActiveChild', String(c.id));
                      setShowProfiles(false);
                    }}
                    className={c.id === activeId ? 'active' : ''}
                  >
                    <span>{c.name.slice(0, 1)}</span>
                    <div>
                      <strong>{c.name}</strong>
                      <small>{c.age} yrs · {statsForChild(c).points} Stars</small>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  className="child-family-summary-btn"
                  onClick={() => { setShowFamilyModal(true); setShowProfiles(false); }}
                >
                  👨‍👩‍👧 Family Progress Overview
                </button>
                <Link
                  href="/child-access"
                  className="child-signout-link"
                  onClick={() => { void signOutOfPersona('child'); }}
                >
                  Sign out / Switch account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* FEEDBACK NOTICE BANNER */}
      {helpNotice && (
        <div className="kid-notice-banner" role="status">
          <span>🛡️ {helpNotice}</span>
          <button type="button" onClick={() => setHelpNotice('')}>✕</button>
        </div>
      )}

      {/* ── APP BODY: SIDEBAR + MAIN CANVAS ── */}
      <div className="kid-body-container">
        {/* ── SIDEBAR NAVIGATION (Desktop & Mobile Drawer) ── */}
        <aside className={`kid-sidebar ${mobileMenuOpen ? 'kid-sidebar-open' : ''}`}>
          <div className="kid-sidebar-mobile-head">
            <div className="kid-sidebar-mobile-title">
              <strong>Menu</strong>
            </div>
            <button
              type="button"
              className="kid-sidebar-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>

          <nav className="kid-sidebar-nav" aria-label="Dashboard Menu">
            {/* 1. Today */}
            <button
              type="button"
              className={`kid-nav-item ${activeTab === 'today' ? 'active' : ''}`}
              onClick={() => { setActiveTab('today'); setMobileMenuOpen(false); }}
            >
              <span className="kid-nav-icon" aria-hidden="true">🏠</span>
              <span>Today</span>
            </button>

            {/* 2. Adventure */}
            <Link
              href="/adventure"
              className={`kid-nav-item ${activeTab === 'adventure' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="kid-nav-icon" aria-hidden="true">🗺️</span>
              <span>Adventure</span>
            </Link>

            {/* 3. Stories */}
            <button
              type="button"
              className={`kid-nav-item ${activeTab === 'stories' ? 'active' : ''}`}
              onClick={() => { setActiveTab('stories'); setMobileMenuOpen(false); }}
            >
              <span className="kid-nav-icon" aria-hidden="true">📖</span>
              <span>Stories</span>
            </button>

            {/* 4. Arcade */}
            <button
              type="button"
              className={`kid-nav-item ${activeTab === 'arcade' ? 'active' : ''}`}
              onClick={() => { setActiveTab('arcade'); setMobileMenuOpen(false); }}
            >
              <span className="kid-nav-icon" aria-hidden="true">🎮</span>
              <span>Arcade</span>
            </button>

            {/* 5. Leagues */}
            <Link
              href="/leagues"
              className={`kid-nav-item ${activeTab === 'leagues' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="kid-nav-icon" aria-hidden="true">🏆</span>
              <span>Leagues</span>
            </Link>

            {/* 6. Explore */}
            <button
              type="button"
              className={`kid-nav-item ${activeTab === 'explore' ? 'active' : ''}`}
              onClick={() => { setActiveTab('explore'); setMobileMenuOpen(false); }}
            >
              <span className="kid-nav-icon" aria-hidden="true">🧭</span>
              <span>Explore</span>
            </button>

            {/* 7. Progress */}
            <button
              type="button"
              className={`kid-nav-item ${activeTab === 'progress' ? 'active' : ''}`}
              onClick={() => { setActiveTab('progress'); setMobileMenuOpen(false); }}
            >
              <span className="kid-nav-icon" aria-hidden="true">📊</span>
              <span>Progress</span>
            </button>
          </nav>

          {/* ── STATIC CHARACTER CARD AT BOTTOM OF SIDEBAR ── */}
          <div className="kid-sidebar-static-character">
            <Link href="/character" className="kid-static-character-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="kid-static-character-avatar">
                <CharacterAvatar appearance={charAppearance} equipment={charEquipment} size="small" showPedestal={false} />
              </div>
              <div className="kid-static-character-info">
                <p className="kid-char-kicker">🎨 Character</p>
                <strong>{charDisplayName}</strong>
                <small>Customize &amp; Gear →</small>
              </div>
            </Link>
          </div>
        </aside>

        {/* BACKDROP FOR MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="kid-mobile-backdrop" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
        )}

        {/* ── MAIN CONTENT CANVAS ── */}
        <main className="kid-content-canvas">
          {/* TAB: TODAY (MAIN DASHBOARD VIEW) */}
          {activeTab === 'today' && (
            <div className="kid-dashboard-grid">
              {/* 1. LARGE HERO BANNER ("LET'S LEARN!") */}
              <section className="kid-hero-banner">
                <div className="kid-hero-copy">
                  <div className="kid-hero-kicker-row">
                    <span className="kid-hero-sparkle" aria-hidden="true">✨</span>
                    <span className="kid-hero-kicker">TODAY’S EXPEDITION</span>
                  </div>
                  <h2>Let’s Learn!</h2>
                  <p className="kid-hero-tagline">
                    Every lesson is an adventure. Let’s go!
                  </p>
                  <p className="kid-hero-mission-title">
                    📍 <b>{nextExpedition.region.name}:</b> {nextExpedition.title}
                  </p>
                  <div className="kid-hero-btn-row">
                    <Link href={nextExpedition.actionHref} className="kid-hero-start-btn">
                      <span className="kid-hero-btn-icon" aria-hidden="true">📖</span>
                      <span>Start Lesson</span>
                      <span className="kid-hero-arrow-bubble" aria-hidden="true">›</span>
                    </Link>
                  </div>
                </div>

                <div className="kid-hero-rocket-art" aria-hidden="true">
                  <div className="kid-cloud-one" />
                  <div className="kid-cloud-two" />
                  <div className="kid-star-decor star-pos-1">⭐</div>
                  <div className="kid-star-decor star-pos-2">✨</div>
                  <div className="kid-star-decor star-pos-3">⭐</div>
                  <div className="kid-rocket-box">
                    <div className="kid-rocket-body">
                      <div className="kid-rocket-tip" />
                      <div className="kid-rocket-fin-left" />
                      <div className="kid-rocket-fin-right" />
                      <div className="kid-rocket-window">
                        <div className="kid-rocket-pilot">🦁</div>
                      </div>
                      <div className="kid-rocket-flame" />
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. THREE QUICK-ACTION STATUS CARDS ROW */}
              <section className="kid-three-cards-row">
                {/* Card 1: Claim Star / Rewards */}
                <div className="kid-action-card card-yellow-claim">
                  <div className="kid-action-card-top">
                    <div className="kid-action-icon-circle yellow-circle" aria-hidden="true">
                      🏆
                    </div>
                    <div className="kid-action-copy">
                      <strong>Claim Star</strong>
                      <p>Complete a lesson to earn your star!</p>
                    </div>
                  </div>
                  <Link href="/daily-quests" className="kid-pill-btn btn-yellow-pill">
                    <span>⭐</span> Claim Star
                  </Link>
                </div>

                {/* Card 2: Correct / Daily Scripture Check */}
                <div className="kid-action-card card-green-correct">
                  <div className="kid-action-card-top">
                    <div className="kid-action-icon-circle green-circle" aria-hidden="true">
                      ✓
                    </div>
                    <div className="kid-action-copy">
                      <strong>Verse Memory</strong>
                      <p>“Thy word is a lamp unto my feet.”</p>
                    </div>
                  </div>
                  <Link href="/arcade/verse-builder" className="kid-pill-btn btn-green-pill">
                    <span>Correct!</span> ✓
                  </Link>
                </div>

                {/* Card 3: Daily Quest Progress */}
                <div className="kid-action-card card-blue-quest">
                  <div className="kid-action-card-top">
                    <div className="kid-action-icon-circle blue-circle" aria-hidden="true">
                      📅
                    </div>
                    <div className="kid-action-copy">
                      <strong>Daily Quest</strong>
                      <p>Complete {dailySummary.total} missions today</p>
                    </div>
                  </div>
                  <div className="kid-quest-progress-track">
                    <div
                      className="kid-quest-progress-fill"
                      style={{ width: `${(dailySummary.completed / Math.max(dailySummary.total, 1)) * 100}%` }}
                    />
                  </div>
                  <div className="kid-quest-card-footer">
                    <span className="kid-quest-reward-tag">⭐ 50 Stars</span>
                    <span className="kid-quest-fraction">{dailySummary.completed}/{dailySummary.total}</span>
                  </div>
                </div>
              </section>

              {/* 3. BOTTOM ROW: YOUR PROGRESS CARD + MASCOT CELEBRATION CARD */}
              <section className="kid-bottom-grid">
                {/* Left Card: Your Progress */}
                <div className="kid-progress-card">
                  <div className="kid-progress-head">
                    <div>
                      <h3>Your Progress</h3>
                      <p>Amazing effort! You’re on a great streak.</p>
                    </div>
                    <div className="kid-streak-badge">
                      <span aria-hidden="true">🔥</span>
                      <strong>{dailySummary.streak} Day Streak</strong>
                    </div>
                  </div>

                  {/* 3 Stat Counters with Playful Wavy Underlines */}
                  <div className="kid-stat-counters-row">
                    <div className="kid-stat-col">
                      <div className="kid-stat-icon-wrap" aria-hidden="true">⭐</div>
                      <div className="kid-stat-num">{starsEarned}</div>
                      <div className="kid-wavy-line wavy-yellow" />
                      <div className="kid-stat-label">Stars Earned</div>
                    </div>

                    <div className="kid-stat-col">
                      <div className="kid-stat-icon-wrap" aria-hidden="true">🎯</div>
                      <div className="kid-stat-num">{totalSubLessonsCompleted}</div>
                      <div className="kid-wavy-line wavy-green" />
                      <div className="kid-stat-label">Lessons Completed</div>
                    </div>

                    <div className="kid-stat-col">
                      <div className="kid-stat-icon-wrap" aria-hidden="true">🏆</div>
                      <div className="kid-stat-num">Level {currentLevelNum}</div>
                      <div className="kid-wavy-line wavy-blue" />
                      <div className="kid-stat-label">{currentLevelTitle}</div>
                    </div>
                  </div>

                  {/* Star Rating Track */}
                  <div className="kid-star-track-row">
                    <span>Next Level: {nextLevelRequirement} Stars</span>
                    <div className="kid-five-stars-row" aria-label="Level Progress Stars">
                      <span className="star-filled">⭐</span>
                      <span className="star-filled">⭐</span>
                      <span className="star-filled">⭐</span>
                      <span className="star-filled">⭐</span>
                      <span className="star-empty">☆</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Mascot Celebration Card */}
                <div className="kid-mascot-card">
                  <div className="kid-mascot-hills" aria-hidden="true">
                    <div className="mascot-hill-left" />
                    <div className="mascot-hill-right" />
                  </div>
                  <div className="kid-mascot-speech-bubble">
                    Keep shining, superstar!
                  </div>
                  <div className="kid-mascot-character-art">
                    <div className="kid-star-mascot" aria-hidden="true">
                      <div className="star-hand-left">👋</div>
                      <div className="star-mascot-face">
                        <div className="star-eye left" />
                        <div className="star-eye right" />
                        <div className="star-mouth" />
                        <div className="star-cheeks" />
                      </div>
                      <div className="star-hand-right">✨</div>
                      <div className="star-leg-left" />
                      <div className="star-leg-right" />
                    </div>
                  </div>
                  <div className="kid-mascot-action-row">
                    <button type="button" className="kid-mascot-arcade-btn" onClick={() => setActiveTab('arcade')}>
                      🎮 Play Arcade Games
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB: EXPLORE (CURRICULUM MODULES & LESSONS) */}
          {activeTab === 'explore' && (
            <div className="kid-tab-view">
              <div className="kid-tab-header">
                <h2>🧭 Explore Bible Chapters</h2>
                <p>Choose an interactive chapter and discover exciting biblical stories!</p>
              </div>

              <div className="dashboard-filters">
                {(['All lessons', 'Not started', 'In progress', 'Completed'] as ModuleFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={filter === f ? 'active' : ''}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="library-grid">
                {filteredModules.map((mod) => {
                  const lessons = getModuleLessons(mod);
                  const done = doneCountFor(mod.id);
                  const isDone = isModuleComplete(mod.id);
                  return (
                    <article key={mod.id} className="child-game-card theme-blue">
                      <div className="game-card-top">
                        <div className="game-card-icon">📖</div>
                        <span className="game-xp-badge">{done}/{lessons.length} Done</span>
                      </div>
                      <h3>{mod.title}</h3>
                      <p>{mod.description}</p>
                      <Link href={`/learn?module=${mod.id}`} className="game-play-btn">
                        {isDone ? 'Review Chapter ✓' : done > 0 ? 'Continue Chapter →' : 'Start Chapter →'}
                      </Link>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: STORIES */}
          {activeTab === 'stories' && (
            <div className="kid-tab-view">
              <div className="kid-tab-header">
                <h2>📖 Animated Bible Stories</h2>
                <p>Watch, listen, and make choices in faithful Bible stories!</p>
              </div>

              <div className="child-games-grid">
                {STORY_CATALOG.map((story, idx) => (
                  <article key={story.id} className={`child-game-card theme-${idx % 2 === 0 ? 'blue' : 'yellow'}`}>
                    <div className="game-card-top">
                      <div className="game-card-icon">{story.heroEmoji || '📜'}</div>
                      <span className="game-xp-badge">+{story.reward?.xp || 50} XP</span>
                    </div>
                    <h3>{story.title}</h3>
                    <p>{story.scriptureRange} · {story.estimatedMinutes} min read</p>
                    <Link href={`/stories/${story.id}`} className="game-play-btn">
                      Read Story ➔
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ARCADE */}
          {activeTab === 'arcade' && (
            <div className="kid-tab-view">
              <div className="kid-tab-header">
                <h2>🎮 Bible Arcade Quick-Play</h2>
                <p>Play fun interactive Bible games to practice scripture memory!</p>
              </div>

              <div className="child-games-grid">
                {GAME_DEFINITIONS.map((game, idx) => (
                  <article key={game.id} className={`child-game-card theme-${idx % 2 === 0 ? 'blue' : 'yellow'}`}>
                    <div className="game-card-top">
                      <div className="game-card-icon">{game.icon}</div>
                      <span className="game-xp-badge">+{game.baseXp} XP</span>
                    </div>
                    <h3>{game.name}</h3>
                    <p>{game.description}</p>
                    {EMBEDDABLE_GAME_IDS.has(game.id) ? (
                      <button type="button" className="game-play-btn" onClick={() => setActiveGameModal(game.id)}>
                        Play Now ➔
                      </button>
                    ) : (
                      <Link href={`/arcade/${game.id}`} className="game-play-btn">
                        Play Now ➔
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PROGRESS & ACHIEVEMENTS */}
          {activeTab === 'progress' && (
            <div className="kid-tab-view">
              <div className="kid-tab-header">
                <h2>📊 Hall of Achievements</h2>
                <p>Track your biblical knowledge milestones and badges!</p>
              </div>

              <div className="progress-overview">
                <article>
                  <span>🗺️</span>
                  <strong>{canonicalRegions.length}</strong>
                  <small>Regions Discovered</small>
                </article>
                <article>
                  <span>⭐</span>
                  <strong>{starsEarned}</strong>
                  <small>Total Stars Earned</small>
                </article>
                <article>
                  <span>🔥</span>
                  <strong>{dailySummary.streak}</strong>
                  <small>Days in a Row</small>
                </article>
                <article>
                  <span>🏆</span>
                  <strong>Level {currentLevelNum}</strong>
                  <small>{currentLevelTitle}</small>
                </article>
              </div>

              <div className="child-progress-achievements">
                <div className="achievements-card-grid">
                  <div className={`achievement-badge-card ${totalSubLessonsCompleted >= 1 ? 'unlocked' : 'locked'}`}>
                    <span className="badge-icon">🌱</span>
                    <strong>First Steps</strong>
                    <small>Completed your first Bible lesson.</small>
                    <span className="badge-status">{totalSubLessonsCompleted >= 1 ? 'Unlocked' : 'In Progress'}</span>
                  </div>

                  <div className={`achievement-badge-card ${dailySummary.streak >= 3 ? 'unlocked' : 'locked'}`}>
                    <span className="badge-icon">🔥</span>
                    <strong>Faithful Habit</strong>
                    <small>Maintained a 3-day learning streak.</small>
                    <span className="badge-status">{dailySummary.streak >= 3 ? 'Unlocked' : 'In Progress'}</span>
                  </div>

                  <div className={`achievement-badge-card ${totalSubLessonsCompleted >= 10 ? 'unlocked' : 'locked'}`}>
                    <span className="badge-icon">⚔️</span>
                    <strong>Word Warrior</strong>
                    <small>Completed 10 interactive lessons.</small>
                    <span className="badge-status">{totalSubLessonsCompleted >= 10 ? 'Unlocked' : 'In Progress'}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '28px' }}>
                <StreakCard
                  streak={learningStreak || { currentStreak: dailySummary.streak, longestStreak: dailySummary.streak, graceDays: 2, todayQualified: false, nextMilestone: null, streakEndedRecently: false }}
                  tone={teen ? 'teen' : 'child'}
                  onFetchCalendar={fetchStreakCalendar}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── HELP DIALOG MODAL ── */}
      {showHelp && (
        <div className="help-overlay" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div className="help-dialog">
            <button ref={closeHelpRef} type="button" className="close-help" onClick={() => setShowHelp(false)} aria-label="Close help">
              ✕
            </button>
            <p className="child-kicker">Need a Hand?</p>
            <h2 id="help-title">We’re right here with you!</h2>
            <p>Tell us what is happening and we will notify your parent or teacher right away.</p>
            <div>
              <button type="button" onClick={() => submitHelp('A question or story feels confusing')}>
                🤔 A question or story feels confusing
              </button>
              <button type="button" onClick={() => submitHelp('A word or picture made me uncomfortable')}>
                😟 Something made me feel uncomfortable
              </button>
              <button type="button" onClick={() => submitHelp('I want to take a break')}>
                ☕ I want to take a break
              </button>
            </div>
            <small>Your grown-ups are always in the loop so you can learn safely.</small>
          </div>
        </div>
      )}

      {/* ── FAMILY SUMMARY MODAL ── */}
      {showFamilyModal && (
        <div className="help-overlay" role="dialog" aria-modal="true">
          <div className="help-dialog family-modal-dialog">
            <button type="button" className="close-help" onClick={() => setShowFamilyModal(false)}>✕</button>
            <div className="family-modal-badge">👨‍👩‍👧</div>
            <p className="child-kicker">Family Account</p>
            <h2>{familyData.familyName}</h2>
            <p className="family-modal-parent-line">Grown-up: {familyData.parentName}</p>
            <div className="family-modal-child-grid">
              {children.map((c) => {
                const s = statsForChild(c);
                return (
                  <div key={c.id} className={`family-score-card ${c.id === activeId ? 'current' : ''}`}>
                    <div className="fam-card-avatar-frame">
                      <CharacterAvatar appearance={s.appearance} equipment={s.equipment} size="small" showPedestal={false} />
                    </div>
                    <div className="fam-card-info">
                      <strong>{c.name} {c.id === activeId ? '(You)' : ''}</strong>
                      <small>{c.age} years old · Level {s.level} {s.levelTitle}</small>
                      <div className="fam-card-stat-row">
                        <span className="fam-stat-chip chip-xp">⭐ {s.points} XP</span>
                        <span className="fam-stat-chip chip-coins">🪙 {s.coins}</span>
                        <span className="fam-stat-chip chip-gems">💎 {s.gems}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="family-modal-privacy-note">
              🔒 You can see how everyone in your family is doing, but each person’s sign-in stays private —
              only they can play on their own profile, and grown-up settings aren’t shown here.
            </p>
            <button type="button" className="family-modal-close-btn" onClick={() => setShowFamilyModal(false)}>
              Close Overview
            </button>
          </div>
        </div>
      )}

      {/* ── IN-DASHBOARD GAME POPUP (pilot: Verse Builder) ── */}
      {activeGameModal === 'verse-builder' && (
        <div className="help-overlay" role="presentation" onClick={() => setActiveGameModal(null)}>
          <div className="game-modal-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close-help game-modal-close" aria-label="Close game" onClick={() => setActiveGameModal(null)}>✕</button>
            <VerseBuilderGame embedded onClose={() => setActiveGameModal(null)} />
          </div>
        </div>
      )}

      {/* ── EMBEDDED CHAT ASSISTANT ── */}
      <ChatAssistant
        mode="child"
        name={child.name}
        onSafetyFlag={handleChatSafetyFlag}
      />
    </div>
  );
}
