import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../lib/supabase/route-client';
import { createServerAdminClient } from '../../lib/supabase/server';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 20));
  const admin = createServerAdminClient();
  const { data } = await admin
    .from('notifications')
    .select('id, child_id, type, title, body, payload, created_at, read_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return NextResponse.json({ notifications: data || [] });
}

const PatchSchema = z.object({ id: z.string().uuid(), read: z.boolean() });

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const admin = createServerAdminClient();
  await admin
    .from('notifications')
    .update({ read_at: parsed.data.read ? new Date().toISOString() : null })
    .eq('id', parsed.data.id)
    .eq('recipient_id', user.id);

  return NextResponse.json({ success: true });
}
