import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';

/** Duplicates one of the teacher's own templates as a new, independent copy. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  const { id } = await params;

  const admin = createServerAdminClient();
  const { data: existing } = await admin
    .from('assignment_templates')
    .select('title, description, category, assignment_type, reference_id, instructions, time_limit_minutes, required_score, xp_reward, age_group')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Template not found.' }, { status: 404 });

  const { data: copy, error } = await admin
    .from('assignment_templates')
    .insert({ ...existing, title: `${existing.title} (copy)`, teacher_id: user.id })
    .select('id')
    .maybeSingle();

  if (error || !copy) return NextResponse.json({ error: 'Could not duplicate this template.' }, { status: 500 });
  return NextResponse.json({ success: true, id: copy.id });
}
