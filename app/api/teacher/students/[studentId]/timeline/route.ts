import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../../lib/supabase/server';
import { getStreakStatus } from '../../../../../lib/streak/server';
import { getConceptMasteryForChild, summarizeMastery } from '../../../../../lib/adaptive/server';
import { getLevelInfo } from '../../../../../lib/xp-levels';
import { ageGroupForAge, buildNeedsAttention, computeActivityStatus } from '../../../../../lib/classrooms/server';
import { computeStudentTimeline } from '../../../../../lib/timeline/aggregate';
import type { TimelineRange } from '../../../../../lib/timeline/types';
import type { StudentCard, StudentClassroomRef } from '../../../../../lib/classrooms/types';
import type { CurriculumModule } from '../../../../../curriculum-data';

type ChildRow = { id: string; name: string; age: number; family_id: string; last_login_at: string | null };
type RosterRow = { classroom_id: string; approved: boolean; needs_help: boolean; children: ChildRow | null };

const VALID_RANGES: TimelineRange[] = ['today', 'week', 'month', 'custom'];

/**
 * Student Activity & Progress Timeline (Feature 7). Same authorization as
 * the student detail route: the child must be an approved member of one of
 * this teacher's own classrooms — never derived from the URL alone.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ studentId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { studentId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get('range') || 'week';
  const range: TimelineRange = VALID_RANGES.includes(rangeParam as TimelineRange) ? (rangeParam as TimelineRange) : 'week';
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const admin = createServerAdminClient();

  const { data: classrooms } = await admin.from('classrooms').select('id').eq('teacher_id', user.id);
  const classroomIds = (classrooms || []).map((c) => c.id);
  if (classroomIds.length === 0) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  const { data: membershipsRaw } = await admin
    .from('classroom_students')
    .select('classroom_id, approved, needs_help, children(id, name, age, family_id, last_login_at)')
    .eq('child_id', studentId)
    .in('classroom_id', classroomIds);

  const memberships = ((membershipsRaw || []) as unknown as RosterRow[]).filter((m) => m.approved && m.children);
  if (memberships.length === 0) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  const child = memberships[0].children as ChildRow;
  const needsHelp = memberships.some((m) => m.needs_help);

  const { data: family } = await admin.from('families').select('timezone').eq('id', child.family_id).maybeSingle();
  const tz = family?.timezone || 'UTC';
  const track: CurriculumModule['track'] = child.age >= 13 ? 'teen' : child.age <= 7 ? 'early' : 'pathfinder';

  const [streak, masteryRows] = await Promise.all([getStreakStatus(admin, child.id, tz), getConceptMasteryForChild(admin, child.id)]);
  const { data: dailyForXp } = await admin.from('daily_activity_summary').select('xp_earned').eq('child_id', child.id);
  const xp = (dailyForXp || []).reduce((sum, r) => sum + (r.xp_earned || 0), 0);
  const level = getLevelInfo(xp);
  const masteryPercent = masteryRows.length ? Math.round(masteryRows.reduce((sum, m) => sum + m.mastery_score, 0) / masteryRows.length) : 0;
  const learning = summarizeMastery(masteryRows, track);
  const strugglingLabels = masteryRows.filter((m) => m.status === 'needs_reinforcement').map((m) => m.concept_id);
  const activityStatus = computeActivityStatus(child.last_login_at);
  const { needsAttention, reasons } = buildNeedsAttention({
    lastActiveAt: child.last_login_at,
    needsHelp,
    streakEndedRecently: streak.streakEndedRecently,
    strugglingConceptLabels: strugglingLabels,
  });

  const classroomRefs: StudentClassroomRef[] = [];
  const card: StudentCard = {
    id: child.id,
    name: child.name,
    age: child.age,
    ageGroup: ageGroupForAge(child.age),
    classrooms: classroomRefs,
    xp,
    level: level.level,
    levelTitle: level.title,
    currentStreak: streak.currentStreak,
    weeklyActiveDays: 0,
    masteryPercent,
    masteryTracked: masteryRows.length > 0,
    lastActiveAt: child.last_login_at,
    activityStatus,
    needsHelp,
    needsAttention,
    needsAttentionReasons: reasons,
  };

  const timeline = await computeStudentTimeline(admin, child.id, child.name, tz, track, card, masteryRows, learning.strengths, streak.currentStreak, range, start, end);

  return NextResponse.json(timeline);
}
