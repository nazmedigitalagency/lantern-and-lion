import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { computeStudentCards, type ChildRow } from '../../../lib/classrooms/roster';
import { assignmentBucket } from '../../../lib/assignments/server';
import { getStory } from '../../../stories/catalog';
import { getConcept } from '../../../lib/adaptive/concepts';
import type { ClassroomCard, ClassroomsListResponse } from '../../../lib/classrooms/types';

type RosterRow = { child_id: string; approved: boolean; children: ChildRow | null };

/**
 * The Classes page's card grid — separate from the plain GET /api/classrooms
 * (still used as-is by the Overview tab's lightweight class picker) because
 * this one computes real per-classroom stats and is proportionally heavier.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const admin = createServerAdminClient();
  const { data: classrooms } = await admin
    .from('classrooms')
    .select('id, name, description, age_band, meeting_day, meeting_time, code, created_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  const cards: ClassroomCard[] = await Promise.all((classrooms || []).map(async (c) => {
    const { data: rosterRaw } = await admin
      .from('classroom_students')
      .select('child_id, approved, children(id, name, age, family_id, last_login_at)')
      .eq('classroom_id', c.id);
    const roster = ((rosterRaw || []) as unknown as RosterRow[]).filter((r) => r.children);
    const approvedChildren = roster.filter((r) => r.approved).map((r) => r.children as ChildRow);
    const childIds = approvedChildren.map((child) => child.id);

    const cardsByChild = await computeStudentCards(admin, approvedChildren, new Map());
    const studentCards = Array.from(cardsByChild.values());
    const studentCount = studentCards.length;
    const activeThisWeek = studentCards.filter((s) => s.weeklyActiveDays > 0).length;
    const avgLearningActivity = studentCount ? Math.round((studentCards.reduce((sum, s) => sum + s.weeklyActiveDays, 0) / studentCount / 7) * 100) : 0;

    const { data: classroomAssignments } = await admin.from('assignments').select('id, due_date').eq('classroom_id', c.id).eq('status', 'assigned');
    let avgAssignmentCompletion: number | null = null;
    let upcomingAssignmentsCount = 0;
    if (classroomAssignments && classroomAssignments.length > 0) {
      const assignmentIds = classroomAssignments.map((a) => a.id);
      const { data: subs } = await admin.from('assignment_submissions').select('assignment_id, status').in('assignment_id', assignmentIds);
      const totals = new Map<string, { done: number; total: number }>();
      for (const s of subs || []) {
        const t = totals.get(s.assignment_id) || { done: 0, total: 0 };
        t.total += 1;
        if (s.status === 'submitted' || s.status === 'graded' || s.status === 'returned') t.done += 1;
        totals.set(s.assignment_id, t);
      }
      const percents = classroomAssignments.map((a) => {
        const t = totals.get(a.id) || { done: 0, total: 0 };
        return t.total > 0 ? (t.done / t.total) * 100 : 0;
      });
      avgAssignmentCompletion = percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : null;
      upcomingAssignmentsCount = classroomAssignments.filter((a) => {
        const t = totals.get(a.id) || { done: 0, total: 0 };
        const percent = t.total > 0 ? (t.done / t.total) * 100 : 0;
        const bucket = assignmentBucket('assigned', a.due_date, Math.round((percent / 100) * t.total), t.total);
        return bucket === 'due_soon' || bucket === 'active';
      }).length;
    }

    let recentActivityPreview: string | null = null;
    if (childIds.length > 0) {
      const { data: recentStory } = await admin
        .from('story_progress')
        .select('story_id, completed_at, children(name)')
        .in('child_id', childIds)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (recentStory) {
        const name = (recentStory.children as unknown as { name: string } | null)?.name;
        const title = getStory(recentStory.story_id)?.title || recentStory.story_id;
        recentActivityPreview = name ? `${name} completed “${title}.”` : null;
      } else {
        const { data: recentPractice } = await admin
          .from('concept_mastery')
          .select('concept_id, last_practiced_at')
          .in('child_id', childIds)
          .order('last_practiced_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (recentPractice) {
          const label = getConcept(recentPractice.concept_id)?.label || recentPractice.concept_id;
          recentActivityPreview = `A student practiced ${label}.`;
        }
      }
    }

    return {
      id: c.id,
      name: c.name,
      description: c.description,
      ageBand: c.age_band,
      meetingDay: c.meeting_day,
      meetingTime: c.meeting_time,
      code: c.code,
      createdAt: c.created_at,
      studentCount,
      activeThisWeek,
      avgAssignmentCompletion,
      avgLearningActivity,
      upcomingAssignmentsCount,
      recentActivityPreview,
    };
  }));

  const response: ClassroomsListResponse = { classrooms: cards };
  return NextResponse.json(response);
}
