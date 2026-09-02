import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { computeStudentCards, type ChildRow } from '../../../lib/classrooms/roster';
import { ageGroupForAge } from '../../../lib/classrooms/server';
import { getConceptMasteryForChild } from '../../../lib/adaptive/server';
import { getConcept } from '../../../lib/adaptive/concepts';
import { getStory } from '../../../stories/catalog';
import type { ClassroomActivityItem, ClassroomDetailResponse, ClassroomLeaderboard, LeaderboardEntry, PendingStudent, StudentCard } from '../../../lib/classrooms/types';

type RosterRow = { child_id: string; approved: boolean; needs_help: boolean; joined_at: string; children: ChildRow | null };

/**
 * The classroom detail page: header, real (not fabricated) class stats, the
 * student roster (same StudentCard shape "My Students" uses), assignments
 * with completion read from real content-completion tables, a class-level
 * activity feed built only from meaningful learning events, and an
 * optional, positively-framed leaderboard. Reuses every helper the roster
 * and student-detail routes already established — nothing here recomputes
 * streaks, mastery, or XP a different way.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id: classroomId } = await ctx.params;
  const admin = createServerAdminClient();

  const { data: classroom } = await admin
    .from('classrooms')
    .select('id, name, description, age_band, meeting_day, meeting_time, code, created_at')
    .eq('id', classroomId)
    .eq('teacher_id', user.id)
    .maybeSingle();
  if (!classroom) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  const { data: rosterRaw } = await admin
    .from('classroom_students')
    .select('child_id, approved, needs_help, joined_at, children(id, name, age, family_id, last_login_at)')
    .eq('classroom_id', classroomId);
  const roster = ((rosterRaw || []) as unknown as RosterRow[]).filter((r) => r.children);

  const approvedRows = roster.filter((r) => r.approved);
  const pendingRows = roster.filter((r) => !r.approved);
  const approvedChildren = approvedRows.map((r) => r.children as ChildRow);
  const childIds = approvedChildren.map((c) => c.id);

  const needsHelpByChild = new Map(roster.map((r) => [r.child_id, r.needs_help]));
  const cardsByChild = await computeStudentCards(admin, approvedChildren, needsHelpByChild);
  const students: StudentCard[] = approvedChildren
    .map((c) => ({ ...cardsByChild.get(c.id)!, classrooms: [{ id: classroom.id, name: classroom.name }] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const pending: PendingStudent[] = pendingRows.map((r) => {
    const c = r.children as ChildRow;
    return { id: c.id, name: c.name, classrooms: [{ id: classroom.id, name: classroom.name }], joinedAt: r.joined_at || null };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Students already connected to this teacher (approved in any of their
  // other classrooms) but not yet part of *this* one — the picker for
  // "Add Students" never needs a fresh Teacher Code lookup for these.
  const { data: teacherClassrooms } = await admin.from('classrooms').select('id').eq('teacher_id', user.id);
  const otherClassroomIds = (teacherClassrooms || []).map((c) => c.id).filter((id) => id !== classroomId);
  const connectedElsewhere: ClassroomDetailResponse['connectedElsewhere'] = [];
  if (otherClassroomIds.length > 0) {
    const alreadyHere = new Set(roster.map((r) => r.child_id));
    const { data: elsewhereRows } = await admin
      .from('classroom_students')
      .select('child_id, children(id, name, age)')
      .in('classroom_id', otherClassroomIds)
      .eq('approved', true);
    const seen = new Set<string>();
    for (const row of elsewhereRows || []) {
      const child = row.children as unknown as { id: string; name: string; age: number } | null;
      if (!child || alreadyHere.has(child.id) || seen.has(child.id)) continue;
      seen.add(child.id);
      connectedElsewhere.push({ id: child.id, name: child.name, ageGroup: ageGroupForAge(child.age) });
    }
    connectedElsewhere.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Stats — every number here is a real aggregate of the roster/assignment
  // data above, never a placeholder.
  const studentCount = students.length;
  const activeThisWeek = students.filter((s) => s.weeklyActiveDays > 0).length;
  const trackedMastery = students.filter((s) => s.masteryTracked);
  const avgPerformance = trackedMastery.length ? Math.round(trackedMastery.reduce((sum, s) => sum + s.masteryPercent, 0) / trackedMastery.length) : 0;
  const avgLearningActivity = studentCount ? Math.round((students.reduce((sum, s) => sum + s.weeklyActiveDays, 0) / studentCount / 7) * 100) : 0;

  const { data: classroomAssignments } = await admin.from('assignments').select('id').eq('classroom_id', classroomId).eq('status', 'assigned');
  let assignmentsCompletedPercent: number | null = null;
  if (classroomAssignments && classroomAssignments.length > 0) {
    const { data: subs } = await admin.from('assignment_submissions').select('assignment_id, status').in('assignment_id', classroomAssignments.map((a) => a.id));
    const totals = new Map<string, { done: number; total: number }>();
    for (const s of subs || []) {
      const t = totals.get(s.assignment_id) || { done: 0, total: 0 };
      t.total += 1;
      if (s.status === 'submitted' || s.status === 'graded' || s.status === 'returned') t.done += 1;
      totals.set(s.assignment_id, t);
    }
    const percents = Array.from(totals.values()).filter((t) => t.total > 0).map((t) => (t.done / t.total) * 100);
    assignmentsCompletedPercent = percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : null;
  }

  // Class-level activity feed — aggregate "N students completed/practiced X
  // this week" lines plus a couple of individually-named recent completions,
  // exactly the two patterns the product calls for. Built only from
  // story_progress/concept_mastery timestamps — no raw technical events.
  const activity: ClassroomActivityItem[] = [];
  if (childIds.length > 0) {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const { data: recentStories } = await admin
      .from('story_progress')
      .select('child_id, story_id, completed_at, children(name)')
      .in('child_id', childIds)
      .eq('status', 'completed')
      .gte('completed_at', weekAgo)
      .order('completed_at', { ascending: false });

    const storyGroups = new Map<string, { count: number; latest: string }>();
    for (const row of recentStories || []) {
      const g = storyGroups.get(row.story_id) || { count: 0, latest: row.completed_at };
      g.count += 1;
      storyGroups.set(row.story_id, g);
    }
    for (const [storyId, g] of storyGroups) {
      const title = getStory(storyId)?.title || storyId;
      activity.push({ id: `story-agg:${storyId}`, occurredAt: g.latest, label: `${g.count} student${g.count === 1 ? '' : 's'} completed “${title}” this week.` });
    }
    // A couple of individually-named highlights, most recent first.
    for (const row of (recentStories || []).slice(0, 3)) {
      const name = (row.children as unknown as { name: string } | null)?.name;
      if (!name) continue;
      const title = getStory(row.story_id)?.title || row.story_id;
      activity.push({ id: `story:${row.child_id}:${row.story_id}`, occurredAt: row.completed_at as string, label: `${name} completed “${title}.”` });
    }

    const { data: recentPractice } = await admin
      .from('concept_mastery')
      .select('child_id, concept_id, last_practiced_at')
      .in('child_id', childIds)
      .gte('last_practiced_at', weekAgo);
    const conceptGroups = new Map<string, { count: number; latest: string }>();
    for (const row of recentPractice || []) {
      const g = conceptGroups.get(row.concept_id) || { count: 0, latest: row.last_practiced_at };
      g.count += 1;
      if (row.last_practiced_at > g.latest) g.latest = row.last_practiced_at;
      conceptGroups.set(row.concept_id, g);
    }
    const topConcepts = Array.from(conceptGroups.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 3);
    for (const [conceptId, g] of topConcepts) {
      const label = getConcept(conceptId)?.label || conceptId;
      activity.push({ id: `concept-agg:${conceptId}`, occurredAt: g.latest, label: `${g.count} student${g.count === 1 ? '' : 's'} practiced ${label}.` });
    }
  }
  activity.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  const trimmedActivity = activity.slice(0, 8);

  // Leaderboard — motivation, not ranking by weakness. Only students with
  // real, non-zero activity in a category are ever listed.
  const leaderboard: ClassroomLeaderboard = { mostConsistent: [], scriptureChampion: [], quizChampion: [], mostImproved: [] };
  if (childIds.length > 0) {
    const top = (entries: LeaderboardEntry[]) => entries.filter((e) => e.value > 0).sort((a, b) => b.value - a.value).slice(0, 3);

    leaderboard.mostConsistent = top(students.map((s) => ({ studentId: s.id, name: s.name, value: s.weeklyActiveDays, unit: 'days active this week' })));

    const { data: storyCounts } = await admin.from('story_progress').select('child_id').in('child_id', childIds).eq('status', 'completed');
    const storyCountByChild = new Map<string, number>();
    for (const r of storyCounts || []) storyCountByChild.set(r.child_id, (storyCountByChild.get(r.child_id) || 0) + 1);
    leaderboard.scriptureChampion = top(students.map((s) => ({ studentId: s.id, name: s.name, value: storyCountByChild.get(s.id) || 0, unit: 'stories completed' })));

    leaderboard.quizChampion = top(students.filter((s) => s.masteryTracked).map((s) => ({ studentId: s.id, name: s.name, value: s.masteryPercent, unit: '% avg. performance' })));

    const improvement = await Promise.all(childIds.map(async (childId) => {
      const rows = await getConceptMasteryForChild(admin, childId);
      const best = rows.reduce((max, r) => Math.max(max, r.consecutive_correct), 0);
      return { childId, best };
    }));
    const improvementByChild = new Map(improvement.map((i) => [i.childId, i.best]));
    leaderboard.mostImproved = top(students.map((s) => ({ studentId: s.id, name: s.name, value: improvementByChild.get(s.id) || 0, unit: 'correct in a row' })));
  }

  const response: ClassroomDetailResponse = {
    classroom: {
      id: classroom.id,
      name: classroom.name,
      description: classroom.description,
      ageBand: classroom.age_band,
      meetingDay: classroom.meeting_day,
      meetingTime: classroom.meeting_time,
      code: classroom.code,
      createdAt: classroom.created_at,
    },
    stats: { studentCount, activeThisWeek, assignmentsCompletedPercent, avgPerformance, avgLearningActivity },
    students,
    pending,
    connectedElsewhere,
    activity: trimmedActivity,
    leaderboard,
  };
  return NextResponse.json(response);
}
