-- ==============================================================================
-- Lantern & Lion - Feature 18: Connection & Consent System
-- ==============================================================================
-- Extends classroom_students with an explicit state machine and audit trail
-- for teacher connection requests, parent approvals/declines/revocations,
-- and teacher student removals.
--
-- States: 'pending', 'approved', 'declined', 'revoked', 'removed'.
-- Backward-compatibility: 'approved' column remains synchronized with (status = 'approved').

-- 1. Extend classroom_students table
ALTER TABLE public.classroom_students
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'declined', 'revoked', 'removed'));

ALTER TABLE public.classroom_students
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.classroom_students
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.classroom_students
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

ALTER TABLE public.classroom_students
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Synchronize existing rows
UPDATE public.classroom_students
  SET status = 'approved'
  WHERE approved = true AND status = 'pending';

CREATE INDEX IF NOT EXISTS classroom_students_status_idx ON public.classroom_students (status);

-- 2. Extend classrooms with optional church or organization name
ALTER TABLE public.classrooms
  ADD COLUMN IF NOT EXISTS church_or_org TEXT;

-- 3. Create connection_audit_logs table
CREATE TABLE IF NOT EXISTS public.connection_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('teacher', 'parent', 'student', 'admin', 'system')),
  action TEXT NOT NULL CHECK (action IN ('requested', 'approved', 'declined', 'revoked', 'removed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS connection_audit_logs_classroom_idx ON public.connection_audit_logs (classroom_id);
CREATE INDEX IF NOT EXISTS connection_audit_logs_child_idx ON public.connection_audit_logs (child_id);
CREATE INDEX IF NOT EXISTS connection_audit_logs_teacher_idx ON public.connection_audit_logs (teacher_id);
CREATE INDEX IF NOT EXISTS connection_audit_logs_action_idx ON public.connection_audit_logs (action);

-- Row Level Security for audit logs (service_role only, immutable)
ALTER TABLE public.connection_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.connection_audit_logs FROM anon, authenticated;
GRANT ALL ON public.connection_audit_logs TO service_role;
