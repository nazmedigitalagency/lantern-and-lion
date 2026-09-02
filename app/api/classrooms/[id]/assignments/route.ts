import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { getStory } from '../../../../stories/catalog';
import { getConcept } from '../../../../lib/adaptive/concepts';

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  assignmentType: z.enum(['story', 'concept']),
  referenceId: z.string().trim().min(1).max(64),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Assigns real, already-completable content (an interactive Bible story or
 * a curriculum concept) to a classroom — never a free-floating "assignment"
 * with its own separate completion status to maintain by hand.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id: classroomId } = await ctx.params;
  const rawBody = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Please fill in a title and choose what to assign.' }, { status: 400 });

  const referenceExists = parsed.data.assignmentType === 'story' ? Boolean(getStory(parsed.data.referenceId)) : Boolean(getConcept(parsed.data.referenceId));
  if (!referenceExists) return NextResponse.json({ error: 'That content could not be found.' }, { status: 400 });

  const admin = createServerAdminClient();
  const { data: classroom } = await admin.from('classrooms').select('id').eq('id', classroomId).eq('teacher_id', user.id).maybeSingle();
  if (!classroom) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  const { data: assignment, error } = await admin
    .from('classroom_assignments')
    .insert({
      classroom_id: classroomId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      assignment_type: parsed.data.assignmentType,
      reference_id: parsed.data.referenceId,
      due_date: parsed.data.dueDate || null,
      created_by: user.id,
    })
    .select('id')
    .maybeSingle();

  if (error || !assignment) return NextResponse.json({ error: 'Could not create the assignment.' }, { status: 500 });
  return NextResponse.json({ success: true, id: assignment.id });
}

const DeleteSchema = z.object({ assignmentId: z.string().uuid() });

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id: classroomId } = await ctx.params;
  const rawBody = await req.json().catch(() => null);
  const parsed = DeleteSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'An assignment is required.' }, { status: 400 });

  const admin = createServerAdminClient();
  const { data: classroom } = await admin.from('classrooms').select('id').eq('id', classroomId).eq('teacher_id', user.id).maybeSingle();
  if (!classroom) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  const { error } = await admin.from('classroom_assignments').delete().eq('id', parsed.data.assignmentId).eq('classroom_id', classroomId);
  if (error) return NextResponse.json({ error: 'Could not remove the assignment.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
