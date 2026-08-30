'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasActiveSession, loadWorldContext, readActiveProfile, type PlayerProfile } from '../adventure/storage';
import type { WorldContext } from '../adventure/progression';
import { GameHUD, XPToastStack } from '../lib/economy/components';
import { getWallet } from '../lib/economy/wallet-service';
import { getLevelInfo } from '../lib/xp-levels';
import { getTemplate } from './catalog';
import { ChestModal, DailyCompleteBanner, QuestRow, StreakBadge, VerseRecallWidget, WeekStrip, WordScrambleWidget } from './components';
import { getCompletedCount, isSetFullyComplete } from './progression';
import { useDailySync } from './use-daily-sync';

export default function DailyQuestsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ctx, setCtx] = useState<WorldContext>({ moduleProgress: {}, masteredQuestIds: [], kind: 'child' });
  const [openWidgetId, setOpenWidgetId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasActiveSession()) { window.location.href = '/'; return; }
      const activeProfile = readActiveProfile();
      setProfile(activeProfile);
      setCtx(loadWorldContext(activeProfile.id, activeProfile.kind));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const { set, weekStrip, streak, toasts, dismissToast, chestReveal, dismissChest, completeManual } = useDailySync(profile?.id ?? null, ctx);
  const wallet = profile ? getWallet(profile.id) : { xp: 0, coins: 0, gems: 0 };
  const levelInfo = getLevelInfo(wallet.xp);
  const dashboardHref = profile?.kind === 'teen' ? '/teen-dashboard' : '/child-dashboard';

  function handleWidgetComplete(templateId: string) {
    setOpenWidgetId(null);
    completeManual(templateId);
  }

  if (!hydrated || !profile || !set) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        <span></span>
        <p>Opening today’s quests…</p>
      </main>
    );
  }

  const completedCount = getCompletedCount(set);
  const allDone = isSetFullyComplete(set);

  return (
    <main className="adventure-page daily-page">
      <header className="child-topbar adv-topbar">
        <Link href={dashboardHref} className="child-logo">
          <Image src="/lantern-lion-logo.png" alt="" width={54} height={54} priority />
          <span>
            <strong>Today’s Quests</strong>
            <small>Lantern &amp; Lion</small>
          </span>
        </Link>
        <div className="adv-topbar-center">
          <GameHUD level={levelInfo.level} wallet={wallet} />
        </div>
        <div className="child-header-actions">
          <Link href={dashboardHref} className="help-button">← Back to dashboard</Link>
        </div>
      </header>

      <div className="adv-body daily-body">
        <div className="daily-intro">
          <p className="child-kicker">Hi, {profile.name}</p>
          <h1>Ready for today’s adventure?</h1>
          <p>{allDone ? 'Every quest is done for today — wonderful work.' : `${completedCount} of ${set.quests.length} quests complete so far.`}</p>
        </div>

        <section className="daily-hero">
          <StreakBadge current={streak.current} longest={streak.longest} />
          <WeekStrip days={weekStrip} />
        </section>

        {allDone && <DailyCompleteBanner />}

        <div className="daily-quest-list">
          {set.quests.map((instance) => {
            const template = getTemplate(instance.templateId);
            if (!template) return null;
            const isWidget = template.completionMode === 'verse-recall' || template.completionMode === 'word-scramble';
            const isOpen = openWidgetId === template.id;

            return (
              <div key={template.id} className="daily-quest-slot">
                <QuestRow
                  template={template}
                  completed={instance.completed}
                  onOpen={() => {
                    if (isWidget) setOpenWidgetId(isOpen ? null : template.id);
                  }}
                />
                {!instance.completed && !isWidget && (
                  <Link href={template.completionMode === 'arcade-session' ? '/arcade' : '/adventure'} className="daily-quest-inline-link">
                    {template.completionMode === 'arcade-session' ? 'Open Lantern Arcade →' : 'Open Adventure World →'}
                  </Link>
                )}
                {isWidget && isOpen && !instance.completed && (
                  <div className="daily-widget-panel">
                    {template.completionMode === 'verse-recall' ? (
                      <VerseRecallWidget dateKey={set.date} onComplete={() => handleWidgetComplete(template.id)} />
                    ) : (
                      <WordScrambleWidget dateKey={set.date} onComplete={() => handleWidgetComplete(template.id)} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <XPToastStack toasts={toasts} onDismiss={dismissToast} />
      {chestReveal && <ChestModal reward={chestReveal} onClose={dismissChest} />}
    </main>
  );
}
