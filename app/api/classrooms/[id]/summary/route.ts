import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { activityDateKey } from '../../../../lib/activity/server';
import { getStreakCalendar, getStreakStatus } from '../../../../lib/streak/server';
import { getConceptMasteryForChild } from '../../../../lib/adaptive/server';
import { getConcept } from '../../../../lib/adaptive/concepts';
import { STORY_CATALOG } from '../../../../stories/catalog';

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
  let students: Array<{ id: string; name: string; age: number; needsHelp: boolean; lastLoginAt: string | null; today: { active_seconds: number; games_completed: number; lessons_completed: number; quests_completed: number; xp_earned: number }; currentStreak: number; weeklyConsistency: number; masteryPercent: number }> = [];
  const classConceptScores = new Map<string, number[]>();

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

      const masteryRows = await getConceptMasteryForChild(admin, child.id);
      for (const row of masteryRows) {
        const list = classConceptScores.get(row.concept_id) || [];
        list.push(row.mastery_score);
        classConceptScores.set(row.concept_id, list);
      }
      const masteryPercent = masteryRows.length ? Math.round(masteryRows.reduce((sum, m) => sum + m.mastery_score, 0) / masteryRows.length) : 0;

      return {
        id: child.id,
        name: child.name,
        age: child.age,
        needsHelp: r.needs_help,
        lastLoginAt: lastLogins[child.id] || null,
        today: summaries[child.id] || { active_seconds: 0, games_completed: 0, lessons_completed: 0, quests_completed: 0, xp_earned: 0 },
        currentStreak: streak.currentStreak,
        weeklyConsistency,
        masteryPercent,
      };
    }));
  }

  // Classroom-level insight: which concept the class handles best/needs help
  // with, aggregated from every approved student — never singles out one
  // child by name as "worst," only the concept itself.
  const conceptAverages = Array.from(classConceptScores.entries())
    .map(([conceptId, scores]) => ({ conceptId, label: getConcept(conceptId)?.label || conceptId, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
    .filter((c) => classConceptScores.get(c.conceptId)!.length >= Math.min(3, students.length || 1));
  const mostMastered = [...conceptAverages].sort((a, b) => b.avg - a.avg)[0] || null;
  const needsReinforcement = [...conceptAverages].sort((a, b) => a.avg - b.avg)[0] || null;

  let storyInsight: { storyId: string; title: string; completedCount: number; percent: number }[] = [];
  if (childIds.length > 0) {
    const { data: storyRows } = await admin
      .from('story_progress')
      .select('child_id, story_id')
      .in('child_id', childIds)
      .eq('status', 'completed');

    storyInsight = STORY_CATALOG.map((story) => {
      const completedCount = (storyRows || []).filter((r) => r.story_id === story.id).length;
      return {
        storyId: story.id,
        title: story.title,
        completedCount,
        percent: students.length ? Math.round((completedCount / students.length) * 100) : 0,
      };
    });
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
    classInsight: { mostMastered, needsReinforcement },
    storyInsight,
    students,
  });
}
