/** How long without a heartbeat before a child is considered idle (not actively learning). */
export const INACTIVITY_THRESHOLD_SECONDS = Number(
  process.env.ACTIVITY_INACTIVITY_THRESHOLD_SECONDS || 300
);

/** How often the client sends an active-time heartbeat while the app is visible and in use. */
export const HEARTBEAT_INTERVAL_SECONDS = Number(
  process.env.ACTIVITY_HEARTBEAT_INTERVAL_SECONDS || 30
);
