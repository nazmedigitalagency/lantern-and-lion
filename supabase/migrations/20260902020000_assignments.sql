-- ==============================================================================
-- Lantern & Lion - Real, DB-backed teacher Assignments
--
-- Supersedes the classroom-only classroom_assignments table from the previous
-- migration (never released to students, no real usage yet) with a proper
-- assignment model: draft/publish, per-student targeting (whole classroom OR
-- hand-picked students), and a real submissions/grading lifecycle. Content
-- still always points at something the app already knows how to complete
-- (an interactive story, a curriculum concept, or one of the arcade games
-- that already reports GAME_COMPLETED) — "written"/"custom" are the only
-- types with no automatic content, by design, since they need a human
-- response and a human grade.
-- ==============================================================================

DROP TABLE IF EXISTS public.classroom_assignments;

CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('story', 'reading', 'quiz', 'memory', 'game', 'written', 'custom')),
  reference_id TEXT,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'assigned')),
  due_date DATE,
  time_limit_minutes INTEGER,
  required_score INTEGER CHECK (required_score IS NULL OR (required_score >= 0 AND required_score <= 100)),
  xp_reward INTEGER CHECK (xp_reward IS NULL OR xp_reward >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per (assignment, targeted child) — doubles as both the target
-- list (created at publish time, a roster snapshot) and the per-student
-- progress/grading record, so there's no separate "targets" table to keep
-- in sync with submissions.
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'graded', 'returned')),
  response_text TEXT,
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES auth.users(id),
  feedback TEXT,
  xp_awarded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, child_id)
);

CREATE INDEX assignments_teacher_idx ON public.assignments (teacher_id);
CREATE INDEX assignments_classroom_idx ON public.assignments (classroom_id);
CREATE INDEX assignment_submissions_assignment_idx ON public.assignment_submissions (assignment_id);
CREATE INDEX assignment_submissions_child_idx ON public.assignment_submissions (child_id);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assignments FROM anon, authenticated;
REVOKE ALL ON public.assignment_submissions FROM anon, authenticated;
GRANT ALL ON public.assignments TO service_role;
GRANT ALL ON public.assignment_submissions TO service_role;

-- Defense-in-depth only — every real read/write goes through service-role
-- API routes that verify teacher ownership or the child's signed session,
-- the same access-control shape as every other table in this schema.
CREATE POLICY assignments_owner ON public.assignments
  FOR ALL USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE POLICY assignment_submissions_owner ON public.assignment_submissions
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()));
