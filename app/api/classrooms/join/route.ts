import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';

const JoinSchema = z.object({ code: z.string().trim().toUpperCase().min(4).max(8) });

export async function POST(req: NextRequest) {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  const parsed = JoinSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Please enter a valid class code.' }, { status: 400 });

  const admin = createServerAdminClient();
  const { data: classroom } = await admin.from('classrooms').select('id, name').eq('code', parsed.data.code).maybeSingle();
  if (!classroom) return NextResponse.json({ error: 'We could not find a class with that code.' }, { status: 404 });

  const { data: existing } = await admin
    .from('classroom_students')
    .select('id, approved')
    .eq('classroom_id', classroom.id)
    .eq('child_id', session.childId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, classroom: { id: classroom.id, name: classroom.name }, approved: existing.approved });
  }

  await admin.from('classroom_students').insert({ classroom_id: classroom.id, child_id: session.childId, approved: false });
  return NextResponse.json({ success: true, classroom: { id: classroom.id, name: classroom.name }, approved: false, pendingApproval: true });
}
