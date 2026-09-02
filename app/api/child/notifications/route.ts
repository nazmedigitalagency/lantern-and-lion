import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';
import { pruneOldChildNotifications } from '../../../lib/activity/server';

/**
 * The child/teen's own notification center — scoped entirely by the
 * verified child_session cookie, never a client-supplied id, so a student
 * can only ever read their own rows (see notifications_one_recipient_check
 * + the recipient_child_id FK in the 20260903000000 migration).
 */
export async function GET(req: NextRequest) {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 30));

  const rateLimit = checkRateLimit(`child-notifications:${session.childId}:${getClientIp(req)}`, { maxRequests: 60, windowSeconds: 60 });
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });

  const admin = createServerAdminClient();
  await pruneOldChildNotifications(admin, session.childId);

  const [{ data: rows }, { count: unreadCount }] = await Promise.all([
    admin
      .from('notifications')
      .select('id, type, title, body, payload, created_at, read_at')
      .eq('recipient_child_id', session.childId)
      .order('created_at', { ascending: false })
      .limit(limit),
    admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_child_id', session.childId)
      .is('read_at', null),
  ]);

  const notifications = (rows || []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    payload: n.payload || {},
    createdAt: n.created_at,
    readAt: n.read_at,
  }));

  return NextResponse.json({ notifications, unreadCount: unreadCount || 0 });
}

const PatchSchema = z.object({ id: z.string().uuid(), read: z.boolean() });

export async function PATCH(req: NextRequest) {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const admin = createServerAdminClient();
  await admin
    .from('notifications')
    .update({ read_at: parsed.data.read ? new Date().toISOString() : null })
    .eq('id', parsed.data.id)
    .eq('recipient_child_id', session.childId);

  return NextResponse.json({ success: true });
}
