import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerAdminClient } from '../../../lib/supabase/server';

const CollectSchema = z.object({
  childId: z.string().uuid(),
  collectibleId: z.string().min(1).max(64),
  locationId: z.string().min(1).max(64),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = CollectSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid collectible parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { childId, collectibleId, locationId } = parsed.data;
    const admin = createServerAdminClient();

    const { data: existing } = await admin
      .from('user_collectibles')
      .select('id')
      .eq('child_id', childId)
      .eq('collectible_id', collectibleId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Collectible has already been discovered.' },
        { status: 409 }
      );
    }

    await admin.from('user_collectibles').insert({
      child_id: childId,
      collectible_id: collectibleId,
      location_id: locationId,
      collected_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Collectible ${collectibleId} recorded in player pouch.`,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to record collectible', details: errorMessage },
      { status: 500 }
    );
  }
}
