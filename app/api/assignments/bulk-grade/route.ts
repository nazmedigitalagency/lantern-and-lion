import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { awardXpIfDue, sendGradeNotifications } from '../../../lib/assignments/server';
import { isAutoScoredType } from '../../../lib/assignments/types';

const BulkGradeSchema = z.object({
  items: z.array(z.object({ assignmentId: z.string().uuid(), childId: z.string().uuid() })).min(1).max(50),
  score: z.number().int().min(0).max(100),
  feedback: z.string().trim().max(2000).optional(),
  returnToStudent: z.boolean().default(false),
});

/**
 * Apply the same score + feedback to several submissions at once — e.g. a
 * shared participation grade. Deliberately restricted to manually-graded
 * assignment types (written/custom): bulk actions never touch an
 * automatically-generated score, since overriding one is a deliberate,
 * single-submission decision (see /api/assignments/[id]/grade), not
 * something to apply in bulk. Auto-scored items in the selection are
 * silently skipped and reported back, not errored.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  const parsed = BulkGradeSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid bulk grading request.' }, { status: 400 });

  const admin = createServerAdminClient();
  const assignmentIds = Array.from(new Set(parsed.data.items.map((i) => i.assignmentId)));
  const { data: assignmentRows } = await admin.from('assignments').select('id, title, assignment_type, xp_reward, required_score, reference_id, assigned_at').eq('teacher_id', user.id).in('id', assignmentIds);
  const assignmentById = new Map((assignmentRows || []).map((a) => [a.id, a]));

  let graded = 0;
  let skippedAuto = 0;
  let skippedNotFound = 0;
  const nowIso = new Date().toISOString();

  for (const item of parsed.data.items) {
    const assignment = assignmentById.get(item.assignmentId);
    if (!assignment) { skippedNotFound += 1; continue; }
    if (isAutoScoredType(assignment.assignment_type)) { skippedAuto += 1; continue; }

    const { data: submission } = await admin
      .from('assignment_submissions')
      .select('id, child_id, xp_awarded')
      .eq('assignment_id', item.assignmentId)
      .eq('child_id', item.childId)
      .maybeSingle();
    if (!submission) { skippedNotFound += 1; continue; }

    let xpAwarded = submission.xp_awarded;
    if (!xpAwarded) {
      xpAwarded = await awardXpIfDue(admin, submission.child_id, assignment, parsed.data.score);
    }

    await admin
      .from('assignment_submissions')
      .update({
        status: parsed.data.returnToStudent ? 'returned' : 'graded',
        score: parsed.data.score,
        feedback: parsed.data.feedback || null,
        graded_at: nowIso,
        graded_by: user.id,
        xp_awarded: xpAwarded,
        updated_at: nowIso,
      })
      .eq('id', submission.id);
    graded += 1;

    if (parsed.data.returnToStudent) {
      await sendGradeNotifications(admin, { assignmentId: item.assignmentId, assignmentTitle: assignment.title, childId: submission.child_id, score: parsed.data.score, feedback: parsed.data.feedback || null });
    }
  }

  return NextResponse.json({ success: true, graded, skippedAuto, skippedNotFound });
}
