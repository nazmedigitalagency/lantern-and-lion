-- ==============================================================================
-- Lantern & Lion - Learning Streak System
-- Server-authoritative streak state, built on the activity-tracking tables
-- (daily_activity_summary) added in 20260830120000_activity_tracking.sql.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.streak_state (
  child_id UUID PRIMARY KEY REFERENCES public.children(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_qualified_date DATE,
  grace_days INTEGER NOT NULL DEFAULT 2,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.streak_milestone_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  milestone INTEGER NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, milestone)
);

-- Records which specific missed calendar date was forgiven by a Grace Day,
-- so the streak calendar can render a shield instead of a blank day.
CREATE TABLE IF NOT EXISTS public.streak_grace_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  missed_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, missed_date)
);
CREATE INDEX IF NOT EXISTS streak_grace_log_child_date_idx ON public.streak_grace_log (child_id, missed_date DESC);

ALTER TABLE public.streak_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_milestone_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_grace_log ENABLE ROW LEVEL SECURITY;

-- Same lockdown as the other activity-tracking tables: no anon/authenticated
-- policies at all — every read/write goes through API routes that verify the
-- real parent/teacher/child session first, using the service role.
REVOKE ALL ON public.streak_state FROM anon, authenticated;
REVOKE ALL ON public.streak_milestone_claims FROM anon, authenticated;
REVOKE ALL ON public.streak_grace_log FROM anon, authenticated;
GRANT ALL ON public.streak_state TO service_role;
GRANT ALL ON public.streak_milestone_claims TO service_role;
GRANT ALL ON public.streak_grace_log TO service_role;
