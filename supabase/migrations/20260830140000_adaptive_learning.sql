-- ==============================================================================
-- Lantern & Lion - Adaptive Learning Engine
-- Concept-level mastery, keyed to the existing curriculum module ids
-- (app/curriculum-data.ts) — no separate content/tag system is introduced.
-- Learning events themselves are NOT duplicated here; they already flow
-- through `activity_events` (LESSON_COMPLETED / GAME_COMPLETED). This table
-- is the derived, incrementally-updated mastery state per (child, concept).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.concept_mastery (
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'introduced',
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  consecutive_correct INTEGER NOT NULL DEFAULT 0,
  consecutive_incorrect INTEGER NOT NULL DEFAULT 0,
  review_interval_days INTEGER NOT NULL DEFAULT 1,
  last_practiced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, concept_id)
);

CREATE INDEX IF NOT EXISTS concept_mastery_child_review_idx ON public.concept_mastery (child_id, next_review_at);
CREATE INDEX IF NOT EXISTS concept_mastery_child_status_idx ON public.concept_mastery (child_id, status);

ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;

-- Same lockdown as the other learning-data tables: no anon/authenticated
-- policies — every read/write goes through API routes that verify the real
-- parent/teacher/child session first, using the service role.
REVOKE ALL ON public.concept_mastery FROM anon, authenticated;
GRANT ALL ON public.concept_mastery TO service_role;
