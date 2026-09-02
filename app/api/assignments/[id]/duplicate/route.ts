import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';

/** Clones an assignment as a new draft — title, instructions, content, requirements copied; due date reset since that's the one thing you always want to change on reuse. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id } = await ctx.params;
  const admin = createServerAdminClient();
  const { data: original } = await admin
    .from('assignments')
    .select('title, instructions, assignment_type, reference_id, classroom_id, time_limit_minutes, required_score, xp_reward')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .maybeSingle();
  if (!original) return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });

  const { data: copy, error } = await admin
    .from('assignments')
    .insert({
      teacher_id: user.id,
      title: `${original.title} (copy)`,
      instructions: original.instructions,
      assignment_type: original.assignment_type,
      reference_id: original.reference_id,
      classroom_id: original.classroom_id,
      status: 'draft',
      time_limit_minutes: original.time_limit_minutes,
      required_score: original.required_score,
      xp_reward: original.xp_reward,
    })
    .select('id')
    .maybeSingle();

  if (error || !copy) return NextResponse.json({ error: 'Could not duplicate this assignment.' }, { status: 500 });
  return NextResponse.json({ success: true, id: copy.id });
}
