-- Feature 8 (Teacher Gradebook): records when a teacher deliberately overrides
-- an automatically-generated score, instead of silently overwriting it.
-- `original_score` preserves what the auto-scorer produced at the moment of
-- the first override, so the record of "an override occurred" is never lost.
ALTER TABLE public.assignment_submissions
  ADD COLUMN IF NOT EXISTS score_overridden BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_score INTEGER CHECK (original_score IS NULL OR (original_score >= 0 AND original_score <= 100));
