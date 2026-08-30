import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getItem } from '../../../character/catalog';

const PurchaseSchema = z.object({
  profileId: z.number().int().positive(),
  itemId: z.string().min(1).max(64),
  clientTimestamp: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PurchaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid purchase request parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { profileId, itemId } = parsed.data;
    const item = getItem(itemId);

    if (!item) {
      return NextResponse.json(
        { error: `Item '${itemId}' not found in the Lantern Catalog.` },
        { status: 404 }
      );
    }

    // Security validation: price cannot be negative
    const priceCoins = Math.max(0, item.priceCoins ?? 0);
    const priceGems = Math.max(0, item.priceGems ?? 0);

    return NextResponse.json({
      success: true,
      profileId,
      message: `Verified purchase of ${item.name}`,
      item: {
        id: item.id,
        name: item.name,
        slot: item.slot,
        rarity: item.rarity || 'common',
        priceCoins,
        priceGems,
      },
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process purchase request', details: errorMessage },
      { status: 500 }
    );
  }
}
