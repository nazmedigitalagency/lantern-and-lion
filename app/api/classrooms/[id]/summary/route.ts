import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { activityDateKey } from '../../../../lib/activity/server';
import { getStreakCalendar, getStreakStatus } from '../../../../lib/streak/server';

/**
 * Class overview + per-student drill-down for the Teacher Dashboard.
 * Scoped to the teacher's own classroom, and only to students a parent has
 * approved — never exposes unrelated students, parent details, or family data.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id: classroomId } = await ctx.params;
  const admin = createServerAdminClient();

  const { data: classroom } = await admin.from('classrooms').select('id, name, teacher_id').eq('id', classroomId).maybeSingle();
  if (!classroom || classroom.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  }

  const { data: roster } = await admin
    .from('classroom_students')
    .select('child_id, approved, needs_help, children(id, name, age, family_id)')
    .eq('classroom_id', classroomId);

  const approvedStudents = (roster || []).filter((r) => r.approved && r.children);
  const childIds = approvedStudents.map((r) => r.child_id);

  let summaries: Record<string, { active_seconds: number; games_completed: number; lessons_completed: number; quests_completed: number; xp_earned: number }> = {};
  const lastLogins: Record<string, string | null> = {};
  let timezoneByChild = new Map<string, string>();
  let students: Array<{ id: string; name: string; age: number; needsHelp: boolean; lastLoginAt: string | null; today: { active_seconds: number; games_completed: number; lessons_completed: number; quests_completed: number; xp_earned: number }; currentStreak: number; weeklyConsistency: number }> = [];

  if (childIds.length > 0) {
    const { data: families } = await admin.from('families').select('id, timezone').in(
      'id',
      approvedStudents.map((r) => (r.children as unknown as { family_id: string }).family_id)
    );
    // Group by each student's own family timezone, since a class can span families in different timezones.
    timezoneByChild = new Map(
      approvedStudents.map((r) => {
        const familyId = (r.children as unknown as { family_id: string }).family_id;
        const tz = families?.find((f) => f.id === familyId)?.timezone || 'UTC';
        return [r.child_id, tz];
      })
    );

    const { data: summaryRows } = await admin
      .from('daily_activity_summary')
      .select('child_id, activity_date, active_seconds, games_completed, lessons_completed, quests_completed, xp_earned')
      .in('child_id', childIds);

    summaries = Object.fromEntries(
      childIds.map((id) => {
        const todayKey = activityDateKey(timezoneByChild.get(id) || 'UTC');
        const row = summaryRows?.find((s) => s.child_id === id && s.activity_date === todayKey);
        return [id, {
          active_seconds: row?.active_seconds || 0,
          games_completed: row?.games_completed || 0,
          lessons_completed: row?.lessons_completed || 0,
          quests_completed: row?.quests_completed || 0,
          xp_earned: row?.xp_earned || 0,
        }];
      })
    );

    const { data: childRows } = await admin.from('children').select('id, last_login_at').in('id', childIds);
    for (const c of childRows || []) lastLogins[c.id] = c.last_login_at;

    students = await Promise.all(approvedStudents.map(async (r) => {
      const child = r.children as unknown as { id: string; name: string; age: number };
      const tz = timezoneByChild.get(r.child_id) || 'UTC';
      const [streak, calendar] = await Promise.all([
        getStreakStatus(admin, child.id, tz),
        getStreakCalendar(admin, child.id, tz, 7),
      ]);
      const weeklyConsistency = calendar.filter((d) => d.state === 'complete' || d.state === 'grace').length;

      return {
        id: child.id,
        name: child.name,
        age: child.age,
        needsHelp: r.needs_help,
        lastLoginAt: lastLogins[child.id] || null,
        today: summaries[child.id] || { active_seconds: 0, games_completed: 0, lessons_completed: 0, quests_completed: 0, xp_earned: 0 },
        currentStreak: streak.currentStreak,
        weeklyConsistency,
      };
    }));
  }

  const pendingCount = (roster || []).filter((r) => !r.approved).length;
  const activeToday = students.filter((s) => s.today.active_seconds > 0).length;
  const avgActiveSeconds = students.length ? Math.round(students.reduce((sum, s) => sum + s.today.active_seconds, 0) / students.length) : 0;

  return NextResponse.json({
    classroom: { id: classroom.id, name: classroom.name },
    overview: {
      studentCount: students.length,
      activeToday,
      avgActiveSeconds,
      gamesCompletedToday: students.reduce((sum, s) => sum + s.today.games_completed, 0),
      lessonsCompletedToday: students.reduce((sum, s) => sum + s.today.lessons_completed, 0),
      pendingApprovals: pendingCount,
    },
    students,
  });
}
