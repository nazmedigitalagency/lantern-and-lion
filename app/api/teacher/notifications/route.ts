import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { syncTeacherNotifications } from '../../../lib/teacher-notifications/server';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  }

  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 30));
  const filter = req.nextUrl.searchParams.get('filter') || 'all';
  const admin = createServerAdminClient();

  // Run smart sync before returning list
  await syncTeacherNotifications(admin, user.id).catch(() => {});

  let query = admin
    .from('notifications')
    .select('id, type, title, body, priority, payload, created_at, read_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filter === 'unread') {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Could not fetch notifications.' }, { status: 500 });
  }

  const notifications = (data || []).map((n) => {
    const payload = (n.payload || {}) as Record<string, unknown>;
    const priority = n.priority || payload.priority || 'normal';
    return {
      ...n,
      priority,
    };
  });

  const filtered = filter === 'high' ? notifications.filter((n) => n.priority === 'high') : notifications;
  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const highPriorityCount = notifications.filter((n) => n.priority === 'high' && !n.read_at).length;

  return NextResponse.json({ notifications: filtered, unreadCount, highPriorityCount });
}

const PatchSchema = z.object({ id: z.string().uuid(), read: z.boolean() });

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid notification update.' }, { status: 400 });
  }

  const admin = createServerAdminClient();
  const { error } = await admin
    .from('notifications')
    .update({ read_at: parsed.data.read ? new Date().toISOString() : null })
    .eq('id', parsed.data.id)
    .eq('recipient_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Could not update notification.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
