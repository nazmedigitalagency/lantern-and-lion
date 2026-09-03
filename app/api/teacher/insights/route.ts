import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { computeClassInsights } from '../../../lib/insights/aggregate';

/**
 * Teacher Insights — one request, computed fresh from real data every time
 * (assignments, submissions, concept mastery), scoped to this teacher's own
 * classrooms/students only. No separate analytics tables, no polling; the
 * teacher opens the page and gets a snapshot as of that moment.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const classroomId = req.nextUrl.searchParams.get('classroomId');
  const admin = createServerAdminClient();
  const result = await computeClassInsights(admin, user.id, classroomId || undefined);
  if (!result) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  return NextResponse.json(result);
}
