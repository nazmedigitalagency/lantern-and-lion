-- ==============================================================================
-- Lantern & Lion - Production Database Security Hardening Migration
-- Complies with Security Template Guidelines (RLS, Grants, Function Hardening)
-- ==============================================================================

-- 1. Function Hardening: Fixed search_path and execution privileges
-- Ensure all SECURITY DEFINER functions explicitly lock down search_path
-- and revoke public execution grants where appropriate.

-- Example: Secure Click Tracking RPC
CREATE OR REPLACE FUNCTION public.record_ad_click(
  p_ad_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Validate input parameters
  IF p_ad_id IS NULL OR length(trim(p_ad_id)) = 0 THEN
    RAISE EXCEPTION 'Invalid ad identifier';
  END IF;

  -- Insert click record
  INSERT INTO public.ad_clicks (ad_id, user_id, metadata, created_at)
  VALUES (p_ad_id, p_user_id, p_metadata, now());

  RETURN jsonb_build_object('success', true, 'recorded_at', now());
END;
$$;

-- Revoke default public execution; restrict to service_role only
REVOKE EXECUTE ON FUNCTION public.record_ad_click(TEXT, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ad_click(TEXT, UUID, JSONB) TO service_role;


-- Example: Secure Affiliate Movie Click Tracking RPC
CREATE OR REPLACE FUNCTION public.record_affiliate_movie_click(
  p_movie_id TEXT,
  p_affiliate_tag TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_movie_id IS NULL OR length(trim(p_movie_id)) = 0 THEN
    RAISE EXCEPTION 'Invalid movie identifier';
  END IF;

  INSERT INTO public.affiliate_clicks (movie_id, affiliate_tag, user_id, created_at)
  VALUES (p_movie_id, p_affiliate_tag, p_user_id, now());

  RETURN jsonb_build_object('success', true, 'recorded_at', now());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_affiliate_movie_click(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_affiliate_movie_click(TEXT, TEXT, UUID) TO service_role;


-- 2. Enforce Row Level Security (RLS) on all tables

DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
  END LOOP;
END;
$$;


-- 3. Table Level Privilege Hardening
-- Revoke direct INSERT/UPDATE/DELETE grants from anon on protected tables

DO $$
DECLARE
  prot_table TEXT;
  protected_tables TEXT[] := ARRAY[
    'users',
    'profiles',
    'families',
    'child_profiles',
    'parent_profiles',
    'teacher_profiles',
    'admin_users',
    'push_tokens',
    'ad_clicks',
    'affiliate_clicks',
    'game_analytics',
    'help_requests',
    'subscriptions',
    'audit_events'
  ];
BEGIN
  FOREACH prot_table IN ARRAY protected_tables
  LOOP
    IF EXISTS (
      SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = prot_table
    ) THEN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon;', prot_table);
      EXECUTE format('GRANT ALL ON public.%I TO service_role;', prot_table);
    END IF;
  END LOOP;
END;
$$;


-- 4. Safe User Data RLS Policies (Owner-only access, no WITH CHECK (true))

-- Profiles: Users can view and edit only their own record
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END;
$$;
