import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../lib/supabase/route-client';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { computeTeacherChallenges, createChallenge } from '../../../lib/challenges/aggregate';

const MAX_RANGE_DAYS = 180;

const CreateSchema = z
  .object({
    classroomId: z.string().uuid(),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    goalType: z.enum(['activities', 'stories', 'lessons', 'xp']),
    goalTarget: z.number().int().min(1).max(1_000_000),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    rewardType: z.enum(['xp', 'none']).default('none'),
    rewardAmount: z.number().int().min(0).max(100_000).default(0),
  })
  .refine((v) => v.endDate >= v.startDate, { message: 'End date must be on or after the start date.' })
  .refine((v) => {
    const days = (new Date(`${v.endDate}T00:00:00Z`).getTime() - new Date(`${v.startDate}T00:00:00Z`).getTime()) / 86_400_000;
    return days <= MAX_RANGE_DAYS;
  }, { message: `Challenges can run for at most ${MAX_RANGE_DAYS} days.` });

/** Teacher's own challenges — every classroom, or one via ?classroomId=. */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get('classroomId');

  const admin = createServerAdminClient();
  const challenges = await computeTeacherChallenges(admin, user.id, classroomId);
  if (challenges === null) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  return NextResponse.json({ challenges });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in as a teacher first.' }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid challenge.' }, { status: 400 });

  const admin = createServerAdminClient();
  const result = await createChallenge(admin, user.id, {
    classroomId: parsed.data.classroomId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    goalType: parsed.data.goalType,
    goalTarget: parsed.data.goalTarget,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    rewardType: parsed.data.rewardType,
    rewardAmount: parsed.data.rewardAmount,
  });

  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json({ success: true, id: result.id });
}
