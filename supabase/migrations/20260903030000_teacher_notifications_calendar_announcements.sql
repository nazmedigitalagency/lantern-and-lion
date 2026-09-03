-- ==============================================================================
-- Feature 10: Teacher Notifications, Calendar & Classroom Announcements
-- ==============================================================================

-- 1. Classroom Events: scheduled events (Sunday School, Bible Study, Youth Meeting, etc.)
CREATE TABLE IF NOT EXISTS public.classroom_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'other' CHECK (event_type IN ('bible_study', 'sunday_school', 'youth_meeting', 'scripture_challenge', 'review', 'other')),
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classroom_events_teacher_date ON public.classroom_events(teacher_id, event_date);
CREATE INDEX IF NOT EXISTS idx_classroom_events_classroom ON public.classroom_events(classroom_id);

ALTER TABLE public.classroom_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY classroom_events_teacher_owner ON public.classroom_events FOR ALL USING (teacher_id = auth.uid());

-- 2. Classroom Announcements: structured announcements posted by a teacher to a classroom
CREATE TABLE IF NOT EXISTS public.classroom_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classroom_announcements_classroom ON public.classroom_announcements(classroom_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_announcements_teacher ON public.classroom_announcements(teacher_id);

ALTER TABLE public.classroom_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY classroom_announcements_teacher_owner ON public.classroom_announcements FOR ALL USING (teacher_id = auth.uid());

-- 3. Teacher Notification Preferences: granular control over non-critical alerts
CREATE TABLE IF NOT EXISTS public.teacher_notification_preferences (
  teacher_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_submissions BOOLEAN NOT NULL DEFAULT true,
  grading_reminders BOOLEAN NOT NULL DEFAULT true,
  challenge_updates BOOLEAN NOT NULL DEFAULT true,
  student_inactivity_alerts BOOLEAN NOT NULL DEFAULT true,
  upcoming_deadlines BOOLEAN NOT NULL DEFAULT true,
  upcoming_events BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY teacher_notif_prefs_owner ON public.teacher_notification_preferences FOR ALL USING (teacher_id = auth.uid());
