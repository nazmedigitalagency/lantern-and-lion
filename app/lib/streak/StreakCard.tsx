'use client';

import { useState } from 'react';
import type { StreakStatus } from './server';

type CalendarDay = { date: string; state: 'complete' | 'grace' | 'pending' | 'none' };

const DAY_SYMBOL: Record<CalendarDay['state'], string> = {
  complete: '✓',
  grace: '🛡️',
  pending: '○',
  none: '○',
};

const DAY_LABEL: Record<CalendarDay['state'], string> = {
  complete: 'Completed',
  grace: 'Protected by a Grace Day',
  pending: 'Today — not yet complete',
  none: 'No activity',
};

export function StreakCard({
  streak,
  tone = 'child',
  onFetchCalendar,
}: {
  streak: StreakStatus;
  tone?: 'child' | 'teen';
  onFetchCalendar: () => Promise<CalendarDay[]>;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendar, setCalendar] = useState<CalendarDay[] | null>(null);

  async function openCalendar() {
    setShowCalendar(true);
    if (!calendar) setCalendar(await onFetchCalendar());
  }

  const heading = tone === 'teen' ? `${streak.currentStreak}-day learning streak` : `${streak.currentStreak} DAY STREAK`;

  return (
    <section className={`streak-card streak-card-${tone}`} aria-label="Learning streak">
      <div className="streak-card-top">
        <span className="streak-flame" aria-hidden="true">🔥</span>
        <div>
          <strong>{heading}</strong>
          <p>
            {streak.todayQualified
              ? tone === 'teen' ? 'Today’s goal: complete.' : 'Complete! Come back tomorrow to keep it going.'
              : tone === 'teen' ? 'Complete one learning activity today.' : 'Complete one learning activity today to continue your streak.'}
          </p>
        </div>
      </div>

      <div className="streak-card-status" role="status">
        {streak.todayQualified ? (
          <span className="streak-status-done">✓ Streak saved today</span>
        ) : (
          <span className="streak-status-pending">○ Today’s goal not started</span>
        )}
      </div>

      <dl className="streak-card-stats">
        <div>
          <dt>Longest</dt>
          <dd>{streak.longestStreak} day{streak.longestStreak === 1 ? '' : 's'}</dd>
        </div>
        <div>
          <dt>Grace Days</dt>
          <dd>🛡️ {streak.graceDays}</dd>
        </div>
        {streak.nextMilestone && (
          <div>
            <dt>Next milestone</dt>
            <dd>{streak.nextMilestone.days} days</dd>
          </div>
        )}
      </dl>

      {streak.streakEndedRecently && (
        <p className="streak-ended-note">Your streak has ended, but your learning journey hasn’t. Start a new one today!</p>
      )}

      <button type="button" className="streak-view-button" onClick={openCalendar}>View streak</button>

      {showCalendar && (
        <div className="streak-calendar-panel" role="dialog" aria-label="Streak calendar">
          <div className="streak-calendar-head">
            <span>This week</span>
            <button type="button" aria-label="Close streak calendar" onClick={() => setShowCalendar(false)}>×</button>
          </div>
          {!calendar ? (
            <p>Loading…</p>
          ) : (
            <ul className="streak-calendar-days">
              {calendar.map((day) => (
                <li key={day.date} title={DAY_LABEL[day.state]}>
                  <span aria-hidden="true">{DAY_SYMBOL[day.state]}</span>
                  <small>{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</small>
                  <span className="sr-only">{DAY_LABEL[day.state]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
