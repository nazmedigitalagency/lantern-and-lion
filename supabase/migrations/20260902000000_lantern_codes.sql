-- ==============================================================================
-- Lantern & Lion - Child/Teen "My Lantern & Lion Codes" (Teacher Code + Game Code)
-- Two distinct per-child codes, both new columns on the existing children table.
-- ==============================================================================

-- Teacher Code: shared with a teacher so they can send a classroom connection
-- request (see POST /api/teacher/students). Long-lived, not casually
-- regenerated, since the teacher-connection flow depends on it staying stable.
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS teacher_code TEXT UNIQUE;

-- Game Code: shared with friends for multiplayer. Short-lived by convention —
-- the child can rotate it any time via POST /api/child/codes/regenerate-game-code,
-- which immediately invalidates the previous value (lookups are exact-match).
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS game_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS children_teacher_code_idx ON public.children (teacher_code);
CREATE INDEX IF NOT EXISTS children_game_code_idx ON public.children (game_code);

-- Distinguishes a teacher-initiated connection request (teacher enters the
-- student's Teacher Code) from a child self-joining with a classroom code —
-- purely informational, read by the parent-approval UI so a parent can tell
-- the two flows apart. Approval mechanics (the `approved` boolean, the
-- existing approve endpoint) are unchanged and shared by both flows.
ALTER TABLE public.classroom_students ADD COLUMN IF NOT EXISTS requested_by TEXT NOT NULL DEFAULT 'child' CHECK (requested_by IN ('child', 'teacher'));
