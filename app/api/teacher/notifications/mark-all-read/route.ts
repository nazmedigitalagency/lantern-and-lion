import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  }

  const admin = createServerAdminClient();
  const { error } = await admin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .is('read_at', null);

  if (error) {
    return NextResponse.json({ error: 'Could not mark notifications as read.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
