import { NextResponse } from 'next/server';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { computeStudentChallenges } from '../../../lib/challenges/aggregate';

/** The student-facing class challenge list — same challenge rows the teacher's Gradebook-style Challenges tab reads, scoped to this child's own approved classrooms via their session cookie. */
export async function GET() {
  const session = await getChildSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const admin = createServerAdminClient();
  const challenges = await computeStudentChallenges(admin, session.childId);

  return NextResponse.json({ challenges });
}
