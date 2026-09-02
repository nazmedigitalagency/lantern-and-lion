import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getChildSessionFromCookies } from '../../../../../lib/child-session';
import { createServerAdminClient } from '../../../../../lib/supabase/server';

const SubmitSchema = z.object({
  responseText: z.string().trim().max(4000).optional(),
  draft: z.boolean().default(false),
});

/**
 * Student submission for the two manually-graded types (written/custom) —
 * the only kind that needs an explicit "I'm done" action from the child,
 * since every other type is detected automatically once they complete the
 * real content it points at.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const { id } = await ctx.params;
  const rawBody = await req.json().catch(() => ({}));
  const parsed = SubmitSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });

  const admin = createServerAdminClient();
  const { data: submission } = await admin
    .from('assignment_submissions')
    .select('id, status, assignments(assignment_type)')
    .eq('assignment_id', id)
    .eq('child_id', session.childId)
    .maybeSingle();
  if (!submission) return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
  if (submission.status === 'graded' || submission.status === 'returned') {
    return NextResponse.json({ error: 'This assignment has already been graded.' }, { status: 409 });
  }

  const nowIso = new Date().toISOString();
  const { error } = await admin
    .from('assignment_submissions')
    .update({
      response_text: parsed.data.responseText ?? null,
      status: parsed.data.draft ? 'in_progress' : 'submitted',
      submitted_at: parsed.data.draft ? null : nowIso,
      updated_at: nowIso,
    })
    .eq('id', submission.id);

  if (error) return NextResponse.json({ error: 'Could not save your work.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
