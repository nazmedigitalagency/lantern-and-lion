'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import ChatAssistant from '../chat-assistant';
import { curriculumModules, type CurriculumModule } from '../curriculum-data';
import { getModuleLessons } from '../curriculum-lessons';
import StudioAudioPlayer from '../components/StudioAudioPlayer';
import { computeStreak, getCompletedCount } from '../daily-quests/progression';
import { getOrCreateTodaySet, readHistory } from '../daily-quests/storage';
import { getTemplate } from '../daily-quests/catalog';
import type { DailyQuestSet } from '../daily-quests/types';
import { CharacterAvatar } from '../character/components';
import { ItemIllustration } from '../character/item-icons';
import { readAppearance, readEquipment, readCharacterName } from '../character/storage';
import type { CharacterAppearance, CharacterEquipment } from '../character/types';
import { useActivityHeartbeat } from '../lib/activity/idle-tracker';
import { StreakCard } from '../lib/streak/StreakCard';
import { claimStreakMilestoneIfNew } from '../lib/streak/client';
import type { StreakStatus } from '../lib/streak/server';
import { LeagueCard } from '../lib/leagues/LeagueCard';
import { getLeaguePod } from '../lib/leagues/storage';
import { getNextMissionRecommendation, getRegionStatus } from '../adventure/progression';
import { canonicalRegions } from '../adventure/world-data';
import { loadWorldContext } from '../adventure/storage';
import { getStoryDashboardSummary } from '../stories/engine';
import { STORY_CATALOG } from '../stories/catalog';
import { LearningJourneyCard, type LearningPlanResponse } from '../lib/adaptive/LearningJourneyCard';
import { getWallet, getCurrentLevel } from '../lib/economy/wallet-service';
import type { Wallet } from '../lib/economy/types';
import type { LevelInfo } from '../lib/xp-levels';
import { GAME_DEFINITIONS } from '../arcade/catalog';

type Child = { id: number; name: string; username?: string; age: number; avatar: string; pin: string };
type View = 'today' | 'library' | 'progress';
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

const trackLabel: Record<CurriculumModule['track'], string> = {
  early: 'Lantern Explorers',
  pathfinder: 'Brave Pathfinders',
  teen: 'The Lion’s Den',
  family: 'All-Age Family Quest',
};

const toneForTrack: Record<CurriculumModule['track'], string> = {
  early: 'gold',
  pathfinder: 'teal',
  teen: 'coral',
  family: 'sky',
};

const trackEmoji: Record<CurriculumModule['track'], string> = {
  early: '🏮',
  pathfinder: '🧭',
  teen: '🦁',
  family: '🌟',
};

function readModuleProgressForChild(childId: number): Record<string, ModuleProgressEntry> {
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
  const [activeId, setActiveId] = useState<number>(fallbackChildren[0].id);
  const [view, setView] = useState<View>('today');
  const [familyData, setFamilyData] = useState({ familyName: 'The Adeyemi Family', parentName: 'Jordan Adeyemi', country: 'Nigeria' });
  const [showHelp, setShowHelp] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [helpNotice, setHelpNotice] = useState('');
  const [filter, setFilter] = useState<ModuleFilter>('All lessons');
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgressEntry>>({});
  const [dailySummary, setDailySummary] = useState({ completed: 0, total: 4, streak: 0 });
  const [todayQuestSet, setTodayQuestSet] = useState<DailyQuestSet | null>(null);
  const [charAppearance, setCharAppearance] = useState<CharacterAppearance>({ skinTone: 'honey', hairStyle: 'curls', face: 'smile' });
  const [charEquipment, setCharEquipment] = useState<CharacterEquipment>({});
  const [charDisplayName, setCharDisplayName] = useState<string>('Amara');
  const [wallet, setWallet] = useState<Wallet>({ xp: 0, coins: 0, gems: 0 });
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  const closeHelpRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [classError, setClassError] = useState('');
  const [connectedClass, setConnectedClass] = useState<{ id: number; name: string; ageBand: string; code: string; teacher: string } | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  type TodaySummaryData = { active_seconds: number; games_played: number; quests_completed: number; xp_earned: number; achievements_earned: number };
  const [learningStreak, setLearningStreak] = useState<StreakStatus | null>(null);
  const [milestoneToast, setMilestoneToast] = useState<{ label: string; coins: number; gems: number } | null>(null);
  const [learningPlan, setLearningPlan] = useState<LearningPlanResponse | null>(null);

  useActivityHeartbeat(hydrated && !isPreview);

  useEffect(() => {
    if (!hydrated || isPreview) return;
    fetch('/api/child/learning-plan')
      .then((res) => (res.ok ? (res.json() as Promise<LearningPlanResponse>) : null))
      .then((data) => { if (data) setLearningPlan(data); })
      .catch(() => { /* Offline — widget just stays hidden. */ });
  }, [hydrated, isPreview]);

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
          const milestone = claimStreakMilestoneIfNew(activeId, data.streak.currentStreak);
          if (milestone) {
            setMilestoneToast(milestone);
            window.setTimeout(() => setMilestoneToast(null), 5000);
          }
        }
      })
      .catch(() => { /* Offline — widget just stays hidden. */ });
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
      try {
        const params = new URLSearchParams(window.location.search);
        const parentSession = JSON.parse(localStorage.getItem('lanternLionDemoSession') || 'null');
        const previewMode = params.get('preview') === '1' && Boolean(parentSession);
        const previewChildId = Number(params.get('child'));
        setIsPreview(previewMode);

        const family = JSON.parse(localStorage.getItem('lanternLionDemoFamily') || 'null');
        const childSession = JSON.parse(localStorage.getItem('lanternLionChildSession') || 'null');
        const savedClass = JSON.parse(localStorage.getItem('lanternLionConnectedClass') || 'null');

        if (savedClass) setConnectedClass(savedClass);

        if (family) {
          setFamilyData({
            familyName: family.familyName || 'The Adeyemi Family',
            parentName: parentSession?.name || 'Jordan Adeyemi',
            country: family.country || 'Nigeria',
          });
        }

        let currentId: number | null = null;
        if (previewMode && previewChildId) {
          if (family?.children?.length) {
            setChildren(family.children);
            currentId = family.children.some((item: Child) => item.id === previewChildId) ? previewChildId : family.children[0].id;
          }
        } else if (childSession?.childId && family?.children?.some((item: Child) => item.id === childSession.childId)) {
          setChildren(family.children);
          currentId = childSession.childId;
        }

        if (currentId === null) {
          router.replace('/child-access');
          return;
        }

        const progressForCurrent = readModuleProgressForChild(currentId);
        setActiveId(currentId);
        setModuleProgress(progressForCurrent);
        setCharAppearance(readAppearance(currentId));
        setCharEquipment(readEquipment(currentId));
        const matchedChild = (family?.children || fallbackChildren).find((c: Child) => c.id === currentId);
        setCharDisplayName(readCharacterName(currentId, matchedChild?.name || 'Adventurer'));

        // Load economy wallet and level info
        const childWallet = getWallet(currentId);
        setWallet(childWallet);
        setLevelInfo(getCurrentLevel(currentId));

        const isTeenAge = (matchedChild?.age ?? 9) >= 13;
        const todaySet = getOrCreateTodaySet(currentId, { moduleProgress: progressForCurrent, masteredQuestIds: [], kind: isTeenAge ? 'teen' : 'child' });
        setTodayQuestSet(todaySet);
        setDailySummary({
          completed: getCompletedCount(todaySet),
          total: todaySet.quests.length,
          streak: computeStreak(readHistory(currentId)).current,
        });
      } catch { /* Keep demo content available. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

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
  const completedModulesCount = trackModules.filter((m) => isModuleComplete(m.id)).length;
  const goalDone = Math.min(5, completedModulesCount);
  const points = wallet.xp > 0 ? wallet.xp : totalSubLessonsCompleted * 8;

  const continueModule = trackModules.find((m) => !isModuleComplete(m.id)) || trackModules[0];
  const continueLessons = continueModule ? getModuleLessons(continueModule) : [];
  const continueDoneCount = continueModule ? doneCountFor(continueModule.id) : 0;
  const continueModuleComplete = continueModule ? isModuleComplete(continueModule.id) : false;

  const adventureCtx = useMemo(() => loadWorldContext(child.id, teen ? 'teen' : 'child'), [child.id, teen]);
  const nextExpedition = useMemo(() => getNextMissionRecommendation(adventureCtx), [adventureCtx]);
  const storySummary = useMemo(() => getStoryDashboardSummary(child.id, STORY_CATALOG), [child.id]);

  function statsForChild(c: Child) {
    const track = trackForAge(c.age);
    const modules = curriculumModules.filter((m) => m.track === track);
    const progress = c.id === activeId ? moduleProgress : readModuleProgressForChild(c.id);
    const done = modules.reduce((sum, m) => sum + (progress[m.id]?.completedIndices.length || 0), 0);
    const childW = getWallet(c.id);
    return { track, done, points: childW.xp > 0 ? childW.xp : done * 8 };
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
    localStorage.setItem('lanternLionDemoHelpRequest', JSON.stringify(report));
    setHelpNotice('Your grown-up has been quietly told about your chat, so they can check in with you.');
  }

  // ── Classroom Connection ──────────────────────────────────────
  function connectClassroom() {
    setClassError('');
    const cleanCode = classCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setClassError('Please enter the code provided by your teacher.');
      return;
    }

    fetch('/api/classrooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode }),
    }).catch(() => { /* Offline/local-only class connection. */ });

    type TeacherClassroom = { id: number; name: string; ageBand: string; code: string; teacherEmail?: string; teacherName?: string; students?: Array<{ id: number; name: string; age: number; progress: number; needsHelp: boolean; parent: string; approved: boolean }> };
    const starterClasses: TeacherClassroom[] = [
      { id: 1, name: 'Wednesday Explorers', ageBand: 'Ages 8–11', code: 'LION-482', teacherEmail: 'grace@lantern.demo', teacherName: 'Grace Okafor', students: [] },
      { id: 2, name: 'Friday Teen Circle', ageBand: 'Ages 13–16', code: 'LAMP-731', teacherEmail: 'grace@lantern.demo', teacherName: 'Grace Okafor', students: [] },
    ];
    let classList = starterClasses;
    let hasStoredClasses = false;
    try {
      const stored = JSON.parse(localStorage.getItem('lanternLionTeacherClasses') || 'null');
      if (Array.isArray(stored) && stored.length) {
        classList = stored;
        hasStoredClasses = true;
      }
    } catch { /* use starter */ }

    const match = classList.find((c) => c.code.toUpperCase() === cleanCode);
    if (match) {
      const teacherName = match.teacherName || 'the teacher';
      if (hasStoredClasses) {
        try {
          const nextClassList = classList.map((item) => {
            if (item.id !== match.id) return item;
            const roster = item.students || [];
            if (roster.some((s) => s.id === child.id)) return item;
            return { ...item, students: [...roster, { id: child.id, name: child.name, age: child.age, progress: 0, needsHelp: false, parent: familyData.parentName, approved: true }] };
          });
          localStorage.setItem('lanternLionTeacherClasses', JSON.stringify(nextClassList));
        } catch { /* Roster registration is best-effort in this demo. */ }
      }

      setConnectedClass({ id: match.id, name: match.name, ageBand: match.ageBand, code: match.code, teacher: teacherName });
      localStorage.setItem('lanternLionConnectedClass', JSON.stringify({ id: match.id, name: match.name, ageBand: match.ageBand, code: match.code, teacher: teacherName }));
      setShowClassModal(false);
      setClassCodeInput('');
      setHelpNotice(`Connected to ${match.name} (Teacher ${teacherName})!`);
    } else {
      setClassError('That code didn’t match any open classroom. Check with your teacher or try LION-482.');
    }
  }

  function disconnectClassroom() {
    setConnectedClass(null);
    localStorage.removeItem('lanternLionConnectedClass');
    setHelpNotice('Disconnected from classroom.');
  }

  if (!hydrated) return <main className="dashboard-loading" aria-live="polite"><span></span><p>Opening the child space…</p></main>;

  const currentLvl = levelInfo?.level || 1;
  const currentTitle = levelInfo?.title || 'New Explorer';
  const xpInto = levelInfo?.xpIntoLevel || 0;
  const xpRequiredForNext = levelInfo?.nextLevelXp ? levelInfo.nextLevelXp - levelInfo.currentLevelXp : 100;
  const xpPct = levelInfo?.progressPercent || Math.min(100, Math.round((xpInto / Math.max(xpRequiredForNext, 1)) * 100));

  return (
    <main className={`child-dashboard ${teen ? 'child-dashboard-teen' : ''}`}>
      {isPreview && (
        <div className="preview-mode-banner" role="status">
          <span aria-hidden="true">👁️</span>
          <p>You’re viewing a read-only preview of {child.name}’s space. Nothing you do here is saved or sent as {child.name}.</p>
          <Link href="/parent-dashboard" className="button button-secondary">Exit preview</Link>
        </div>
      )}

      {milestoneToast && (
        <div className="streak-milestone-toast" role="status" aria-live="polite">
          <strong>🔥 {milestoneToast.label}!</strong>
          <span>+{milestoneToast.coins} 🪙{milestoneToast.gems > 0 ? ` +${milestoneToast.gems} 💎` : ''}</span>
        </div>
      )}

      {/* ── TOPBAR & GAME HUD ── */}
      <header className="child-topbar">
        <Link href="/" className="child-logo">
          <Image src="/lantern-lion-logo.png" alt="" width={52} height={52} priority />
          <span>
            <strong>{teen ? 'Lion’s Den' : 'The Lantern Club'}</strong>
            <small>Lantern &amp; Lion</small>
          </span>
        </Link>

        <nav className="child-nav" aria-label="Child dashboard navigation">
          <button
            type="button"
            aria-pressed={view === 'today'}
            className={view === 'today' ? 'active' : ''}
            onClick={() => setView('today')}
          >
            🌟 Today
          </button>
          <Link href="/adventure">🗺️ Adventure</Link>
          <Link href="/stories">📖 Stories</Link>
          <Link href="/character">🧑 Character</Link>
          <Link href="/arcade">🎮 Arcade</Link>
          <Link href="/leagues">🏆 Leagues</Link>
          <button
            type="button"
            aria-pressed={view === 'library'}
            className={view === 'library' ? 'active' : ''}
            onClick={() => setView('library')}
          >
            🧭 Explore
          </button>
          <button
            type="button"
            aria-pressed={view === 'progress'}
            className={view === 'progress' ? 'active' : ''}
            onClick={() => setView('progress')}
          >
            📊 Progress
          </button>
        </nav>

        <div className="child-header-actions">
          {/* Real-Time Game HUD */}
          <div className="child-hud" role="group" aria-label="Player stats HUD">
            <span className="child-hud-pill hud-level" title={`Level ${currentLvl}: ${currentTitle}`}>
              🧭 Lvl {currentLvl}
            </span>
            <span className="child-hud-pill hud-xp" title="Total Light XP earned">
              ⭐ {wallet.xp.toLocaleString()} XP
            </span>
            <span className="child-hud-pill hud-coins" title="Lantern Coins">
              🪙 {wallet.coins.toLocaleString()}
            </span>
            <span className="child-hud-pill hud-gems" title="Gems">
              💎 {wallet.gems.toLocaleString()}
            </span>
          </div>

          {!isPreview && (
            <button ref={helpTriggerRef} className="help-button" onClick={() => setShowHelp(true)}>
              Ask for help
            </button>
          )}

          <div className="profile-switch">
            <button
              ref={profileButtonRef}
              className="profile-button"
              aria-expanded={showProfiles}
              aria-controls="child-profile-menu"
              onClick={() => setShowProfiles(!showProfiles)}
              aria-label={`Profile menu for ${child.name}`}
            >
              <span>{child.name.slice(0, 1)}</span>
              <b>{child.name}</b>
            </button>
            {showProfiles && (
              <div className="profile-menu" id="child-profile-menu">
                <button
                  type="button"
                  className="child-family-summary-btn"
                  onClick={() => { setShowFamilyModal(true); setShowProfiles(false); }}
                >
                  🌟 Our family summary
                </button>
                {!isPreview && (
                  <Link
                    href="/child-access"
                    onClick={() => {
                      fetch('/api/child-auth/logout', { method: 'POST' }).catch(() => {});
                      localStorage.removeItem('lanternLionChildSession');
                      localStorage.removeItem('lanternLionActiveChildId');
                    }}
                    className="child-signout-link"
                  >
                    Sign out of {child.name}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── TODAY VIEW ── */}
      {view === 'today' && (
        <div className="child-dashboard-body">
          {/* Welcome Hero & Character Game Profile */}
          <section className="child-welcome-hero" aria-label="Welcome and adventurer profile">
            <div className="child-hero-char-box">
              <div className="child-hero-avatar-wrap">
                <CharacterAvatar appearance={charAppearance} equipment={charEquipment} size="large" showPedestal={true} />
              </div>
              <div className="child-hero-char-meta">
                <div className="child-hero-level-chip">
                  <span className="hero-lvl-badge">🧭 Level {currentLvl}</span>
                  <span className="hero-lvl-title">{currentTitle}</span>
                </div>
                <div className="child-hero-xp-bar" title={`${xpInto} / ${xpRequiredForNext} XP to Level ${currentLvl + 1}`}>
                  <div className="hero-xp-track">
                    <div className="hero-xp-fill" style={{ width: `${xpPct}%` }} />
                  </div>
                  <span className="hero-xp-text">{xpInto} / {xpRequiredForNext} XP to next level</span>
                </div>

                <div className="child-hero-gear-preview" aria-label="Equipped items">
                  <span className="hero-gear-bubble" title="Headwear">
                    <ItemIllustration itemId={charEquipment.headwear || 'starter-cap'} size={24} />
                  </span>
                  <span className="hero-gear-bubble" title="Tunic / Robe">
                    <ItemIllustration itemId={charEquipment.clothing || 'starter-tunic'} size={24} />
                  </span>
                  <span className="hero-gear-bubble" title="Sandals">
                    <ItemIllustration itemId={charEquipment.shoes || 'starter-sandals'} size={24} />
                  </span>
                  {charEquipment.accessory && (
                    <span className="hero-gear-bubble" title="Accessory">
                      <ItemIllustration itemId={charEquipment.accessory} size={24} />
                    </span>
                  )}
                  {charEquipment.special && (
                    <span className="hero-gear-bubble hero-gear-special" title="Special Companion">
                      <ItemIllustration itemId={charEquipment.special} size={24} />
                    </span>
                  )}
                </div>

                <Link href="/character" className="child-hero-customise-btn">
                  🎨 Customise Character →
                </Link>
              </div>
            </div>

            <div className="child-hero-welcome-box">
              <p className="child-kicker">{teen ? '🦁 Lion’s Den Expedition' : '🌟 Welcome back to the adventure'}</p>
              <h1>Hi, {charDisplayName}! What will you explore today?</h1>
              <p className="child-hero-subtext">
                {teen
                  ? 'Dive into your courage study, take on Bible arcade games, and explore biblical lands.'
                  : 'Journey through Eden and Galilee, solve puzzles, level up your character, and light the path!'}
              </p>

              {/* Status Radar Chips */}
              <div className="child-hero-status-grid">
                <div className="hero-status-card status-quests">
                  <span className="status-icon" aria-hidden="true">📅</span>
                  <div>
                    <strong>{dailySummary.completed}/{dailySummary.total} Quests</strong>
                    <small>{dailySummary.completed >= dailySummary.total ? 'All completed today! 🌟' : 'Ready to play'}</small>
                  </div>
                </div>
                <div className="hero-status-card status-streak">
                  <span className="status-icon" aria-hidden="true">🔥</span>
                  <div>
                    <strong>{dailySummary.streak} Day Streak</strong>
                    <small>Keep the flame shining</small>
                  </div>
                </div>
                <div className="hero-status-card status-expedition">
                  <span className="status-icon" aria-hidden="true">{nextExpedition.region.icon}</span>
                  <div>
                    <strong>{nextExpedition.region.name}</strong>
                    <small>{nextExpedition.title}</small>
                  </div>
                </div>
              </div>

              <div className="child-hero-cta-row">
                <Link href={nextExpedition.actionHref} className="button button-primary child-hero-play-btn">
                  ▶ Jump Into Today’s Expedition →
                </Link>
                <Link href="/arcade" className="button button-secondary child-hero-arcade-btn">
                  🎮 Play Arcade Games
                </Link>
              </div>
            </div>

            <div className="welcome-lantern" aria-hidden="true">
              <span></span>
              <i></i>
              <b>{points}</b>
            </div>
          </section>

          {/* ── STREAK & LEAGUE ROW ── */}
          {learningStreak && !isPreview && (
            <StreakCard streak={learningStreak} tone={teen ? 'teen' : 'child'} onFetchCalendar={fetchStreakCalendar} />
          )}

          {!isPreview && (
            <LeagueCard
              pod={getLeaguePod(child.id, child.name, child.age, child.avatar, charAppearance)}
              isTeen={teen}
            />
          )}

          {!isPreview && learningPlan && (
            <LearningJourneyCard plan={learningPlan} isTeen={teen} />
          )}

          {/* ── TODAY'S MISSION & EXPEDITION GRID ── */}
          <div className="child-today-grid">
            {/* Mission Board: Today's Quests */}
            <section className="child-quest-board-card" aria-label="Today's Quests">
              <div className="quest-board-header">
                <div className="quest-board-title-side">
                  <span className="quest-board-badge" aria-hidden="true">🎯</span>
                  <div>
                    <h2>Today’s Daily Quests</h2>
                    <small className="quest-board-subtitle">Complete missions to earn XP, Lantern Coins, and Gems!</small>
                  </div>
                </div>
                <div className="quest-board-progress-side">
                  <span className="quest-count-pill">
                    <b>{dailySummary.completed}</b> of <b>{dailySummary.total}</b> done
                  </span>
                  <div className="quest-meter">
                    <div
                      className="quest-meter-fill"
                      style={{ width: `${(dailySummary.completed / Math.max(dailySummary.total, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="quest-slot-list">
                {todayQuestSet?.quests.map((instance) => {
                  const tmpl = getTemplate(instance.templateId);
                  if (!tmpl) return null;
                  const isDone = instance.completed;
                  return (
                    <article key={instance.templateId} className={`quest-item-tile ${isDone ? 'quest-done' : ''}`}>
                      <span className="quest-item-icon" aria-hidden="true">
                        {isDone ? '✅' : tmpl.icon}
                      </span>
                      <div className="quest-item-body">
                        <strong>{tmpl.title}</strong>
                        <p>{tmpl.description}</p>
                      </div>
                      <div className="quest-item-rewards">
                        <span className="reward-pill xp-pill">+{tmpl.xp} XP</span>
                        <span className="reward-pill coin-pill">+{tmpl.coins} 🪙</span>
                      </div>
                      <div className="quest-item-action">
                        {isDone ? (
                          <span className="quest-completed-badge">✓ Completed</span>
                        ) : (
                          <Link href="/daily-quests" className="button button-primary quest-play-btn">
                            {tmpl.completionMode === 'verse-recall' || tmpl.completionMode === 'word-scramble' ? 'Play' : 'Go'}
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="quest-board-footer">
                <Link href="/daily-quests" className="button button-primary quest-footer-btn">
                  {dailySummary.completed >= dailySummary.total ? '🌟 View Today’s Rewards & Mystery Chest →' : '🚀 Open Daily Quests Room →'}
                </Link>
              </div>
            </section>

            {/* Next Expedition Spotlight */}
            <section className="child-expedition-card" aria-label="Next Bible Adventure Expedition">
              <div className="expedition-header">
                <span className="expedition-region-icon" aria-hidden="true">{nextExpedition.region.icon}</span>
                <div>
                  <span className="expedition-tag">🗺️ Next Expedition · {nextExpedition.region.name}</span>
                  <h2>{nextExpedition.title}</h2>
                  <p className="expedition-subtitle">{nextExpedition.subtitle}</p>
                </div>
              </div>

              {/* 8-Region Mini World Track */}
              <div className="expedition-world-track" aria-label="8 Biblical Regions Progression">
                <p className="track-kicker">Bible Adventure World Progress</p>
                <div className="track-dots-row">
                  {canonicalRegions.map((r, idx) => {
                    const status = getRegionStatus(r, adventureCtx);
                    const isCompleted = status === 'completed';
                    const isCurrent = status === 'in-progress' || status === 'available';
                    return (
                      <div
                        key={r.id}
                        className={`track-region-node ${isCompleted ? 'node-complete' : isCurrent ? 'node-current' : 'node-locked'}`}
                        title={`${r.name}: ${status}`}
                      >
                        <span className="node-icon">{r.icon}</span>
                        <small className="node-label">{r.name}</small>
                        {isCompleted && <span className="node-check" aria-hidden="true">✓</span>}
                        {idx < canonicalRegions.length - 1 && <span className="node-connector" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="expedition-actions">
                <Link href={nextExpedition.actionHref} className="button button-primary expedition-main-btn">
                  ▶ Continue Adventure in {nextExpedition.region.name} →
                </Link>
                <Link href="/adventure" className="button button-secondary expedition-map-btn">
                  🗺️ Open Full World Map
                </Link>
              </div>
            </section>
          </div>

          {/* ── INTERACTIVE BIBLE STORIES SPOTLIGHT ── */}
          {storySummary && (
            <section className="child-story-spotlight-card" aria-label="Interactive Bible Story Adventure">
              <div className="story-spotlight-hero-icon" aria-hidden="true">
                {storySummary.story.heroEmoji}
              </div>
              <div className="story-spotlight-content">
                <span className="story-spotlight-tag">
                  {storySummary.resuming ? '📖 Resume Story Adventure' : '✨ Interactive Bible Story'}
                </span>
                <h2>{storySummary.story.title}</h2>
                <p className="story-spotlight-meta">
                  📖 {storySummary.story.scriptureRange} · ⏱️ ~{storySummary.story.estimatedMinutes} minutes · Make faithful choices!
                </p>
                <p className="story-spotlight-tagline">
                  ⭐ Earn +{storySummary.story.reward.xp} XP, +{storySummary.story.reward.coins} Coins, and +{storySummary.story.reward.gems} Gems by completing this story adventure!
                </p>
              </div>
              <div className="story-spotlight-action">
                <Link href={`/stories/${storySummary.story.id}`} className="button button-primary story-start-btn">
                  {storySummary.resuming ? '▶ Continue Story →' : '▶ Start Adventure Story →'}
                </Link>
              </div>
            </section>
          )}

          {/* ── ARCADE & BIBLE GAMES SHOWCASE ── */}
          <section className="child-arcade-showcase" aria-label="Bible Arcade Games">
            <div className="child-section-head">
              <div>
                <p className="child-kicker">🎮 Lantern Bible Arcade</p>
                <h2>Play &amp; Learn Games</h2>
              </div>
              <Link href="/arcade" className="section-head-link">
                Visit Full Arcade ({GAME_DEFINITIONS.length} Games) →
              </Link>
            </div>

            <div className="child-games-grid">
              {GAME_DEFINITIONS.slice(0, 6).map((game, index) => {
                const gameThemes = ['theme-blue', 'theme-yellow', 'theme-green', 'theme-purple', 'theme-blue', 'theme-yellow'];
                const themeClass = gameThemes[index % gameThemes.length];
                return (
                  <article key={game.id} className={`child-game-card ${themeClass}`}>
                    <div className="game-card-top">
                      <span className="game-card-icon" aria-hidden="true">{game.icon}</span>
                      <span className="game-xp-badge">+{game.baseXp} XP</span>
                    </div>
                    <h3>{game.name}</h3>
                    <p>{game.description}</p>
                    <div className="game-skills-row">
                      {game.skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="game-skill-chip">{skill}</span>
                      ))}
                    </div>
                    <Link href={`/arcade/${game.id}`} className="button button-primary game-play-btn">
                      Play Now ▶
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ── SCRIPTURE OF THE DAY ("VERSE ON THE PATH") ── */}
          <section className="verse-strip" aria-label="Verse of the Day">
            <span className="verse-mark" aria-hidden="true">💡</span>
            <div>
              <p className="child-kicker">Verse on the path</p>
              <blockquote>
                “{continueModule?.corePassage || 'Your word is a lamp to my feet, and a light for my path.'}”
              </blockquote>
              <small>{continueModule?.coreVerse || 'Psalm 119:105'}, WEB</small>

              <div className="verse-audio-wrap">
                <StudioAudioPlayer
                  text={`Verse on the path. ${continueModule?.coreVerse || 'Psalm 119:105'}. ${continueModule?.corePassage || 'Your word is a lamp to my feet, and a light for my path.'}`}
                  title="Daily Scripture Audio"
                  compact={true}
                  defaultVoiceId={childTrack === 'teen' ? 'en-GB-Journey-D' : 'en-GB-Journey-F'}
                />
              </div>
            </div>
            <div className="verse-strip-actions">
              <Link href="/arcade/verse-builder" className="button button-primary verse-builder-action">
                🧱 Practise in Verse Builder →
              </Link>
            </div>
          </section>

          {/* ── SUNDAY SCHOOL / CLASSROOM STRIP ── */}
          <section className="child-classroom-strip" aria-label="Sunday School connection">
            <span className="classroom-strip-icon" aria-hidden="true">🏫</span>
            {connectedClass ? (
              <div className="classroom-strip-info">
                <strong>Connected to {connectedClass.name}</strong>
                <small>Teacher: {connectedClass.teacher} · Join code: <b>{connectedClass.code}</b></small>
              </div>
            ) : (
              <div className="classroom-strip-info">
                <strong>Have a Sunday School or School class code?</strong>
                <small>Connect with your teacher to see classroom assignments and study together.</small>
              </div>
            )}
            <button
              type="button"
              className="button button-secondary classroom-strip-btn"
              onClick={() => setShowClassModal(true)}
            >
              {connectedClass ? 'Class details →' : 'Enter join code →'}
            </button>
          </section>

          {/* ── CONTINUED LESSON SPOTLIGHT ── */}
          <section className="continue-layout" aria-label="Continue your lesson">
            {continueModule ? (
              <article className="continue-card">
                <div className="continue-art">
                  <span>01</span>
                  <div className="hill hill-one"></div>
                  <div className="hill hill-two"></div>
                  <i></i>
                </div>
                <div className="continue-copy">
                  <p className="child-kicker">{trackLabel[childTrack]} · Continue your study</p>
                  <h2>{continueModule.title}</h2>
                  <p>{continueModule.description}</p>
                  <div className="lesson-progress">
                    <span>
                      <i style={{ width: `${(continueDoneCount / Math.max(continueLessons.length, 1)) * 100}%` }} />
                    </span>
                    <small>
                      {continueModuleComplete ? '✓ Module Finished' : `Lesson ${Math.min(continueDoneCount + 1, continueLessons.length)} of ${continueLessons.length}`}
                    </small>
                  </div>
                  <Link className="button button-primary" href={`/learn?module=${continueModule.id}`}>
                    {continueModuleComplete ? 'Review this module' : continueDoneCount > 0 ? 'Continue the lesson' : 'Start the lesson'}
                  </Link>
                </div>
              </article>
            ) : (
              <article className="continue-card">
                <div className="continue-copy">
                  <p className="child-kicker">{trackLabel[childTrack]}</p>
                  <h2>New lessons coming soon</h2>
                  <p>Check back soon for more in your age group.</p>
                </div>
              </article>
            )}

            <aside className="today-plan">
              <div className="today-plan-head">
                <span>{continueModule ? continueModule.title : 'Today’s plan'}</span>
                <b>{continueDoneCount} of {continueLessons.length} done</b>
              </div>
              {continueLessons.map((lesson, index) => {
                const done = index < continueDoneCount;
                const isNext = index === continueDoneCount;
                return (
                  <Link
                    key={lesson.title}
                    className={done ? 'done' : ''}
                    href={`/learn?module=${continueModule?.id}&lesson=${index}`}
                  >
                    <span>{done ? '✓' : index + 1}</span>
                    <div>
                      <strong>{lesson.title}</strong>
                      <small>{done ? 'Finished' : isNext ? `${lesson.minutes} minutes` : 'Up next'}</small>
                    </div>
                  </Link>
                );
              })}
              <p>You can stop after any lesson. Your place is saved on this device.</p>
            </aside>
          </section>
        </div>
      )}

      {/* ── EXPLORE / LIBRARY VIEW ── */}
      {view === 'library' && (
        <div className="child-dashboard-body dashboard-view">
          <div className="dashboard-title">
            <p className="child-kicker">🧭 Explore {trackLabel[childTrack]}</p>
            <h1>What do you feel like learning?</h1>
            <p>Every lesson here is handcrafted for your age band. Explore at your own pace!</p>
          </div>

          <div className="dashboard-filters">
            {(['All lessons', 'Not started', 'In progress', 'Completed'] as ModuleFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                className={filter === item ? 'active' : ''}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="dashboard-activity-grid library-grid">
            {filteredModules.map((mod) => {
              const total = lessonCountFor(mod.id);
              const done = doneCountFor(mod.id);
              return (
                <article className={toneForTrack[mod.track]} key={mod.id}>
                  <span className="activity-mark">{mod.title[0]}</span>
                  <small>{mod.theme} · {total} lessons</small>
                  <h3>{mod.title}</h3>
                  <Link href={`/learn?module=${mod.id}`}>
                    {done >= total && total > 0 ? 'Review again' : done > 0 ? 'Continue' : 'Start lesson'}
                  </Link>
                </article>
              );
            })}
          </div>
          {filteredModules.length === 0 && (
            <p className="dashboard-empty-note">No lessons match this filter yet — try a different one.</p>
          )}
        </div>
      )}

      {/* ── MY PROGRESS VIEW ── */}
      {view === 'progress' && (
        <div className="child-dashboard-body dashboard-view">
          <div className="dashboard-title">
            <p className="child-kicker">📊 My Progress &amp; Trophies</p>
            <h1>Look how far you’ve come!</h1>
            <p>Every step in God’s Word shines bright. You never lose points for taking a break.</p>
          </div>

          {/* 4 Top Progress Counters */}
          <div className="progress-overview">
            <article>
              <span aria-hidden="true">⭐</span>
              <strong>{wallet.xp.toLocaleString()}</strong>
              <small>Total Light XP</small>
            </article>
            <article>
              <span aria-hidden="true">📖</span>
              <strong>{completedModulesCount}</strong>
              <small>Modules Completed</small>
            </article>
            <article>
              <span aria-hidden="true">🔥</span>
              <strong>{dailySummary.streak}</strong>
              <small>Day Learning Streak</small>
            </article>
            <article>
              <span aria-hidden="true">✅</span>
              <strong>{totalSubLessonsCompleted}</strong>
              <small>Lessons Finished</small>
            </article>
          </div>

          {/* Weekly Path */}
          <section className="progress-path" aria-label="Weekly Light Path">
            <div>
              <p className="child-kicker">This week’s lights</p>
              <h2>Growing in {trackLabel[childTrack]}</h2>
            </div>
            <div className="path-line">
              {[1, 2, 3, 4, 5].map((day) => (
                <span className={day <= goalDone ? 'lit' : ''} key={day}>
                  {day <= goalDone ? '✓' : day}
                </span>
              ))}
            </div>
            <p>
              {goalDone === 5
                ? '🌟 Every light is on this week! Take a rest or explore a new story.'
                : `${5 - goalDone} more ${5 - goalDone === 1 ? 'light' : 'lights'} to complete this week’s path.`}
            </p>
          </section>

          {/* Achievements Showcase */}
          <section className="child-progress-achievements" aria-label="Achievements Showcase">
            <div className="child-section-head">
              <div>
                <p className="child-kicker">🏆 Hall of Achievements</p>
                <h2>Badges &amp; Milestones</h2>
              </div>
            </div>

            <div className="achievements-card-grid">
              <div className={`achievement-badge-card ${wallet.xp >= 50 ? 'unlocked' : 'locked'}`}>
                <span className="badge-icon" aria-hidden="true">🌟</span>
                <strong>First Light</strong>
                <small>Earned your first 50 Light XP</small>
                <span className="badge-status">{wallet.xp >= 50 ? 'Unlocked' : 'In Progress'}</span>
              </div>
              <div className={`achievement-badge-card ${completedModulesCount >= 1 ? 'unlocked' : 'locked'}`}>
                <span className="badge-icon" aria-hidden="true">🗺️</span>
                <strong>Eden Pioneer</strong>
                <small>Complete your first full study module</small>
                <span className="badge-status">{completedModulesCount >= 1 ? 'Unlocked' : 'In Progress'}</span>
              </div>
              <div className={`achievement-badge-card ${dailySummary.streak >= 3 ? 'unlocked' : 'locked'}`}>
                <span className="badge-icon" aria-hidden="true">🔥</span>
                <strong>Faithful Flame</strong>
                <small>Maintain a 3-day learning streak</small>
                <span className="badge-status">{dailySummary.streak >= 3 ? 'Unlocked' : 'In Progress'}</span>
              </div>
              <div className={`achievement-badge-card ${totalSubLessonsCompleted >= 5 ? 'unlocked' : 'locked'}`}>
                <span className="badge-icon" aria-hidden="true">📜</span>
                <strong>Scripture Scout</strong>
                <small>Finish 5 sub-lessons across any module</small>
                <span className="badge-status">{totalSubLessonsCompleted >= 5 ? 'Unlocked' : 'In Progress'}</span>
              </div>
              <div className={`achievement-badge-card ${wallet.coins >= 50 ? 'unlocked' : 'locked'}`}>
                <span className="badge-icon" aria-hidden="true">🪙</span>
                <strong>Coin Collector</strong>
                <small>Accumulate 50 Lantern Coins</small>
                <span className="badge-status">{wallet.coins >= 50 ? 'Unlocked' : 'In Progress'}</span>
              </div>
              <div className={`achievement-badge-card ${currentLvl >= 5 ? 'unlocked' : 'locked'}`}>
                <span className="badge-icon" aria-hidden="true">🦁</span>
                <strong>Lion Guardian</strong>
                <small>Reach Adventurer Level 5</small>
                <span className="badge-status">{currentLvl >= 5 ? 'Unlocked' : 'In Progress'}</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── TOASTS & MODALS ── */}
      {helpNotice && (
        <div className="child-help-confirmation" role="status">
          <span>✓</span>
          <p>{helpNotice}</p>
          <button type="button" onClick={() => setHelpNotice('')}>Close</button>
        </div>
      )}

      {showHelp && (
        <div className="help-overlay" role="presentation" onClick={() => setShowHelp(false)}>
          <section
            className="help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button ref={closeHelpRef} className="close-help" aria-label="Close help" onClick={() => setShowHelp(false)}>
              ×
            </button>
            <p className="child-kicker">You did the right thing</p>
            <h2 id="help-title">What kind of help do you need?</h2>
            <p>A trusted grown-up will see your message. You won’t get in trouble for asking.</p>
            <div>
              <button type="button" onClick={() => submitHelp('Something feels wrong')}>Something feels wrong</button>
              <button type="button" onClick={() => submitHelp('Stuck in an activity')}>I’m stuck in an activity</button>
              <button type="button" onClick={() => submitHelp('Wants their parent')}>I want my parent</button>
            </div>
            <small>If you feel unsafe right now, leave the device and find a trusted grown-up near you.</small>
          </section>
        </div>
      )}

      {/* ── Classroom Code Modal ── */}
      {showClassModal && (
        <div className="help-overlay" role="presentation" onClick={() => setShowClassModal(false)}>
          <section className="help-dialog classroom-connect-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="close-help" aria-label="Close" onClick={() => setShowClassModal(false)}>×</button>
            <div className="classroom-modal-badge"><span aria-hidden="true">🏫</span></div>
            <p className="child-kicker">Sunday School &amp; Classroom</p>
            <h2>Connect with your Teacher</h2>
            <p className="classroom-modal-lead">
              Enter the join code given to you by your Sunday School teacher or Christian school leader.
            </p>

            {connectedClass ? (
              <div className="classroom-active-box">
                <div className="active-class-meta">
                  <span>Currently connected:</span>
                  <strong>{connectedClass.name} ({connectedClass.ageBand})</strong>
                  <small>Teacher: {connectedClass.teacher} · Code: {connectedClass.code}</small>
                </div>
                {!isPreview && (
                  <button className="classroom-disconnect-btn" onClick={disconnectClassroom}>
                    Disconnect from this class
                  </button>
                )}
              </div>
            ) : isPreview ? (
              <p className="classroom-error">Connecting to a classroom isn’t available in preview mode.</p>
            ) : (
              <div className="classroom-input-card">
                <label>
                  Classroom Join Code
                  <input
                    value={classCodeInput}
                    onChange={(e) => { setClassCodeInput(e.target.value.toUpperCase()); setClassError(''); }}
                    placeholder="e.g. LION-482 or LAMP-731"
                    maxLength={12}
                  />
                </label>
                {classError && <p className="classroom-error" role="alert">{classError}</p>}
                <div className="classroom-code-hints">
                  <span>Demo codes available to try:</span>
                  <button type="button" onClick={() => setClassCodeInput('LION-482')}>LION-482 (Wed Explorers)</button>
                  <button type="button" onClick={() => setClassCodeInput('LAMP-731')}>LAMP-731 (Teen Circle)</button>
                </div>
                <button className="button button-primary classroom-submit-btn" onClick={connectClassroom}>
                  Connect to classroom
                </button>
              </div>
            )}

            <button className="family-text-button modal-cancel-link" onClick={() => setShowClassModal(false)}>
              Close
            </button>
          </section>
        </div>
      )}

      {/* ── Family Profile Summary Modal ── */}
      {showFamilyModal && (
        <div className="help-overlay" role="presentation" onClick={() => setShowFamilyModal(false)}>
          <section className="help-dialog family-summary-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="close-help" aria-label="Close" onClick={() => setShowFamilyModal(false)}>×</button>
            <div className="family-modal-badge"><span aria-hidden="true">🦁</span></div>
            <p className="child-kicker">Our Family Squad</p>
            <h2>{familyData.familyName}</h2>
            <p className="family-modal-lead">
              Hello <b>{child.name}</b>! Here is how your family is shining in the Bible club together.
            </p>

            <div className="family-modal-meta">
              <div><span>Parent / Guardian:</span> <strong>{familyData.parentName}</strong></div>
              <div><span>Home Country:</span> <strong>{familyData.country}</strong></div>
              <div><span>Family Members:</span> <strong>{children.length} profiles</strong></div>
            </div>

            <div className="family-modal-scores">
              <p className="family-modal-scores-title">Family Member Scoreboard</p>
              <div className="family-modal-child-grid">
                {children.map((c) => {
                  const stats = statsForChild(c);
                  const isCurrent = c.id === activeId;
                  return (
                    <article key={c.id} className={`family-score-card ${isCurrent ? 'current' : ''}`}>
                      <span className="fam-card-avatar">{c.name.slice(0, 1)}</span>
                      <div className="fam-card-info">
                        <strong>
                          {c.name} {isCurrent && <em className="you-tag">(You)</em>}
                        </strong>
                        <small>{trackEmoji[stats.track]} {trackLabel[stats.track]}</small>
                      </div>
                      <div className="fam-card-points">
                        <b>★ {stats.points}</b>
                        <small>{stats.done} lessons finished</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="family-modal-safety-note">
              <span>🛡️ Family Safety Summary</span>
              <p>
                Children have no open chat or public profiles. All progress stays private within your family and connected teachers.
              </p>
            </aside>

            <button className="button button-primary family-modal-close-btn" onClick={() => setShowFamilyModal(false)}>
              Back to my club →
            </button>
          </section>
        </div>
      )}

      {!isPreview && <ChatAssistant mode="child" name={child.name} onSafetyFlag={handleChatSafetyFlag} />}
    </main>
  );
}
