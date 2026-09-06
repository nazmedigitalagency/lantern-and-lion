import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';

const UpdateChurchSchema = z.object({
  churchName: z.string().trim().min(2, 'Church or Sunday School name must be at least 2 characters').max(120),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = UpdateChurchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please provide a valid Church or Sunday School name.' },
      { status: 400 }
    );
  }

  const churchName = parsed.data.churchName;
  const admin = createServerAdminClient();

  // 1. Update user metadata in Supabase Auth
  const currentMetadata = user.user_metadata || {};
  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...currentMetadata,
      church_name: churchName,
    },
  });

  if (authError) {
    return NextResponse.json({ error: 'Could not update user profile.' }, { status: 500 });
  }

  // 2. Update any existing classrooms belonging to this teacher where church_or_org is null
  try {
    await admin
      .from('classrooms')
      .update({ church_or_org: churchName })
      .eq('teacher_id', user.id)
      .is('church_or_org', null);
  } catch {
    // Non-fatal if classrooms table update fails
  }

  return NextResponse.json({ success: true, churchName });
}
