import { NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { studentDueBucket, syncAssignmentSubmissions } from '../../../lib/assignments/server';
import { contentLink } from '../../../lib/assignments/content';
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
    .select('id, child_id, status, score, feedback, submitted_at, assignments(id, title, instructions, assignment_type, reference_id, due_date, time_limit_minutes, required_score, xp_reward, status, assigned_at)')
    .eq('child_id', session.childId);

  type Row = {
    id: string; child_id: string; status: string; score: number | null; feedback: string | null; submitted_at: string | null;
    assignments: {
      id: string; title: string; instructions: string | null; assignment_type: AssignmentType; reference_id: string | null;
      due_date: string | null; time_limit_minutes: number | null; required_score: number | null; xp_reward: number | null;
      status: 'draft' | 'assigned'; assigned_at: string | null;
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
        contentLink: contentLink(a.assignment_type, a.reference_id),
        dueDate: a.due_date,
        timeLimitMinutes: a.time_limit_minutes,
        requiredScore: a.required_score,
        xpReward: a.xp_reward,
        status: r.status as StudentAssignment['status'],
        score: r.score,
        feedback: r.feedback,
        submittedAt: r.submitted_at,
        dueBucket: studentDueBucket(a.due_date, r.status),
      };
    })
    .sort((a, b) => {
      const order = { overdue: 0, due_today: 1, due_soon: 2, upcoming: 3, completed: 4 };
      return order[a.dueBucket] - order[b.dueBucket];
    });

  return NextResponse.json({ assignments: result });
}
