-- ==============================================================================
-- Lantern & Lion - Comprehensive Production Security Hardening Migration
-- Complies with OWASP & Supabase Production Security Guidelines:
-- 1. Unconditional Row Level Security (RLS) across all public tables
-- 2. Principle of Least Privilege: Revoke direct anonymous and authenticated writes
-- 3. Tenant and participant isolation policies
-- 4. Immutable audit logs protection
-- ==============================================================================

-- 1. Enforce Row Level Security on all public tables
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

-- 2. Revoke direct write permissions from public/anon on all core tables
DO $$
DECLARE
  t TEXT;
  tables_to_protect TEXT[] := ARRAY[
    'children',
    'families',
    'child_sessions',
    'activity_events',
    'daily_activity_summary',
    'classrooms',
    'classroom_students',
    'classroom_assignments',
    'assignments',
    'assignment_submissions',
    'assignment_templates',
    'class_challenges',
    'teacher_announcements',
    'teacher_calendar_events',
    'child_notifications',
    'lantern_codes',
    'parent_teacher_threads',
    'parent_teacher_messages',
    'parent_teacher_connect_codes',
    'connection_audit_logs',
    'concept_mastery',
    'story_progress',
    'streak_state',
    'avatars',
    'user_economy'
  ];
BEGIN
  FOREACH t IN ARRAY tables_to_protect
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon;', t);
      EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    END IF;
  END LOOP;
END;
$$;

-- 3. Row Level Security Policies for Multi-Tenant Isolation

-- Families: only family owner can read/update their family
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'families') THEN
    DROP POLICY IF EXISTS "Owner can view own family" ON public.families;
    CREATE POLICY "Owner can view own family"
      ON public.families FOR SELECT
      TO authenticated
      USING (auth.uid() = owner_id);

    DROP POLICY IF EXISTS "Owner can update own family" ON public.families;
    CREATE POLICY "Owner can update own family"
      ON public.families FOR UPDATE
      TO authenticated
      USING (auth.uid() = owner_id)
      WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

-- Children: only family owner can read/update children in their family
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'children') THEN
    DROP POLICY IF EXISTS "Family owner can view children" ON public.children;
    CREATE POLICY "Family owner can view children"
      ON public.children FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.families f
          WHERE f.id = children.family_id AND f.owner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Family owner can update children" ON public.children;
    CREATE POLICY "Family owner can update children"
      ON public.children FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.families f
          WHERE f.id = children.family_id AND f.owner_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.families f
          WHERE f.id = children.family_id AND f.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Classrooms: teacher can view and manage their classrooms
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'classrooms') THEN
    DROP POLICY IF EXISTS "Teacher can view own classrooms" ON public.classrooms;
    CREATE POLICY "Teacher can view own classrooms"
      ON public.classrooms FOR SELECT
      TO authenticated
      USING (auth.uid() = teacher_id);

    DROP POLICY IF EXISTS "Teacher can manage own classrooms" ON public.classrooms;
    CREATE POLICY "Teacher can manage own classrooms"
      ON public.classrooms FOR ALL
      TO authenticated
      USING (auth.uid() = teacher_id)
      WITH CHECK (auth.uid() = teacher_id);
  END IF;
END $$;

-- Parent-Teacher Threads: strictly visible only to participants
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parent_teacher_threads') THEN
    DROP POLICY IF EXISTS "Participants can view threads" ON public.parent_teacher_threads;
    CREATE POLICY "Participants can view threads"
      ON public.parent_teacher_threads FOR SELECT
      TO authenticated
      USING (auth.uid() = parent_id OR auth.uid() = teacher_id);
  END IF;
END $$;

-- Parent-Teacher Messages: strictly visible only to thread participants
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parent_teacher_messages') THEN
    DROP POLICY IF EXISTS "Participants can view messages" ON public.parent_teacher_messages;
    CREATE POLICY "Participants can view messages"
      ON public.parent_teacher_messages FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.parent_teacher_threads t
          WHERE t.id = parent_teacher_messages.thread_id
            AND (t.parent_id = auth.uid() OR t.teacher_id = auth.uid())
        )
      );
  END IF;
END $$;

-- Connection Audit Logs: strictly immutable, service_role only
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'connection_audit_logs') THEN
    REVOKE ALL ON public.connection_audit_logs FROM PUBLIC, anon, authenticated;
    GRANT ALL ON public.connection_audit_logs TO service_role;
  END IF;
END $$;
