'use client';

import { useMemo, useState } from 'react';
import { useDialogA11y } from '../lib/use-dialog';
import { getDailyScrambleWord, getDailyVerse } from './catalog';
import type { ChestReward, DailyQuestTemplate, HistoryEntry } from './types';

export function StreakBadge({ current, longest }: { current: number; longest: number }) {
  return (
    <div className="daily-streak-badge">
      <span aria-hidden="true">🔥</span>
      <div>
        <strong>{current} day{current === 1 ? '' : 's'} streak</strong>
        <small>Best: {longest} day{longest === 1 ? '' : 's'}</small>
      </div>
    </div>
  );
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekStrip({ days }: { days: HistoryEntry[] }) {
  return (
    <div className="daily-week-strip" role="img" aria-label="This week's activity">
      {days.map((day, index) => {
        const weekday = new Date(`${day.date}T00:00:00`).getDay();
        const label = WEEKDAY_LABELS[(weekday + 6) % 7];
        return (
          <div key={day.date} className={`daily-week-day ${day.completed ? 'done' : ''}`}>
            <small>{label}</small>
            <span aria-hidden="true">{day.completed ? '✓' : '○'}</span>
            {index === days.length - 1 && <em className="daily-week-today">Today</em>}
          </div>
        );
      })}
    </div>
  );
}

export function QuestRow({
  template,
  completed,
  onOpen,
}: {
  template: DailyQuestTemplate;
  completed: boolean;
  onOpen: () => void;
}) {
  return (
    <article className={`daily-quest-row ${completed ? 'done' : ''}`}>
      <span className="daily-quest-icon" aria-hidden="true">{completed ? '✅' : template.icon}</span>
      <div className="daily-quest-body">
        <strong>{template.title}</strong>
        <small>{template.description}</small>
      </div>
      <div className="daily-quest-side">
        <span className="daily-quest-xp">+{template.xp} XP</span>
        {!completed && (
          <button type="button" className="button button-secondary daily-quest-btn" onClick={onOpen}>
            {template.completionMode === 'verse-recall' || template.completionMode === 'word-scramble' ? 'Play' : 'Go'}
          </button>
        )}
      </div>
    </article>
  );
}

export function DailyCompleteBanner() {
  return (
    <section className="daily-complete-banner">
      <span aria-hidden="true">🎉</span>
      <div>
        <strong>Daily Quests complete!</strong>
        <p>Come back tomorrow for a brand new set of quests.</p>
      </div>
    </section>
  );
}

function shuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let random = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    random = (random * 9301 + 49297) % 233280;
    const j = Math.floor((random / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Tap the verse's words back into the correct order — a small, self-contained recall check. */
export function VerseRecallWidget({ dateKey, onComplete }: { dateKey: string; onComplete: () => void }) {
  const verse = useMemo(() => getDailyVerse(dateKey), [dateKey]);
  const words = useMemo(() => verse.text.replace(/[.,]/g, '').split(' '), [verse]);
  const [bank, setBank] = useState(() => shuffle(words.map((w, i) => ({ w, i })), words.length));
  const [chosen, setChosen] = useState<{ w: string; i: number }[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);

  function pick(item: { w: string; i: number }) {
    if (item.i === chosen.length) {
      const nextChosen = [...chosen, item];
      setChosen(nextChosen);
      setBank((prev) => prev.filter((b) => b.i !== item.i));
      if (nextChosen.length === words.length) window.setTimeout(onComplete, 500);
    } else {
      setWrongFlash(true);
      window.setTimeout(() => setWrongFlash(false), 350);
    }
  }

  return (
    <div className="daily-widget">
      <p className="daily-widget-ref">{verse.reference}</p>
      <p className={`daily-widget-target ${wrongFlash ? 'shake' : ''}`}>
        {words.map((w, i) => (
          <span key={i} className={i < chosen.length ? 'filled' : 'blank'}>{i < chosen.length ? chosen[i].w : '•••'}</span>
        ))}
      </p>
      <div className="daily-widget-bank">
        {bank.map((item) => (
          <button key={item.i} type="button" onClick={() => pick(item)}>{item.w}</button>
        ))}
      </div>
      <p className="daily-widget-hint">Tap the words in the order they appear in the verse.</p>
    </div>
  );
}

/** Tap the letters back into order to spell today's word. */
export function WordScrambleWidget({ dateKey, onComplete }: { dateKey: string; onComplete: () => void }) {
  const word = useMemo(() => getDailyScrambleWord(dateKey), [dateKey]);
  const letters = useMemo(() => word.split(''), [word]);
  const [bank, setBank] = useState(() => shuffle(letters.map((l, i) => ({ l, i })), letters.length + 7));
  const [chosen, setChosen] = useState<{ l: string; i: number }[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);

  function pick(item: { l: string; i: number }) {
    if (item.i === chosen.length) {
      const nextChosen = [...chosen, item];
      setChosen(nextChosen);
      setBank((prev) => prev.filter((b) => b.i !== item.i));
      if (nextChosen.length === letters.length) window.setTimeout(onComplete, 500);
    } else {
      setWrongFlash(true);
      window.setTimeout(() => setWrongFlash(false), 350);
    }
  }

  function reset() {
    setChosen([]);
    setBank(shuffle(letters.map((l, i) => ({ l, i })), letters.length + 7));
  }

  return (
    <div className="daily-widget">
      <p className={`daily-widget-target daily-widget-word ${wrongFlash ? 'shake' : ''}`}>
        {letters.map((_, i) => (
          <span key={i} className={i < chosen.length ? 'filled' : 'blank'}>{i < chosen.length ? chosen[i].l : '_'}</span>
        ))}
      </p>
      <div className="daily-widget-bank">
        {bank.map((item) => (
          <button key={item.i} type="button" onClick={() => pick(item)}>{item.l}</button>
        ))}
      </div>
      <div className="daily-widget-actions">
        <p className="daily-widget-hint">Tap the letters in order to spell today’s Bible word.</p>
        {chosen.length > 0 && <button type="button" className="family-text-button" onClick={reset}>Start over</button>}
      </div>
    </div>
  );
}

export function ChestModal({ reward, onClose }: { reward: ChestReward; onClose: () => void }) {
  const dialogRef = useDialogA11y<HTMLElement>(true, onClose);
  return (
    <div className="help-overlay" role="presentation">
      <section ref={dialogRef} className="help-dialog daily-chest-dialog" role="dialog" aria-modal="true" aria-labelledby="chest-title">
        <span className="daily-chest-icon" aria-hidden="true">🎁</span>
        <p className="child-kicker">Daily quests complete</p>
        <h2 id="chest-title">Your chest is open!</h2>
        <div className="daily-chest-rewards">
          <span className="daily-chest-reward-chip">✨ +{reward.xp} XP</span>
          <span className="daily-chest-reward-chip">🪙 +{reward.coins} coins</span>
          {reward.gems > 0 && <span className="daily-chest-reward-chip">💎 +{reward.gems} gem{reward.gems === 1 ? '' : 's'}</span>}
        </div>
        <p className="daily-chest-note">Come back tomorrow for a brand new set of quests and another chest.</p>
        <button type="button" className="button button-primary daily-chest-continue" onClick={onClose}>Nice!</button>
      </section>
    </div>
  );
}
