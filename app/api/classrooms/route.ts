import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../lib/supabase/route-client';
import { createServerAdminClient } from '../../lib/supabase/server';

function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous O/0/I/1
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const admin = createServerAdminClient();
  const { data: classrooms } = await admin.from('classrooms').select('id, name, age_band, code, created_at').eq('teacher_id', user.id).order('created_at', { ascending: false });
  return NextResponse.json({ classrooms: classrooms || [] });
}

const CreateSchema = z.object({ name: z.string().trim().min(1).max(64), ageBand: z.string().trim().max(32).optional() });

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Please provide a class name.' }, { status: 400 });

  const admin = createServerAdminClient();
  let code = generateClassCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: taken } = await admin.from('classrooms').select('id').eq('code', code).maybeSingle();
    if (!taken) break;
    code = generateClassCode();
  }

  const { data: classroom, error } = await admin
    .from('classrooms')
    .insert({ teacher_id: user.id, name: parsed.data.name, age_band: parsed.data.ageBand || null, code })
    .select('id, name, age_band, code, created_at')
    .maybeSingle();

  if (error || !classroom) return NextResponse.json({ error: 'Could not create the class.' }, { status: 500 });
  return NextResponse.json({ classroom });
}
