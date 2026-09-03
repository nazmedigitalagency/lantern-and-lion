import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { bumpDailySummary } from '../../../../lib/activity/server';
import { isAutoScoredType } from '../../../../lib/assignments/types';
import { sendGradeNotifications } from '../../../../lib/assignments/server';

const GradeSchema = z.object({
  childId: z.string().uuid(),
  score: z.number().int().min(0).max(100).optional(),
  feedback: z.string().trim().max(2000).optional(),
  returnToStudent: z.boolean().default(false),
  /** Required when setting a score on an assignment type that's normally auto-scored — an explicit, deliberate confirmation rather than a silent overwrite. */
  override: z.boolean().default(false),
});

/**
 * Manual grading for written/custom submissions (and a deliberate re-grade
 * override for auto-scored types, gated behind `override: true`) — score +
 * private feedback, then optionally "return" it so the student sees the
 * grade and feedback in their own assignment view. XP is only awarded once,
 * and only when there's either no required score or the score clears it —
 * same rule the automatic scorer uses.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id } = await ctx.params;
  const rawBody = await req.json().catch(() => null);
  const parsed = GradeSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid grading request.' }, { status: 400 });

  const admin = createServerAdminClient();
  const { data: assignment } = await admin.from('assignments').select('id, title, assignment_type, xp_reward, required_score').eq('id', id).eq('teacher_id', user.id).maybeSingle();
  if (!assignment) return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });

  const { data: submission } = await admin
    .from('assignment_submissions')
    .select('id, child_id, xp_awarded, score, score_overridden, original_score')
    .eq('assignment_id', id)
    .eq('child_id', parsed.data.childId)
    .maybeSingle();
  if (!submission) return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });

  const autoScored = isAutoScoredType(assignment.assignment_type);
  if (autoScored && parsed.data.score !== undefined && !parsed.data.override) {
    return NextResponse.json({ error: 'This assignment is scored automatically — confirm the override to change its score.' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const score = parsed.data.score ?? null;
  const isOverride = autoScored && parsed.data.score !== undefined && parsed.data.override;

  let xpAwarded = submission.xp_awarded;
  if (!xpAwarded && assignment.xp_reward && assignment.xp_reward > 0 && (assignment.required_score === null || (score !== null && score >= assignment.required_score))) {
    const { data: child } = await admin.from('children').select('family_id').eq('id', submission.child_id).maybeSingle();
    if (child) {
      const { data: family } = await admin.from('families').select('timezone').eq('id', child.family_id).maybeSingle();
      await bumpDailySummary(admin, submission.child_id, family?.timezone || 'UTC', { xp_earned: assignment.xp_reward }, { last_activity_at: nowIso });
      xpAwarded = true;
    }
  }

  const { error } = await admin
    .from('assignment_submissions')
    .update({
      status: parsed.data.returnToStudent ? 'returned' : 'graded',
      score,
      feedback: parsed.data.feedback || null,
      graded_at: nowIso,
      graded_by: user.id,
      xp_awarded: xpAwarded,
      updated_at: nowIso,
      ...(isOverride ? { score_overridden: true, original_score: submission.original_score ?? submission.score } : {}),
    })
    .eq('id', submission.id);

  if (error) return NextResponse.json({ error: 'Could not save this grade.' }, { status: 500 });

  if (parsed.data.returnToStudent) {
    await sendGradeNotifications(admin, { assignmentId: id, assignmentTitle: assignment.title, childId: submission.child_id, score, feedback: parsed.data.feedback || null });
  }

  return NextResponse.json({ success: true });
}
