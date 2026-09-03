-- Feature 9: teacher-created, class-scoped challenges. Progress is always
-- computed live from existing activity tables (daily_activity_summary,
-- story_progress) — these two tables only hold the challenge definition
-- itself and a per-child reward-award dedupe log, never a duplicate
-- progress/XP ledger.

CREATE TABLE public.class_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('activities', 'stories', 'lessons', 'xp')),
  goal_target INTEGER NOT NULL CHECK (goal_target > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  -- Reward is XP-only, deliberately: XP is the one reward type this app can
  -- award server-side and authoritatively (same path as assignments.xp_reward).
  -- Coins/gems only exist in a client-only local wallet unrelated to the
  -- teacher/classroom system, so they are not offered here.
  reward_type TEXT NOT NULL DEFAULT 'none' CHECK (reward_type IN ('xp', 'none')),
  reward_amount INTEGER NOT NULL DEFAULT 0 CHECK (reward_amount >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  completed_at TIMESTAMPTZ,
  notified_started BOOLEAN NOT NULL DEFAULT false,
  notified_near_complete BOOLEAN NOT NULL DEFAULT false,
  notified_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE TABLE public.class_challenge_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.class_challenges(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, child_id)
);

CREATE INDEX idx_class_challenges_classroom ON public.class_challenges(classroom_id);
CREATE INDEX idx_class_challenges_teacher_status ON public.class_challenges(teacher_id, status);
CREATE INDEX idx_class_challenge_rewards_challenge ON public.class_challenge_rewards(challenge_id);

ALTER TABLE public.class_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_challenge_rewards ENABLE ROW LEVEL SECURITY;

-- Defense-in-depth only, matching the rest of the schema — all real access
-- goes through service-role API routes that check teacher/child ownership.
CREATE POLICY class_challenges_owner ON public.class_challenges FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY class_challenge_rewards_via_challenge ON public.class_challenge_rewards FOR ALL USING (
  EXISTS (SELECT 1 FROM public.class_challenges c WHERE c.id = challenge_id AND c.teacher_id = auth.uid())
);
