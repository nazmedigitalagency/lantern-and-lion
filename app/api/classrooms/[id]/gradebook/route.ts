import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { computeClassGradebook } from '../../../../lib/gradebook/aggregate';

/** The spreadsheet-like Class Gradebook (Feature 8) — scoped to classrooms this teacher owns. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id } = await ctx.params;
  const admin = createServerAdminClient();
  const result = await computeClassGradebook(admin, user.id, id);
  if (!result) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  return NextResponse.json(result);
}
