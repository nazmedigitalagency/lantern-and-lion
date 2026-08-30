# Child/Teen Activity Tracking — Manual Setup

This feature needs one secret that only a project owner can retrieve; nothing else is required beyond what's already in `.env.local`.

## 1. `SUPABASE_SERVICE_ROLE_KEY` (required)

API routes under `app/api/` (child login, activity logging, parent/teacher dashboards, classrooms) use the Supabase **service role** key to read/write the new tables, which are locked down with RLS so only server code with this key can touch them.

1. Open the Supabase dashboard for project `qqllmvygeeraeyltnbce` ("Lantern and Lion").
2. Go to **Project Settings → API → service_role secret key**.
3. Copy it into `site/.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...` (already has a placeholder line).
4. Add the same variable to **Vercel → Project Settings → Environment Variables** for Production/Preview, then redeploy.

Without this, every activity/notification/classroom API route returns a clear 500 error rather than failing silently — you'll see it immediately in testing.

## 2. `CHILD_SESSION_SECRET` (already generated)

A random signing secret for child/teen session cookies was generated and added to `.env.local`. Copy the same value into Vercel's environment variables so sessions issued by one deployment remain valid on the next. Rotating it logs out every active child/teen session (harmless — they just sign back in).

## 3. Optional tuning

- `ACTIVITY_INACTIVITY_THRESHOLD_SECONDS` (default `300` = 5 minutes) — how long without activity before a child is considered idle.
- `ACTIVITY_HEARTBEAT_INTERVAL_SECONDS` (default `30`) — how often the client reports active time while in use.

Neither needs to be set unless you want to change the defaults.

## What was intentionally not built

- **Email/push notifications.** Nothing in this app sends email or push today, so per the task instructions this feature only adds in-app notifications (a bell/list on the Parent Dashboard). Adding email would need an email provider (e.g. Resend) and a "From" domain; push would need web-push VAPID keys. Neither was set up, since no credentials for either exist in this project.
- **XP_EARNED from every possible source.** Games, Daily Quests, and lesson completions report their XP inline with their own completed event (`GAME_COMPLETED`, `QUEST_COMPLETED`, `LESSON_COMPLETED`). A few smaller XP sources elsewhere in Adventure World/Character rewards aren't individually wired into the daily XP counter yet — the counter will undercount slightly for those specific flows.
