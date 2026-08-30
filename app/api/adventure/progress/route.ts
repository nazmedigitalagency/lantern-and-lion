import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerAdminClient } from '../../../lib/supabase/server';

const ProgressSchema = z.object({
  childId: z.string().uuid(),
  locationId: z.string().min(1).max(64),
  chapterId: z.string().optional(),
  progressPercent: z.number().int().min(0).max(100),
  completed: z.boolean().optional(),
  mastered: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = ProgressSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid adventure progress parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { childId, locationId, progressPercent, completed, mastered } = parsed.data;
    const admin = createServerAdminClient();

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
          progress: Math.max(existing.progress || 0, progressPercent),
          completed: existing.completed || completed || false,
          mastered: existing.mastered || mastered || false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await admin.from('user_adventure_progress').insert({
        child_id: childId,
        location_id: locationId,
        progress: progressPercent,
        completed: completed || false,
        mastered: mastered || false,
        unlocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      locationId,
      progress: progressPercent,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to record adventure progress', details: errorMessage },
      { status: 500 }
    );
  }
}
