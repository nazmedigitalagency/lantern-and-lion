import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import {
  getTeacherNotificationPreferences,
  updateTeacherNotificationPreferences,
} from '../../../lib/teacher-notifications/server';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  }

  const admin = createServerAdminClient();
  const preferences = await getTeacherNotificationPreferences(admin, user.id);
  return NextResponse.json({ preferences });
}

const UpdatePreferencesSchema = z.object({
  assignment_submissions: z.boolean().optional(),
  grading_reminders: z.boolean().optional(),
  challenge_updates: z.boolean().optional(),
  student_inactivity_alerts: z.boolean().optional(),
  upcoming_deadlines: z.boolean().optional(),
  upcoming_events: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = UpdatePreferencesSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid preference values.' }, { status: 400 });
  }

  const admin = createServerAdminClient();
  const updated = await updateTeacherNotificationPreferences(admin, user.id, parsed.data);

  return NextResponse.json({ success: true, preferences: updated });
}
