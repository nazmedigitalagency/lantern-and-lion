import { NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { activityDateKey, getFamilyForChild } from '../../../lib/activity/server';
import { getStreakStatus } from '../../../lib/streak/server';

/** The child/teen's own "Your Day" summary — never exposes parent, teacher, or family details. */
export async function GET() {
  const session = await getChildSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'No active session.' }, { status: 401 });
  }

  const admin = createServerAdminClient();
  const family = await getFamilyForChild(admin, session.childId);
  if (!family) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const todayKey = activityDateKey(family.timezone);
  const { data: summary } = await admin
    .from('daily_activity_summary')
    .select('active_seconds, games_played, games_completed, lessons_completed, quests_completed, xp_earned, achievements_earned')
    .eq('child_id', session.childId)
    .eq('activity_date', todayKey)
    .maybeSingle();

  const streak = await getStreakStatus(admin, session.childId, family.timezone);

  return NextResponse.json({
    summary: summary || {
      active_seconds: 0,
      games_played: 0,
      games_completed: 0,
      lessons_completed: 0,
      quests_completed: 0,
      xp_earned: 0,
      achievements_earned: 0,
    },
    streak,
  });
}
