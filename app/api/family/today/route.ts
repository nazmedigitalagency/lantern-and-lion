import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { activityDateKey, notifyOnce } from '../../../lib/activity/server';
import { getStreakCalendar, getStreakStatus } from '../../../lib/streak/server';
import { getConceptMasteryForChild, summarizeMastery } from '../../../lib/adaptive/server';
import { getStory } from '../../../stories/catalog';

function formatActiveTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a parent first.' }, { status: 401 });
  }

  const admin = createServerAdminClient();
  const { data: family } = await admin.from('families').select('id, timezone').eq('owner_id', user.id).maybeSingle();
  if (!family) {
    return NextResponse.json({ children: [] });
  }

  const { data: children } = await admin.from('children').select('id, name, username, age, avatar').eq('family_id', family.id);
  if (!children || children.length === 0) {
    return NextResponse.json({ children: [] });
  }

  const timezone = family.timezone || 'UTC';
  const todayKey = activityDateKey(timezone);
  const childIds = children.map((c) => c.id);

  const { data: summaries } = await admin
    .from('daily_activity_summary')
    .select('*')
    .in('child_id', childIds)
    .eq('activity_date', todayKey);

  // Over-fetch a 36h window rather than computing an exact timezone-aware
  // midnight boundary in Node; the client renders each timestamp in the
  // family's timezone, so a little overlap at the edge is a cosmetic
  // no-op, not a correctness issue for the daily *counts* (those come
  // from `daily_activity_summary`, which is bucketed correctly server-side).
  const windowStart = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
  const { data: events } = await admin
    .from('activity_events')
    .select('id, child_id, event_type, occurred_at, metadata')
    .in('child_id', childIds)
    .gte('occurred_at', windowStart)
    .order('occurred_at', { ascending: false })
    .limit(150);

  const { data: storyRows } = await admin
    .from('story_progress')
    .select('child_id, story_id, status, completed_at')
    .in('child_id', childIds);

  const result = await Promise.all(children.map(async (child) => {
    const track = child.age >= 13 ? 'teen' : child.age <= 7 ? 'early' : 'pathfinder';
    const [streak, calendar, masteryRows] = await Promise.all([
      getStreakStatus(admin, child.id, timezone),
      getStreakCalendar(admin, child.id, timezone, 7),
      getConceptMasteryForChild(admin, child.id),
    ]);
    const daysActiveThisWeek = calendar.filter((d) => d.state === 'complete' || d.state === 'grace').length;
    const learning = summarizeMastery(masteryRows, track);

    return {
      child: { id: child.id, name: child.name, username: child.username, age: child.age, avatar: child.avatar },
      summary: summaries?.find((s) => s.child_id === child.id) || null,
      timeline: (events || [])
        .filter((e) => e.child_id === child.id && activityDateKey(timezone, new Date(e.occurred_at)) === todayKey)
        .map((e) => ({ eventType: e.event_type, occurredAt: e.occurred_at, metadata: e.metadata })),
      streak: { ...streak, daysActiveThisWeek, weekCalendar: calendar },
      learning: { strengths: learning.strengths, needsPractice: learning.needsPractice, dueReviewCount: learning.dueReviews.length },
      stories: (storyRows || [])
        .filter((row) => row.child_id === child.id && row.status === 'completed')
        .map((row) => ({ storyId: row.story_id, title: getStory(row.story_id)?.title || row.story_id, completedAt: row.completed_at }))
        .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()),
    };
  }));

  // Opportunistically send one "yesterday's learning" summary per child per
  // day — dedup'd server-side, so this is safe to run on every dashboard load.
  for (const child of children) {
    const { data: yesterday } = await admin
      .from('daily_activity_summary')
      .select('activity_date, active_seconds, games_completed, lessons_completed, quests_completed, xp_earned')
      .eq('child_id', child.id)
      .lt('activity_date', todayKey)
      .order('activity_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (yesterday && (yesterday.active_seconds > 0 || yesterday.games_completed > 0 || yesterday.lessons_completed > 0)) {
      await notifyOnce(admin, {
        recipientId: user.id,
        childId: child.id,
        type: 'DAILY_SUMMARY',
        title: `${child.name}'s day on Lantern & Lion`,
        body: `${child.name} spent ${formatActiveTime(yesterday.active_seconds)} actively learning, completed ${yesterday.games_completed} game${yesterday.games_completed === 1 ? '' : 's'} and ${yesterday.quests_completed} quest${yesterday.quests_completed === 1 ? '' : 's'}, and earned ${yesterday.xp_earned} XP.`,
        payload: yesterday,
        dedupeKey: `daily_summary:${child.id}:${yesterday.activity_date}`,
      });
    }
  }

  return NextResponse.json({ timezone, date: todayKey, children: result });
}
