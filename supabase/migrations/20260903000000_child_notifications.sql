-- ==============================================================================
-- Lantern & Lion - Child/Teen notification center
-- Extends the existing `notifications` table rather than creating a second
-- one: children have no auth.users row (PIN-based sessions), so every
-- notification today is addressed to a parent/teacher's recipient_id. This
-- adds a second, mutually-exclusive addressing column so a notification can
-- instead be addressed directly to a child.
-- ==============================================================================

ALTER TABLE public.notifications ALTER COLUMN recipient_id DROP NOT NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_child_id UUID REFERENCES public.children(id) ON DELETE CASCADE;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_one_recipient_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_one_recipient_check
  CHECK (
    (recipient_id IS NOT NULL AND recipient_child_id IS NULL) OR
    (recipient_id IS NULL AND recipient_child_id IS NOT NULL)
  );

-- A separate unique constraint for child-addressed rows: the existing
-- UNIQUE(recipient_id, dedupe_key) never fires for these rows since
-- recipient_id is NULL on all of them (and Postgres treats NULLs as
-- distinct), so without this, child notifications would never dedupe.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_child_dedupe_key;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_child_dedupe_key UNIQUE (recipient_child_id, dedupe_key);

CREATE INDEX IF NOT EXISTS notifications_recipient_child_created_idx ON public.notifications (recipient_child_id, created_at DESC);

-- RLS is unchanged: this table already has no anon/authenticated policies
-- (service-role only), and every child-facing route goes through the
-- service-role admin client scoped by the verified child_session cookie,
-- matching every other app/api/child/** route.
