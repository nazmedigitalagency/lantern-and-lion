import { NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';

export async function GET() {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const admin = createServerAdminClient();

  const { data: membership } = await admin
    .from('classroom_students')
    .select('classroom_id, approved, requested_by, classrooms(id, name, code, age_band, teacher_id)')
    .eq('child_id', session.childId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({
      connected: false,
      approved: false,
      classroom: null,
      teacherName: null,
    });
  }

  const c = membership.classrooms as unknown as { id: string; name: string; code: string; age_band: string | null; teacher_id: string } | null;
  let teacherName = 'Teacher';
  if (c?.teacher_id) {
    try {
      const { data: teacherUser } = await admin.auth.admin.getUserById(c.teacher_id);
      teacherName = (teacherUser?.user?.user_metadata?.name || teacherUser?.user?.user_metadata?.full_name || 'Teacher') as string;
    } catch {
      teacherName = 'Teacher';
    }
  }

  return NextResponse.json({
    connected: true,
    approved: membership.approved,
    classroom: c ? {
      id: c.id,
      name: c.name,
      code: c.code,
      ageBand: c.age_band,
    } : null,
    teacherName,
  });
}
