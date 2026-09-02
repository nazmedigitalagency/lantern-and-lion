import { NextRequest, NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../../lib/child-session';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { checkRateLimit, getClientIp } from '../../../../lib/rate-limit';
import { regenerateGameCode } from '../../../../lib/codes/server';

export async function POST(req: NextRequest) {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const limit = checkRateLimit(`child-codes-regen:${session.childId}:${getClientIp(req)}`, { maxRequests: 5, windowSeconds: 3600 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'You can only get a new Game Code a few times per hour. Please try again later.' }, { status: 429 });
  }

  const admin = createServerAdminClient();
  try {
    const gameCode = await regenerateGameCode(admin, session.childId);
    return NextResponse.json({ gameCode });
  } catch {
    return NextResponse.json({ error: 'Could not generate a new Game Code right now.' }, { status: 500 });
  }
}
