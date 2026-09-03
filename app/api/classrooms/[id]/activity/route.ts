import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../../lib/supabase/server';
import { computeClassActivity } from '../../../../lib/timeline/aggregate';
import type { TimelineRange } from '../../../../lib/timeline/types';

const VALID_RANGES: TimelineRange[] = ['today', 'week', 'month', 'custom'];

/** Class-level Activity tab (Feature 7) — aggregate counts only, scoped to classrooms this teacher owns. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get('range') || 'week';
  const range: TimelineRange = VALID_RANGES.includes(rangeParam as TimelineRange) ? (rangeParam as TimelineRange) : 'week';
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const admin = createServerAdminClient();
  const result = await computeClassActivity(admin, user.id, id, range, start, end);
  if (!result) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  return NextResponse.json(result);
}
