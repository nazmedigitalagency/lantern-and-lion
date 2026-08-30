-- ==============================================================================
-- Lantern & Lion - Child/Teen Activity Tracking & Parent/Teacher Notifications
-- Builds on the existing families/children/child_progress tables.
-- ==============================================================================

-- 1. Extend existing tables ----------------------------------------------------

ALTER TABLE public.families ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Children log in from any device with just username+PIN (no family context
-- yet), so the login lookup key must be unique across the whole table, not
-- just within one family.
CREATE UNIQUE INDEX IF NOT EXISTS children_username_lower_key ON public.children (lower(username));

-- 2. New tables -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.child_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ended_reason TEXT
);
CREATE INDEX IF NOT EXISTS child_sessions_child_id_idx ON public.child_sessions (child_id);

CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.child_sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS activity_events_child_id_occurred_idx ON public.activity_events (child_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activity_events_family_id_occurred_idx ON public.activity_events (family_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.daily_activity_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  first_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  session_count INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_completed INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  quests_completed INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  achievements_earned INTEGER NOT NULL DEFAULT 0,
  top_activity TEXT,
  UNIQUE (child_id, activity_date)
);
CREATE INDEX IF NOT EXISTS daily_activity_summary_child_date_idx ON public.daily_activity_summary (child_id, activity_date DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  UNIQUE (recipient_id, dedupe_key)
);
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx ON public.notifications (recipient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_band TEXT,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS classrooms_teacher_id_idx ON public.classrooms (teacher_id);

CREATE TABLE IF NOT EXISTS public.classroom_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL DEFAULT false,
  needs_help BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (classroom_id, child_id)
);
CREATE INDEX IF NOT EXISTS classroom_students_classroom_id_idx ON public.classroom_students (classroom_id);
CREATE INDEX IF NOT EXISTS classroom_students_child_id_idx ON public.classroom_students (child_id);

-- 3. Row Level Security ----------------------------------------------------------
-- Sensitive tables: no anon/authenticated policies at all. Every read/write goes
-- through API routes that verify the real parent/teacher/child session first and
-- use the service role, matching the existing hardening migration's approach.

ALTER TABLE public.child_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.child_sessions FROM anon, authenticated;
REVOKE ALL ON public.activity_events FROM anon, authenticated;
REVOKE ALL ON public.daily_activity_summary FROM anon, authenticated;
REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT ALL ON public.child_sessions TO service_role;
GRANT ALL ON public.activity_events TO service_role;
GRANT ALL ON public.daily_activity_summary TO service_role;
GRANT ALL ON public.notifications TO service_role;

-- Defense in depth for classrooms/classroom_students (owner-scoped, same style
-- as the "Parents can manage their family" policy on public.families).
DROP POLICY IF EXISTS "Teachers can manage their classrooms" ON public.classrooms;
CREATE POLICY "Teachers can manage their classrooms"
  ON public.classrooms FOR ALL
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can manage their classroom students" ON public.classroom_students;
CREATE POLICY "Teachers can manage their classroom students"
  ON public.classroom_students FOR ALL
  TO authenticated
  USING (classroom_id IN (SELECT id FROM public.classrooms WHERE teacher_id = auth.uid()))
  WITH CHECK (classroom_id IN (SELECT id FROM public.classrooms WHERE teacher_id = auth.uid()));

GRANT ALL ON public.classrooms TO service_role;
GRANT ALL ON public.classroom_students TO service_role;
