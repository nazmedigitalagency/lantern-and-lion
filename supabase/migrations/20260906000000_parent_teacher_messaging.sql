-- ==============================================================================
-- Lantern & Lion - Feature: Real-Time Parent-Teacher Messaging
-- ==============================================================================
-- COPPA-compliant, verified adult-to-adult communication channel between
-- approved teachers and parents regarding student educational progress.

-- 1. Create parent_teacher_threads table
CREATE TABLE IF NOT EXISTS public.parent_teacher_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_snippet TEXT,
  parent_unread_count INT NOT NULL DEFAULT 0,
  teacher_unread_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT parent_teacher_threads_unique UNIQUE (classroom_id, child_id, parent_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS parent_teacher_threads_parent_idx ON public.parent_teacher_threads (parent_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS parent_teacher_threads_teacher_idx ON public.parent_teacher_threads (teacher_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS parent_teacher_threads_classroom_idx ON public.parent_teacher_threads (classroom_id);
CREATE INDEX IF NOT EXISTS parent_teacher_threads_child_idx ON public.parent_teacher_threads (child_id);

-- 2. Create parent_teacher_messages table
CREATE TABLE IF NOT EXISTS public.parent_teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.parent_teacher_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('parent', 'teacher')),
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parent_teacher_messages_thread_idx ON public.parent_teacher_messages (thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS parent_teacher_messages_sender_idx ON public.parent_teacher_messages (sender_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.parent_teacher_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_teacher_messages ENABLE ROW LEVEL SECURITY;

-- Threads policy: Participants (parent or teacher) can select their own threads
DROP POLICY IF EXISTS "Participants can view their threads" ON public.parent_teacher_threads;
CREATE POLICY "Participants can view their threads"
  ON public.parent_teacher_threads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = parent_id OR auth.uid() = teacher_id);

-- Messages policy: Participants can view messages in their threads
DROP POLICY IF EXISTS "Participants can view thread messages" ON public.parent_teacher_messages;
CREATE POLICY "Participants can view thread messages"
  ON public.parent_teacher_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_teacher_threads
      WHERE id = parent_teacher_messages.thread_id
        AND (parent_id = auth.uid() OR teacher_id = auth.uid())
    )
  );

-- Service role has full administrative access
GRANT ALL ON public.parent_teacher_threads TO service_role;
GRANT ALL ON public.parent_teacher_messages TO service_role;

-- 4. Enable Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'parent_teacher_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_teacher_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'parent_teacher_threads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_teacher_threads;
  END IF;
END $$;
