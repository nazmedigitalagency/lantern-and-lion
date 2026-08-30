// The one function that knows what "today" is, for every feature that
// resets on a local calendar day (Daily Quests, the Arcade's session
// log, the daily featured game). Both `daily-quests` and `arcade`
// import this instead of each defining their own — duplicating it
// risked the two ever disagreeing about the date key format, and an
// arcade-local copy specifically also risked a circular import back
// into `daily-quests` (which already imports from `arcade/storage`).
//
// Swapping this for a server-supplied date later (so a device with a
// wrong clock can't manufacture streaks) means changing only this
// function.
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
