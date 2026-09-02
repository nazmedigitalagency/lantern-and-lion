-- Teacher-saved assignment templates ("My Templates"). Lantern & Lion's own
-- built-in templates are static catalog data in app/lib/assignments/templates.ts
-- (they reference real content the same way built-in templates below do) and
-- never live in this table — only a teacher's personal templates do.
--
-- A template holds reusable *configuration* only (type, content reference,
-- instructions, limits, rewards, age group) — never a student response, a
-- roster, or any per-student data. Deleting a template does not touch any
-- assignment previously created from it: there is no foreign key between
-- assignments and this table by design, only a one-time copy at create time.

CREATE TABLE public.assignment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('scripture_memory', 'bible_knowledge', 'reading', 'games', 'stories', 'reflection', 'review')),
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('story', 'reading', 'quiz', 'memory', 'game', 'written', 'custom')),
  reference_id TEXT,
  instructions TEXT,
  time_limit_minutes INTEGER,
  required_score INTEGER CHECK (required_score IS NULL OR (required_score >= 0 AND required_score <= 100)),
  xp_reward INTEGER CHECK (xp_reward IS NULL OR xp_reward >= 0),
  age_group TEXT NOT NULL DEFAULT 'both' CHECK (age_group IN ('child', 'teen', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignment_templates_teacher ON public.assignment_templates(teacher_id);

ALTER TABLE public.assignment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their own templates" ON public.assignment_templates
  FOR ALL USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
