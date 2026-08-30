import { NextRequest, NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { getFamilyForChild } from '../../../lib/activity/server';
import { getStreakCalendar } from '../../../lib/streak/server';

/** "View Streak" detail — day-by-day history for the calling child only. */
export async function GET(req: NextRequest) {
  const session = await getChildSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'No active session.' }, { status: 401 });
  }

  const admin = createServerAdminClient();
  const family = await getFamilyForChild(admin, session.childId);
  if (!family) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const requestedDays = Number(req.nextUrl.searchParams.get('days')) || 7;
  const days = Math.min(31, Math.max(7, requestedDays));
  const calendar = await getStreakCalendar(admin, session.childId, family.timezone, days);

  return NextResponse.json({ calendar });
}
