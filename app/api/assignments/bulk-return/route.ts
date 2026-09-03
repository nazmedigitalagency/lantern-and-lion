import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { sendGradeNotifications } from '../../../lib/assignments/server';

const BulkReturnSchema = z.object({
  items: z.array(z.object({ assignmentId: z.string().uuid(), childId: z.string().uuid() })).min(1).max(50),
});

/**
 * Marks several already-graded submissions as "returned" — so students see
 * their score/feedback and get notified — without touching score or
 * feedback at all. Only rows currently `status: 'graded'` are affected;
 * anything else in the selection is silently skipped.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  const parsed = BulkReturnSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const admin = createServerAdminClient();
  const assignmentIds = Array.from(new Set(parsed.data.items.map((i) => i.assignmentId)));
  const { data: assignmentRows } = await admin.from('assignments').select('id, title').eq('teacher_id', user.id).in('id', assignmentIds);
  const assignmentById = new Map((assignmentRows || []).map((a) => [a.id, a]));

  let returned = 0;
  let skipped = 0;
  const nowIso = new Date().toISOString();

  for (const item of parsed.data.items) {
    const assignment = assignmentById.get(item.assignmentId);
    if (!assignment) { skipped += 1; continue; }

    const { data: submission } = await admin
      .from('assignment_submissions')
      .select('id, child_id, score, feedback, status')
      .eq('assignment_id', item.assignmentId)
      .eq('child_id', item.childId)
      .maybeSingle();
    if (!submission || submission.status !== 'graded') { skipped += 1; continue; }

    await admin.from('assignment_submissions').update({ status: 'returned', updated_at: nowIso }).eq('id', submission.id);
    returned += 1;
    await sendGradeNotifications(admin, { assignmentId: item.assignmentId, assignmentTitle: assignment.title, childId: submission.child_id, score: submission.score, feedback: submission.feedback });
  }

  return NextResponse.json({ success: true, returned, skipped });
}
