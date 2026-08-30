import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSeason } from '../../lib/leagues/config';
import { getVerifiedLeaguePod } from '../../lib/leagues/server';
import { createServerAdminClient } from '../../lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId');
    const season = getCurrentSeason();

    if (!childId) {
      return NextResponse.json({
        season,
        message: 'Current season active',
      });
    }

    const admin = createServerAdminClient();
    const pod = await getVerifiedLeaguePod(admin, childId, season.id);

    return NextResponse.json({
      season,
      pod,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch league information', details: errorMessage },
      { status: 500 }
    );
  }
}
