import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { getStreakCalendar, getStreakStatus } from '../../../../lib/streak/server';
import { getConceptMasteryForChild, summarizeMastery } from '../../../../lib/adaptive/server';
import { getConcept } from '../../../../lib/adaptive/concepts';
import { getLevelInfo } from '../../../../lib/xp-levels';
import { getStory } from '../../../../stories/catalog';
import { ageGroupForAge, buildNeedsAttention, computeActivityStatus } from '../../../../lib/classrooms/server';
import type { StudentActivityItem, StudentCard, StudentClassroomRef } from '../../../../lib/classrooms/types';
import type { CurriculumModule } from '../../../../curriculum-data';

type ChildRow = { id: string; name: string; age: number; family_id: string; last_login_at: string | null };
type RosterRow = { classroom_id: string; approved: boolean; needs_help: boolean; children: ChildRow | null };

/**
 * Full detail drill-down for one student, reusing exactly the same building
 * blocks as GET /api/family/today (the parent's per-child view): streak
 * status/calendar, concept mastery + summarizeMastery for strengths/needs-
 * practice, and story completions. Nothing here is computed twice — the
 * teacher just sees the read-only rollup, same as a parent would.
 *
 * Authorization: the child must be an *approved* member of one of this
 * teacher's own classrooms — never derived from the URL alone.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ studentId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { studentId } = await ctx.params;
  const admin = createServerAdminClient();

  const { data: classrooms } = await admin.from('classrooms').select('id, name').eq('teacher_id', user.id);
  const classroomList = classrooms || [];
  const classroomIds = classroomList.map((c) => c.id);
  if (classroomIds.length === 0) {
    return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
  }

  const { data: membershipsRaw } = await admin
    .from('classroom_students')
    .select('classroom_id, approved, needs_help, children(id, name, age, family_id, last_login_at)')
    .eq('child_id', studentId)
    .in('classroom_id', classroomIds);

  const memberships = ((membershipsRaw || []) as unknown as RosterRow[]).filter((m) => m.approved && m.children);
  if (memberships.length === 0) {
    return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
  }

  const child = memberships[0].children as ChildRow;
  const needsHelp = memberships.some((m) => m.needs_help);
  const classroomRefs: StudentClassroomRef[] = memberships.map((m) => {
    const c = classroomList.find((cl) => cl.id === m.classroom_id);
    return { id: m.classroom_id, name: c?.name || 'Class' };
  });

  const { data: family } = await admin.from('families').select('timezone').eq('id', child.family_id).maybeSingle();
  const tz = family?.timezone || 'UTC';
  const track: CurriculumModule['track'] = child.age >= 13 ? 'teen' : child.age <= 7 ? 'early' : 'pathfinder';

  const [streak, calendar, masteryRows, dailyRows, storyRows, eventRows] = await Promise.all([
    getStreakStatus(admin, child.id, tz),
    getStreakCalendar(admin, child.id, tz, 7),
    getConceptMasteryForChild(admin, child.id),
    admin.from('daily_activity_summary').select('activity_date, games_completed, lessons_completed, quests_completed, xp_earned').eq('child_id', child.id).order('activity_date', { ascending: false }).limit(30),
    admin.from('story_progress').select('story_id, status, completed_at').eq('child_id', child.id).eq('status', 'completed'),
    admin.from('activity_events').select('event_type, occurred_at, metadata').eq('child_id', child.id).in('event_type', ['ACHIEVEMENT_EARNED', 'STREAK_EXTENDED']).order('occurred_at', { ascending: false }).limit(20),
  ]);

  const xp = (dailyRows.data || []).reduce((sum, r) => sum + (r.xp_earned || 0), 0);
  const level = getLevelInfo(xp);
  const weeklyActiveDays = calendar.filter((d) => d.state === 'complete' || d.state === 'grace').length;
  const masteryPercent = masteryRows.length ? Math.round(masteryRows.reduce((sum, m) => sum + m.mastery_score, 0) / masteryRows.length) : 0;
  const learning = summarizeMastery(masteryRows, track);
  const strugglingLabels = masteryRows.filter((m) => m.status === 'needs_reinforcement').map((m) => getConcept(m.concept_id)?.label || m.concept_id);

  const activityStatus = computeActivityStatus(child.last_login_at);
  const { needsAttention, reasons } = buildNeedsAttention({
    lastActiveAt: child.last_login_at,
    needsHelp,
    streakEndedRecently: streak.streakEndedRecently,
    strugglingConceptLabels: strugglingLabels,
  });

  const student: StudentCard = {
    id: child.id,
    name: child.name,
    age: child.age,
    ageGroup: ageGroupForAge(child.age),
    classrooms: classroomRefs,
    xp,
    level: level.level,
    levelTitle: level.title,
    currentStreak: streak.currentStreak,
    weeklyActiveDays,
    masteryPercent,
    masteryTracked: masteryRows.length > 0,
    lastActiveAt: child.last_login_at,
    activityStatus,
    needsHelp,
    needsAttention,
    needsAttentionReasons: reasons,
  };

  const stories = (storyRows.data || [])
    .map((r) => ({ storyId: r.story_id, title: getStory(r.story_id)?.title || r.story_id, completedAt: r.completed_at as string | null }))
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

  // Recent activity is built entirely from real, already-tracked rows —
  // day-level learning rollups, story completions, and milestone events —
  // never a raw click/technical event log.
  const dailyItems: StudentActivityItem[] = (dailyRows.data || [])
    .filter((r) => r.games_completed > 0 || r.lessons_completed > 0 || r.quests_completed > 0 || r.xp_earned > 0)
    .map((r) => {
      const parts: string[] = [];
      if (r.games_completed > 0) parts.push(`${r.games_completed} game${r.games_completed === 1 ? '' : 's'}`);
      if (r.lessons_completed > 0) parts.push(`${r.lessons_completed} lesson${r.lessons_completed === 1 ? '' : 's'}`);
      if (r.quests_completed > 0) parts.push(`${r.quests_completed} quest${r.quests_completed === 1 ? '' : 's'}`);
      let label = parts.length ? `Completed ${parts.join(', ')}` : 'Active learning day';
      if (r.xp_earned > 0) label += ` · earned ${r.xp_earned} XP`;
      return { id: `daily:${r.activity_date}`, occurredAt: `${r.activity_date}T12:00:00.000Z`, label, kind: 'daily' as const };
    });

  const storyItems: StudentActivityItem[] = stories
    .filter((s) => s.completedAt)
    .map((s) => ({ id: `story:${s.storyId}`, occurredAt: s.completedAt as string, label: `Completed “${s.title}”`, kind: 'story' as const }));

  const eventItems: StudentActivityItem[] = (eventRows.data || []).map((e, i) => {
    const meta = (e.metadata || {}) as { streakDay?: number };
    const isStreak = e.event_type === 'STREAK_EXTENDED';
    const label = isStreak
      ? `Reached a ${meta.streakDay ?? streak.currentStreak}-day learning streak`
      : 'Earned an achievement';
    return { id: `event:${i}:${e.occurred_at}`, occurredAt: e.occurred_at, label, kind: isStreak ? 'streak' : 'achievement' } satisfies StudentActivityItem;
  });

  const recentActivity = [...dailyItems, ...storyItems, ...eventItems]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 20);

  return NextResponse.json({
    student,
    longestStreak: streak.longestStreak,
    graceDays: streak.graceDays,
    weekCalendar: calendar,
    learning: {
      strengths: learning.strengths.map((s) => ({ conceptId: s.conceptId, label: s.label, masteryScore: s.masteryScore })),
      needsPractice: learning.needsPractice.map((s) => ({ conceptId: s.conceptId, label: s.label, masteryScore: s.masteryScore })),
      dueReviewCount: learning.dueReviews.length,
      conceptsTracked: masteryRows.length,
    },
    stories,
    recentActivity,
  });
}
