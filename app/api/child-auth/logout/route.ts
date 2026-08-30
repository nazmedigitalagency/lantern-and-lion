import { NextResponse } from 'next/server';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { clearChildSessionCookie, getChildSessionFromCookies } from '../../../lib/child-session';
import { getFamilyForChild, recordActivityEvent } from '../../../lib/activity/server';

export async function POST() {
  const session = await getChildSessionFromCookies();
  if (!session) {
    await clearChildSessionCookie();
    return NextResponse.json({ success: true });
  }

  const admin = createServerAdminClient();
  const family = await getFamilyForChild(admin, session.childId);
  if (family) {
    await recordActivityEvent(admin, {
      childId: session.childId,
      familyId: family.familyId,
      sessionId: session.sessionId,
      eventType: 'SESSION_ENDED',
    });
  }
  await admin
    .from('child_sessions')
    .update({ ended_at: new Date().toISOString(), ended_reason: 'logout' })
    .eq('id', session.sessionId)
    .is('ended_at', null);

  await clearChildSessionCookie();
  return NextResponse.json({ success: true });
}
