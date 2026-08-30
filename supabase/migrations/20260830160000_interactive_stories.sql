-- ==============================================================================
-- Lantern & Lion - Interactive Bible Stories
-- Per-child progress/resume state for the scene-based interactive story
-- engine (app/stories/). Story CONTENT itself is not stored here — it lives
-- as typed data in app/stories/content/*.ts, exactly like curriculum modules
-- and Adventure World regions already do. Only progress is persisted so a
-- child can resume ("Continue your adventure?") and so completion can be
-- verified server-side once (idempotent — no double XP/collectible awards).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_scene_id TEXT,
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  hints_used INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_child_story UNIQUE (child_id, story_id)
);

CREATE INDEX IF NOT EXISTS story_progress_child_idx ON public.story_progress (child_id);

ALTER TABLE public.story_progress ENABLE ROW LEVEL SECURITY;

-- Same lockdown as concept_mastery / streak_state: no anon/authenticated
-- policies — every read/write goes through API routes that verify the real
-- child session first (via the signed ll_child_session cookie), using the
-- service role.
REVOKE ALL ON public.story_progress FROM anon, authenticated;
GRANT ALL ON public.story_progress TO service_role;
