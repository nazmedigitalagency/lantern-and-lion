import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRegion } from '../../../adventure/world-data';
import type { RegionId } from '../../../adventure/types';
import { createServerAdminClient } from '../../../lib/supabase/server';

const BossCompleteSchema = z.object({
  childId: z.string().uuid(),
  locationId: z.enum(['creation', 'eden', 'noah', 'egypt', 'wilderness', 'jerusalem', 'gospels', 'early-church']),
  bossId: z.string().min(1).max(64),
  score: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = BossCompleteSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid boss completion parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { childId, locationId, bossId, score } = parsed.data;
    const region = getRegion(locationId as RegionId);

    if (!region || region.boss.id !== bossId) {
      return NextResponse.json(
        { error: 'Invalid boss or location specified.' },
        { status: 404 }
      );
    }

    if (score < region.boss.requiredScore) {
      return NextResponse.json(
        { error: `Score ${score} does not meet required mastery score of ${region.boss.requiredScore}.` },
        { status: 400 }
      );
    }

    const admin = createServerAdminClient();

    // Mark location as completed & mastered in user_adventure_progress
    const { data: existing } = await admin
      .from('user_adventure_progress')
      .select('id, progress, completed, mastered')
      .eq('child_id', childId)
      .eq('location_id', locationId)
      .maybeSingle();

    if (existing) {
      await admin
        .from('user_adventure_progress')
        .update({
          progress: 100,
          completed: true,
          mastered: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await admin.from('user_adventure_progress').insert({
        child_id: childId,
        location_id: locationId,
        progress: 100,
        completed: true,
        mastered: true,
        completed_at: new Date().toISOString(),
        unlocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Congratulations! ${region.name} mastered!`,
      rewards: region.boss.reward,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to record boss completion', details: errorMessage },
      { status: 500 }
    );
  }
}
