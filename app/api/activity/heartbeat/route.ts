import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { getFamilyForChild, recordActivityEvent, bumpDailySummary } from '../../../lib/activity/server';
import { HEARTBEAT_INTERVAL_SECONDS, INACTIVITY_THRESHOLD_SECONDS } from '../../../lib/activity/config';

const HeartbeatSchema = z.object({
  activeSeconds: z.number().min(0).max(HEARTBEAT_INTERVAL_SECONDS * 2),
});

export async function POST(req: NextRequest) {
  const session = await getChildSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'No active child session.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = HeartbeatSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid heartbeat payload.' }, { status: 400 });
  }

  const admin = createServerAdminClient();
  const family = await getFamilyForChild(admin, session.childId);
  if (!family) {
    return NextResponse.json({ error: 'Family not found.' }, { status: 404 });
  }

  const { data: sessionRow } = await admin
    .from('child_sessions')
    .select('last_seen_at, ended_at')
    .eq('id', session.sessionId)
    .maybeSingle();

  if (!sessionRow || sessionRow.ended_at) {
    return NextResponse.json({ error: 'Session has ended.' }, { status: 410 });
  }

  const gapSeconds = (Date.now() - new Date(sessionRow.last_seen_at).getTime()) / 1000;
  if (gapSeconds > INACTIVITY_THRESHOLD_SECONDS) {
    await recordActivityEvent(admin, { childId: session.childId, familyId: family.familyId, sessionId: session.sessionId, eventType: 'SESSION_IDLE' });
    await recordActivityEvent(admin, { childId: session.childId, familyId: family.familyId, sessionId: session.sessionId, eventType: 'SESSION_RESUMED' });
  }

  const activeSeconds = Math.min(parsed.data.activeSeconds, HEARTBEAT_INTERVAL_SECONDS);
  await admin.from('child_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', session.sessionId);
  await bumpDailySummary(admin, session.childId, family.timezone, { active_seconds: activeSeconds }, { last_activity_at: new Date().toISOString() });

  return NextResponse.json({ success: true });
}
