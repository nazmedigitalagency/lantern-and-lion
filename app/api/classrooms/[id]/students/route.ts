import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';

const AddSchema = z.object({ childId: z.string().uuid() });

/**
 * "Class → Manage Students → Add Students": attaches a student the teacher
 * is *already connected to* (approved into any of their other classrooms)
 * to this classroom too. Because the parent has already consented to this
 * teacher seeing this child's data, no new Teacher Code / approval round
 * trip is required — the row is created pre-approved, same as the
 * teacher-initiated code flow becomes once approved. A student not yet
 * connected anywhere must go through POST /api/teacher/students first.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id: classroomId } = await ctx.params;
  const rawBody = await req.json().catch(() => null);
  const parsed = AddSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'A student is required.' }, { status: 400 });

  const admin = createServerAdminClient();

  const { data: classroom } = await admin.from('classrooms').select('id, name').eq('id', classroomId).eq('teacher_id', user.id).maybeSingle();
  if (!classroom) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  const { data: teacherClassrooms } = await admin.from('classrooms').select('id').eq('teacher_id', user.id);
  const teacherClassroomIds = (teacherClassrooms || []).map((c) => c.id);

  const { data: elsewhere } = await admin
    .from('classroom_students')
    .select('id, children(name)')
    .eq('child_id', parsed.data.childId)
    .eq('approved', true)
    .in('classroom_id', teacherClassroomIds)
    .limit(1);

  if (!elsewhere || elsewhere.length === 0) {
    return NextResponse.json({ error: "This student isn't connected to you yet. Use + Add Student with their Teacher Code first." }, { status: 403 });
  }
  const studentName = (elsewhere[0].children as unknown as { name: string } | null)?.name || 'This student';

  const { data: existing } = await admin
    .from('classroom_students')
    .select('id, approved')
    .eq('classroom_id', classroomId)
    .eq('child_id', parsed.data.childId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      existing.approved
        ? { error: `${studentName} is already in this class.`, status: 'already_connected' }
        : { error: 'Connection request pending.', status: 'pending' },
      { status: 409 }
    );
  }

  const { error: insertError } = await admin
    .from('classroom_students')
    .insert({ classroom_id: classroomId, child_id: parsed.data.childId, approved: true, requested_by: 'teacher' });
  if (insertError) return NextResponse.json({ error: 'Could not add this student to the class.' }, { status: 500 });

  return NextResponse.json({ success: true, child: { id: parsed.data.childId, name: studentName }, classroom: { id: classroom.id, name: classroom.name } });
}
