import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { cancelChallenge } from '../../../lib/challenges/aggregate';

/** Cancels an active challenge (kept in history as `status: 'cancelled'`, never hard-deleted). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id } = await ctx.params;
  const admin = createServerAdminClient();
  const ok = await cancelChallenge(admin, user.id, id);
  if (!ok) return NextResponse.json({ error: 'Could not cancel this challenge.' }, { status: 404 });

  return NextResponse.json({ success: true });
}
