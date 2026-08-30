import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getChildSessionFromCookies } from '../../../lib/child-session';
import { createServerAdminClient } from '../../../lib/supabase/server';
import { getLastSceneId, getStory } from '../../../stories/catalog';

const CompleteSchema = z.object({ storyId: z.string().min(1).max(64) });

type StoredAnswer = { sceneId: string; questionId: string; correct: boolean };

export async function POST(req: NextRequest) {
  const session = await getChildSessionFromCookies();
  if (!session) {
    // No real session — the client falls back to its own local idempotency
    // check rather than treating this as a hard failure.
    return NextResponse.json({ error: 'No active session' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = CompleteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 });
  }

  const { storyId } = parsed.data;
  const story = getStory(storyId);
  if (!story) {
    return NextResponse.json({ error: 'Unknown story' }, { status: 404 });
  }

  const admin = createServerAdminClient();
  const { data: row } = await admin
    .from('story_progress')
    .select('id, status, current_scene_id, answers')
    .eq('child_id', session.childId)
    .eq('story_id', storyId)
    .maybeSingle();

  if (row?.status === 'completed') {
    return NextResponse.json({ error: 'Story already completed' }, { status: 409 });
  }

  // Validate server-side that stored progress actually reached the final
  // scene and satisfied its requiredScore — never trust a client-sent
  // "completed" flag as the source of truth.
  const lastSceneId = getLastSceneId(story);
  const finalScene = story.scenes.find((s) => s.id === lastSceneId);
  const reachedFinalScene = row?.current_scene_id === lastSceneId;

  let meetsRequiredScore = true;
  if (finalScene?.type === 'FINAL_CHALLENGE') {
    const answers = (row?.answers as StoredAnswer[]) || [];
    const correctOnFinalScene = answers.filter((a) => a.sceneId === finalScene.id && a.correct).length;
    meetsRequiredScore = correctOnFinalScene >= finalScene.requiredScore;
  }

  if (!reachedFinalScene || !meetsRequiredScore) {
    return NextResponse.json({ error: 'Story not yet completed' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  if (row) {
    await admin.from('story_progress').update({ status: 'completed', completed_at: nowIso, updated_at: nowIso }).eq('id', row.id);
  } else {
    await admin.from('story_progress').insert({
      child_id: session.childId,
      story_id: storyId,
      current_scene_id: lastSceneId,
      status: 'completed',
      completed_at: nowIso,
    });
  }

  return NextResponse.json({
    firstCompletion: true,
    reward: story.reward,
    adventure: story.adventure,
  });
}
