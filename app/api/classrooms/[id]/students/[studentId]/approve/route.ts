import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../../../lib/supabase/server';

const BodySchema = z.object({ approved: z.boolean() });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; studentId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a parent first.' }, { status: 401 });

  const { id: classroomId, studentId } = await ctx.params;
  const rawBody = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const admin = createServerAdminClient();

  // The caller must be the parent who owns this specific child — never trust
  // the classroom/student ids alone.
  const { data: child } = await admin.from('children').select('id, family_id').eq('id', studentId).maybeSingle();
  if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  const { data: family } = await admin.from('families').select('id').eq('id', child.family_id).eq('owner_id', user.id).maybeSingle();
  if (!family) return NextResponse.json({ error: 'You are not authorized to manage this student.' }, { status: 403 });

  const { error } = await admin
    .from('classroom_students')
    .update({ approved: parsed.data.approved })
    .eq('classroom_id', classroomId)
    .eq('child_id', studentId);

  if (error) return NextResponse.json({ error: 'Could not update approval.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; studentId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a parent first.' }, { status: 401 });

  const { id: classroomId, studentId } = await ctx.params;
  const admin = createServerAdminClient();

  const { data: child } = await admin.from('children').select('id, family_id').eq('id', studentId).maybeSingle();
  if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  const { data: family } = await admin.from('families').select('id').eq('id', child.family_id).eq('owner_id', user.id).maybeSingle();
  if (!family) return NextResponse.json({ error: 'You are not authorized to manage this student.' }, { status: 403 });

  const { error } = await admin
    .from('classroom_students')
    .delete()
    .eq('classroom_id', classroomId)
    .eq('child_id', studentId);

  if (error) return NextResponse.json({ error: 'Could not remove connection.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

