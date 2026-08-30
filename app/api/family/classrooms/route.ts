import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';

/** Lists this parent's children's classroom memberships (pending + approved), for the approval UI. */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a parent first.' }, { status: 401 });

  const admin = createServerAdminClient();
  const { data: family } = await admin.from('families').select('id').eq('owner_id', user.id).maybeSingle();
  if (!family) return NextResponse.json({ memberships: [] });

  const { data: children } = await admin.from('children').select('id, name').eq('family_id', family.id);
  const childIds = (children || []).map((c) => c.id);
  if (childIds.length === 0) return NextResponse.json({ memberships: [] });

  const { data: memberships } = await admin
    .from('classroom_students')
    .select('classroom_id, child_id, approved, needs_help, joined_at, classrooms(id, name)')
    .in('child_id', childIds);

  const result = (memberships || []).map((m) => ({
    classroomId: m.classroom_id,
    classroomName: (m.classrooms as unknown as { name: string } | null)?.name || 'Class',
    childId: m.child_id,
    childName: children?.find((c) => c.id === m.child_id)?.name || '',
    approved: m.approved,
    needsHelp: m.needs_help,
    joinedAt: m.joined_at,
  }));

  return NextResponse.json({ memberships: result });
}
