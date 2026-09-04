-- ==============================================================================
-- Feature 15: Teacher Notifications (Priority & Enhanced Preferences)
-- ==============================================================================

-- 1. Add priority column to notifications table if not present
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal'
  CHECK (priority IN ('high', 'normal', 'low'));

-- Index for efficient recipient and priority queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_priority
  ON public.notifications (recipient_id, priority, created_at DESC);

-- 2. Extend teacher notification preferences with category preferences
ALTER TABLE public.teacher_notification_preferences
  ADD COLUMN IF NOT EXISTS class_achievements BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS learning_insights BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS connection_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS missing_work_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS student_performance_alerts BOOLEAN NOT NULL DEFAULT true;
