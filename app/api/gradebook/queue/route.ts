import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { computeGradingQueue } from '../../../lib/gradebook/aggregate';

/** The flat, filterable Gradebook queue — every submission across this teacher's classrooms (or one, via ?classroomId=). */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get('classroomId');

  const admin = createServerAdminClient();
  const items = await computeGradingQueue(admin, user.id, classroomId);
  if (items === null) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  return NextResponse.json({ items });
}
