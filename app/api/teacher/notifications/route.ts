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

  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 25));
  const admin = createServerAdminClient();

  // Run smart sync before returning list
  await syncTeacherNotifications(admin, user.id).catch(() => {});

  const { data, error } = await admin
    .from('notifications')
    .select('id, type, title, body, payload, created_at, read_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: 'Could not fetch notifications.' }, { status: 500 });
  }

  const notifications = data || [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return NextResponse.json({ notifications, unreadCount });
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
