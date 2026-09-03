import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const admin = createServerAdminClient();

  const { error } = await admin
    .from('classroom_announcements')
    .delete()
    .eq('id', id)
    .eq('teacher_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Could not delete announcement.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
