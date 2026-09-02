-- ==============================================================================
-- Lantern & Lion - Classrooms: description/meeting schedule + real assignments
-- ==============================================================================

-- Optional classroom metadata shown on the Teacher Dashboard's Classes page.
-- All nullable — "Do not make unnecessary fields mandatory."
ALTER TABLE public.classrooms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.classrooms ADD COLUMN IF NOT EXISTS meeting_day TEXT;
ALTER TABLE public.classrooms ADD COLUMN IF NOT EXISTS meeting_time TEXT;

-- A classroom assignment points at real, already-completable content — an
-- interactive Bible story (app/stories/catalog.ts) or a curriculum concept
-- (app/curriculum-data.ts, the same taxonomy concept_mastery already tracks
-- per child) — so "completed" can always be read from data that's already
-- there (story_progress / concept_mastery), never a separate fake status a
-- teacher has to update by hand.
CREATE TABLE IF NOT EXISTS public.classroom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('story', 'concept')),
  reference_id TEXT NOT NULL,
  due_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classroom_assignments_classroom_idx ON public.classroom_assignments (classroom_id);

ALTER TABLE public.classroom_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.classroom_assignments FROM anon, authenticated;
GRANT ALL ON public.classroom_assignments TO service_role;

-- Defense-in-depth alongside the service-role API routes that actually
-- enforce access (mirrors the classrooms/classroom_students policy style).
DROP POLICY IF EXISTS classroom_assignments_owner ON public.classroom_assignments;
CREATE POLICY classroom_assignments_owner ON public.classroom_assignments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND c.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND c.teacher_id = auth.uid()));
