import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';

// childId always comes from the signed session cookie, never the request
// body — unlike the older app/api/adventure/* routes, this one does not
// trust a client-supplied child id.

const ChoiceRecordSchema = z.object({ sceneId: z.string().min(1).max(64), choiceId: z.string().min(1).max(64) });
const AnswerRecordSchema = z.object({ sceneId: z.string().min(1).max(64), questionId: z.string().min(1).max(64), correct: z.boolean() });

const ProgressPostSchema = z.object({
  storyId: z.string().min(1).max(64),
  currentSceneId: z.string().min(1).max(64),
  choices: z.array(ChoiceRecordSchema).max(50),
  answers: z.array(AnswerRecordSchema).max(50),
  hintsUsed: z.number().int().min(0).max(100),
});

export async function GET(req: NextRequest) {
  const session = await getChildSessionFromCookies();
  if (!session) {
    return NextResponse.json({ progress: null });
  }

  const storyId = req.nextUrl.searchParams.get('storyId');
  if (!storyId) {
    return NextResponse.json({ error: 'storyId is required' }, { status: 400 });
  }

  const admin = createServerAdminClient();
  const { data } = await admin
    .from('story_progress')
    .select('current_scene_id, choices, answers, hints_used, status')
    .eq('child_id', session.childId)
    .eq('story_id', storyId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ progress: null });
  }

  return NextResponse.json({
    progress: {
      currentSceneId: data.current_scene_id,
      choices: data.choices,
      answers: data.answers,
      hintsUsed: data.hints_used,
      status: data.status,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getChildSessionFromCookies();
  if (!session) {
    // No real session (offline / demo-only mode) — the client already
    // persists resume state locally, so this is a safe, silent no-op.
    return NextResponse.json({ success: true, persisted: false });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = ProgressPostSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid story progress payload', details: parsed.error.issues }, { status: 400 });
  }

  const { storyId, currentSceneId, choices, answers, hintsUsed } = parsed.data;
  const admin = createServerAdminClient();

  const { data: existing } = await admin
    .from('story_progress')
    .select('id, status')
    .eq('child_id', session.childId)
    .eq('story_id', storyId)
    .maybeSingle();

  // A client can never set status='completed' here — only /api/stories/complete does that.
  if (existing) {
    if (existing.status === 'completed') {
      return NextResponse.json({ success: true, persisted: true });
    }
    await admin
      .from('story_progress')
      .update({ current_scene_id: currentSceneId, choices, answers, hints_used: hintsUsed, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await admin.from('story_progress').insert({
      child_id: session.childId,
      story_id: storyId,
      current_scene_id: currentSceneId,
      choices,
      answers,
      hints_used: hintsUsed,
    });
  }

  return NextResponse.json({ success: true, persisted: true });
}
