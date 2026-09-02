import { NextRequest, NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';
import { ensureChildCodes } from '../../../lib/codes/server';

export async function GET(req: NextRequest) {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const limit = checkRateLimit(`child-codes:${session.childId}:${getClientIp(req)}`, { maxRequests: 30, windowSeconds: 60 });
  if (!limit.allowed) return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });

  const admin = createServerAdminClient();
  try {
    const codes = await ensureChildCodes(admin, session.childId);
    return NextResponse.json(codes);
  } catch {
    return NextResponse.json({ error: 'Could not load your codes right now.' }, { status: 500 });
  }
}
