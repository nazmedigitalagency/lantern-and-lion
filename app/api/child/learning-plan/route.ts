import { NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { getFamilyForChild } from '../../../lib/activity/server';
import { getConceptMasteryForChild, recommendNextActivity, summarizeMastery } from '../../../lib/adaptive/server';

/** The child/teen's own personalized learning plan — "Your Learning Journey" / "Personalized Learning". */
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

  const { data: child } = await admin.from('children').select('age').eq('id', session.childId).maybeSingle();
  const track = (child?.age ?? 8) >= 13 ? 'teen' : (child?.age ?? 8) <= 7 ? 'early' : 'pathfinder';

  const rows = await getConceptMasteryForChild(admin, session.childId);
  const summary = summarizeMastery(rows, track);
  const recommended = recommendNextActivity(rows, track);

  return NextResponse.json({ summary, recommended });
}
