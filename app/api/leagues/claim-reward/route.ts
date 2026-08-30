import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSeasonReward } from '../../../lib/leagues/config';
import type { LeagueTierId } from '../../../lib/leagues/types';
import { createServerAdminClient } from '../../../lib/supabase/server';

const ClaimSchema = z.object({
  childId: z.string().uuid(),
  seasonId: z.string().min(1).max(64),
  tier: z.enum(['bronze', 'silver', 'gold', 'lion']),
  rank: z.number().int().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = ClaimSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid claim reward parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { childId, seasonId, tier, rank } = parsed.data;
    const admin = createServerAdminClient();

    // Check if already claimed in season_results
    const { data: existing } = await admin
      .from('season_results')
      .select('id, reward_claimed')
      .eq('child_id', childId)
      .eq('season_id', seasonId)
      .maybeSingle();

    if (existing?.reward_claimed) {
      return NextResponse.json(
        { error: 'Reward has already been claimed for this season.' },
        { status: 409 }
      );
    }

    const rewards = getSeasonReward(tier as LeagueTierId, rank);

    // Record or update season result as claimed
    if (existing) {
      await admin
        .from('season_results')
        .update({
          reward_claimed: true,
          rewards,
          completed_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await admin.from('season_results').insert({
        child_id: childId,
        season_id: seasonId,
        final_tier: tier,
        final_rank: rank,
        reward_claimed: true,
        rewards,
        completed_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully claimed rewards for Season ${seasonId}!`,
      rewards,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process season reward claim', details: errorMessage },
      { status: 500 }
    );
  }
}
