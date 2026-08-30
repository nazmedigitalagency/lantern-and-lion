-- ============================================================================
-- Migration: Leagues & Seasons Progression System
-- Created: 2026-08-30
-- Description:
--   Supports competitive tiers (Bronze, Silver, Gold, Lion), recurring seasons,
--   manageable competition pods, rank settlements, and verified digital certificates.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  season_number INT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  duration_days INT NOT NULL DEFAULT 21,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'upcoming')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.season_pods (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'lion')),
  age_group TEXT NOT NULL CHECK (age_group IN ('child', 'teen')),
  max_size INT NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.season_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  pod_id TEXT NOT NULL REFERENCES public.season_pods(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  season_xp INT NOT NULL DEFAULT 0,
  lifetime_xp INT NOT NULL DEFAULT 0,
  league_tier TEXT NOT NULL DEFAULT 'bronze' CHECK (league_tier IN ('bronze', 'silver', 'gold', 'lion')),
  streak_days INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_season_child UNIQUE (season_id, child_id)
);

CREATE TABLE IF NOT EXISTS public.season_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  final_tier TEXT NOT NULL CHECK (final_tier IN ('bronze', 'silver', 'gold', 'lion')),
  final_rank INT NOT NULL,
  total_season_xp INT NOT NULL DEFAULT 0,
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
  certificate_id TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_child_season_result UNIQUE (child_id, season_id)
);

CREATE TABLE IF NOT EXISTS public.season_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'lion')),
  rank_min INT NOT NULL,
  rank_max INT NOT NULL,
  coins INT NOT NULL DEFAULT 0,
  gems INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  cosmetic_item_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid leaderboard sorting & lookups
CREATE INDEX IF NOT EXISTS idx_season_participants_pod ON public.season_participants(pod_id, season_xp DESC);
CREATE INDEX IF NOT EXISTS idx_season_participants_child ON public.season_participants(child_id);
CREATE INDEX IF NOT EXISTS idx_season_results_child ON public.season_results(child_id);

-- Enable Row Level Security
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Read-only for authenticated/anon users, write via service role
CREATE POLICY "Seasons viewable by everyone"
  ON public.seasons FOR SELECT
  USING (true);

CREATE POLICY "Pods viewable by everyone"
  ON public.season_pods FOR SELECT
  USING (true);

CREATE POLICY "Season rewards viewable by everyone"
  ON public.season_rewards FOR SELECT
  USING (true);

CREATE POLICY "Participants viewable by authenticated users"
  ON public.season_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Results viewable by authenticated child or parent"
  ON public.season_results FOR SELECT
  TO authenticated
  USING (true);

-- Service role bypass
GRANT ALL ON public.seasons TO service_role;
GRANT ALL ON public.season_pods TO service_role;
GRANT ALL ON public.season_participants TO service_role;
GRANT ALL ON public.season_results TO service_role;
GRANT ALL ON public.season_rewards TO service_role;
