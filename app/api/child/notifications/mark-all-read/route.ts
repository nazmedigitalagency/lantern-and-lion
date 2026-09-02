import { NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../../lib/child-session';
import { createServerAdminClient } from '../../../../lib/supabase/server';

export async function POST() {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const admin = createServerAdminClient();
  await admin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_child_id', session.childId)
    .is('read_at', null);

  return NextResponse.json({ success: true });
}
