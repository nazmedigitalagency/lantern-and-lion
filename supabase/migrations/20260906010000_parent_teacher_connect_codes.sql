-- ==============================================================================
-- Lantern & Lion - Feature: Parent & Teacher Messaging Connect Codes
-- ==============================================================================
-- Allows teachers and parents to exchange friendly, direct connect codes
-- (e.g. TCH-XXXXXX and PAR-XXXXXX) to instantly initiate direct adult-to-adult
-- educational messaging threads.

CREATE TABLE IF NOT EXISTS public.parent_teacher_connect_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'parent')),
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT parent_teacher_connect_codes_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS parent_teacher_connect_codes_code_idx ON public.parent_teacher_connect_codes (code);
CREATE INDEX IF NOT EXISTS parent_teacher_connect_codes_user_idx ON public.parent_teacher_connect_codes (user_id);

-- Enable RLS
ALTER TABLE public.parent_teacher_connect_codes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read codes (for lookup and viewing their own)
DROP POLICY IF EXISTS "Authenticated users can read connect codes" ON public.parent_teacher_connect_codes;
CREATE POLICY "Authenticated users can read connect codes"
  ON public.parent_teacher_connect_codes
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert/update their own code
DROP POLICY IF EXISTS "Users can manage their own connect codes" ON public.parent_teacher_connect_codes;
CREATE POLICY "Users can manage their own connect codes"
  ON public.parent_teacher_connect_codes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.parent_teacher_connect_codes TO service_role;
