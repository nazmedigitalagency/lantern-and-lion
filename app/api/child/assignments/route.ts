import { NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { studentDueBucket, syncAssignmentSubmissions } from '../../../lib/assignments/server';
import { contentLink, referenceLabel } from '../../../lib/assignments/content';
import { sortByPriority } from '../../../lib/assignments/priority';
import { notifyChildOnce } from '../../../lib/activity/server';
import type { AssignmentType, StudentAssignment } from '../../../lib/assignments/types';

/**
 * The student-facing assignment list — same underlying data the teacher's
 * Assignment Center reads, just shaped for a child/teen: no other
 * students' info, no grading tools, and auto-scored work is synced live so
 * completing a story/lesson/game immediately shows up as done here too.
 */
export async function GET() {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const admin = createServerAdminClient();
  const { data: rows } = await admin
    .from('assignment_submissions')
    .select('id, child_id, status, score, feedback, submitted_at, graded_at, assignments(id, title, instructions, assignment_type, reference_id, due_date, time_limit_minutes, required_score, xp_reward, status, assigned_at, classrooms(name))')
    .eq('child_id', session.childId);

  type Row = {
    id: string; child_id: string; status: string; score: number | null; feedback: string | null; submitted_at: string | null; graded_at: string | null;
    assignments: {
      id: string; title: string; instructions: string | null; assignment_type: AssignmentType; reference_id: string | null;
      due_date: string | null; time_limit_minutes: number | null; required_score: number | null; xp_reward: number | null;
      status: 'draft' | 'assigned'; assigned_at: string | null; classrooms: { name: string } | null;
    } | null;
  };

  const submissions = ((rows || []) as unknown as Row[]).filter((r) => r.assignments && r.assignments.status === 'assigned');

  // Reconcile auto-scored types against real completion data, grouped by assignment.
  const byAssignment = new Map<string, { assignment: Row['assignments']; rows: Row[] }>();
  for (const r of submissions) {
    const key = r.assignments!.id;
    const bucket = byAssignment.get(key) || { assignment: r.assignments, rows: [] };
    bucket.rows.push(r);
    byAssignment.set(key, bucket);
  }
  for (const { assignment, rows: group } of byAssignment.values()) {
    if (!assignment) continue;
    await syncAssignmentSubmissions(admin, assignment as never, group as never);
  }

  const result: StudentAssignment[] = submissions
    .filter((r) => r.assignments)
    .map((r) => {
      const a = r.assignments!;
      return {
        id: a.id,
        title: a.title,
        instructions: a.instructions,
        assignmentType: a.assignment_type,
        referenceLabel: referenceLabel(a.assignment_type, a.reference_id),
        contentLink: contentLink(a.assignment_type, a.reference_id),
        classroomName: a.classrooms?.name || null,
        dueDate: a.due_date,
        timeLimitMinutes: a.time_limit_minutes,
        requiredScore: a.required_score,
        xpReward: a.xp_reward,
        status: r.status as StudentAssignment['status'],
        score: r.score,
        feedback: r.feedback,
        submittedAt: r.submitted_at,
        gradedAt: r.graded_at,
        dueBucket: studentDueBucket(a.due_date, r.status),
      };
    });

  // Reminder notifications: fire once, ever, the first time a still-open
  // assignment is found in the due-soon/due-today or overdue window —
  // never on every dashboard load (dedupe_key has no timestamp, so the DB
  // unique constraint silently no-ops on every subsequent read).
  for (const a of result) {
    if (a.status !== 'assigned' && a.status !== 'in_progress') continue;
    if (a.dueBucket === 'due_soon' || a.dueBucket === 'due_today') {
      await notifyChildOnce(admin, {
        childId: session.childId,
        type: 'ASSIGNMENT_DUE_SOON',
        title: 'Assignment due soon',
        body: `Your “${a.title}” is due ${a.dueBucket === 'due_today' ? 'today' : new Date(`${a.dueDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' })}.`,
        payload: { assignmentId: a.id },
        dedupeKey: `assignment_due_soon_child:${a.id}:${session.childId}`,
      }).catch(() => {});
    } else if (a.dueBucket === 'overdue') {
      await notifyChildOnce(admin, {
        childId: session.childId,
        type: 'ASSIGNMENT_OVERDUE',
        title: 'Still waiting for you',
        body: `Your “${a.title}” is still waiting for you.`,
        payload: { assignmentId: a.id },
        dedupeKey: `assignment_overdue_child:${a.id}:${session.childId}`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ assignments: sortByPriority(result) });
}
