import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { referenceExists } from '../../../lib/assignments/content';

const UpdateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  category: z.enum(['scripture_memory', 'bible_knowledge', 'reading', 'games', 'stories', 'reflection', 'review']),
  assignmentType: z.enum(['story', 'reading', 'quiz', 'memory', 'game', 'written', 'custom']),
  referenceId: z.string().trim().max(64).optional(),
  instructions: z.string().trim().max(2000).optional(),
  timeLimitMinutes: z.number().int().min(1).max(600).optional(),
  requiredScore: z.number().int().min(0).max(100).optional(),
  xpReward: z.number().int().min(0).max(2000).optional(),
  ageGroup: z.enum(['child', 'teen', 'both']).default('both'),
});

/** Edits one of the teacher's own templates. Built-in templates aren't rows in this table and can't be reached here. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  const { id } = await params;

  const rawBody = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Please fill in the required fields.' }, { status: 400 });
  const data = parsed.data;

  const needsReference = data.assignmentType !== 'written' && data.assignmentType !== 'custom';
  if (needsReference && (!data.referenceId || !referenceExists(data.assignmentType, data.referenceId))) {
    return NextResponse.json({ error: 'Please choose what this template assigns.' }, { status: 400 });
  }

  const admin = createServerAdminClient();
  const { data: existing } = await admin.from('assignment_templates').select('id').eq('id', id).eq('teacher_id', user.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Template not found.' }, { status: 404 });

  const { error } = await admin.from('assignment_templates').update({
    title: data.title,
    description: data.description || null,
    category: data.category,
    assignment_type: data.assignmentType,
    reference_id: needsReference ? data.referenceId : null,
    instructions: data.instructions || null,
    time_limit_minutes: data.timeLimitMinutes ?? null,
    required_score: data.requiredScore ?? null,
    xp_reward: data.xpReward ?? null,
    age_group: data.ageGroup,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) return NextResponse.json({ error: 'Could not save this template.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

/** Deletes one of the teacher's own templates. Never touches assignments — there is no relationship to cascade. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  const { id } = await params;

  const admin = createServerAdminClient();
  const { error } = await admin.from('assignment_templates').delete().eq('id', id).eq('teacher_id', user.id);
  if (error) return NextResponse.json({ error: 'Could not delete this template.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
