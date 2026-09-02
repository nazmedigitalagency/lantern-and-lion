import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { assignmentBucket, syncAssignmentSubmissions } from '../../../lib/assignments/server';
import { referenceLabel } from '../../../lib/assignments/content';
import type { AssignmentDetail, AssignmentSubmissionRow, AssignmentType } from '../../../lib/assignments/types';

/**
 * Full assignment detail for the teacher: overview, progress, and the
 * per-student submissions table — synced against real completion data
 * before it's returned, same as the list endpoint.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id } = await ctx.params;
  const admin = createServerAdminClient();

  const { data: assignment } = await admin
    .from('assignments')
    .select('id, title, instructions, assignment_type, reference_id, classroom_id, status, due_date, time_limit_minutes, required_score, xp_reward, created_at, assigned_at')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .maybeSingle();
  if (!assignment) return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });

  const { data: submissionRows } = await admin
    .from('assignment_submissions')
    .select('id, child_id, status, score, submitted_at, graded_at, feedback, response_text, xp_awarded, children(name)')
    .eq('assignment_id', id);
  const submissions = (submissionRows || []) as unknown as Array<{
    id: string; child_id: string; status: string; score: number | null; submitted_at: string | null;
    graded_at: string | null; feedback: string | null; response_text: string | null; xp_awarded: boolean;
    children: { name: string } | null;
  }>;

  if (assignment.status === 'assigned') {
    await syncAssignmentSubmissions(admin, assignment as never, submissions as never);
  }

  let classroomName: string | null = null;
  if (assignment.classroom_id) {
    const { data: classroom } = await admin.from('classrooms').select('name').eq('id', assignment.classroom_id).maybeSingle();
    classroomName = classroom?.name || 'Class';
  }

  const completedCount = submissions.filter((s) => s.status === 'submitted' || s.status === 'graded' || s.status === 'returned').length;
  const gradedRows = submissions.filter((s) => s.status === 'graded' || s.status === 'returned');
  const scored = submissions.filter((s) => s.score !== null);
  const avgScore = scored.length ? Math.round(scored.reduce((sum, s) => sum + (s.score || 0), 0) / scored.length) : null;

  const submissionList: AssignmentSubmissionRow[] = submissions
    .map((s) => ({
      childId: s.child_id,
      studentName: s.children?.name || 'Student',
      status: s.status as AssignmentSubmissionRow['status'],
      score: s.score,
      submittedAt: s.submitted_at,
      gradedAt: s.graded_at,
      feedback: s.feedback,
      responseText: s.response_text,
    }))
    .sort((a, b) => a.studentName.localeCompare(b.studentName));

  const detail: AssignmentDetail = {
    id: assignment.id,
    title: assignment.title,
    instructions: assignment.instructions,
    assignmentType: assignment.assignment_type as AssignmentType,
    referenceId: assignment.reference_id,
    referenceLabel: referenceLabel(assignment.assignment_type as AssignmentType, assignment.reference_id),
    classroom: assignment.classroom_id ? { id: assignment.classroom_id, name: classroomName || 'Class' } : null,
    studentCount: submissions.length,
    createdAt: assignment.created_at,
    dueDate: assignment.due_date,
    status: assignment.status,
    bucket: assignmentBucket(assignment.status, assignment.due_date, completedCount, submissions.length),
    completedCount,
    gradedCount: gradedRows.length,
    avgScore,
    requiredScore: assignment.required_score,
    xpReward: assignment.xp_reward,
    timeLimitMinutes: assignment.time_limit_minutes,
    submissions: submissionList,
  };

  return NextResponse.json(detail);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id } = await ctx.params;
  const admin = createServerAdminClient();
  const { error } = await admin.from('assignments').delete().eq('id', id).eq('teacher_id', user.id);
  if (error) return NextResponse.json({ error: 'Could not delete this assignment.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
