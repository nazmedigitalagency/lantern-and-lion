import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { normalizeTeacherCode } from '../../../../lib/codes/server';
import { checkRateLimit, getClientIp } from '../../../../lib/rate-limit';
import { ageGroupForAge } from '../../../../lib/classrooms/server';
import type { StudentLookupResponse, ConnectionState } from '../../../../lib/classrooms/types';

const LookupSchema = z.object({
  teacherCode: z.string().trim().min(4).max(32),
  classroomId: z.string().uuid(),
});

/**
 * Step 1 of "Add Student": a read-only preview, never a relationship row.
 * Deliberately returns the bare minimum needed for a teacher to confirm
 * they've got the right student — display name, Child/Teen, avatar — never
 * age, username, or family details, and never anything at all if the code
 * doesn't resolve to a real child. This is also the one surface that turns a
 * Teacher Code into information, so it's rate-limited the same as the
 * request-sending endpoint to make code-guessing impractical.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const limit = checkRateLimit(`teacher-lookup-student:${user.id}:${getClientIp(req)}`, { maxRequests: 20, windowSeconds: 60 });
  if (!limit.allowed) return NextResponse.json({ error: 'Too many attempts. Please wait a moment and try again.' }, { status: 429 });

  const rawBody = await req.json().catch(() => null);
  const parsed = LookupSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Please enter a valid Teacher Code.' }, { status: 400 });

  const admin = createServerAdminClient();

  const { data: classroom } = await admin
    .from('classrooms')
    .select('id, name')
    .eq('id', parsed.data.classroomId)
    .eq('teacher_id', user.id)
    .maybeSingle();
  if (!classroom) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  const code = normalizeTeacherCode(parsed.data.teacherCode);
  const { data: child } = await admin.from('children').select('id, name, age, avatar').eq('teacher_code', code).maybeSingle();
  if (!child) {
    return NextResponse.json({ error: "We couldn't find a student with that code. Check the code and try again." }, { status: 404 });
  }

  const { data: existing } = await admin
    .from('classroom_students')
    .select('approved, status')
    .eq('classroom_id', classroom.id)
    .eq('child_id', child.id)
    .maybeSingle();

  let connection: ConnectionState = 'none';
  if (existing) {
    if (existing.status && ['pending', 'approved', 'declined', 'revoked', 'removed'].includes(existing.status)) {
      connection = existing.status as ConnectionState;
    } else {
      connection = existing.approved ? 'approved' : 'pending';
    }
  }

  const response: StudentLookupResponse = {
    student: { id: child.id, name: child.name, ageGroup: ageGroupForAge(child.age), avatar: child.avatar || 'lion' },
    classroom: { id: classroom.id, name: classroom.name },
    connection,
  };
  return NextResponse.json(response);
}
