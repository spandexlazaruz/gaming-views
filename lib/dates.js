export function toDate(a) {
  return new Date(a[0], a[1], a[2]);
}

export function daysUntil(a) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((toDate(a) - today) / 86400000);
}

export function formatDate(a) {
  return toDate(a).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(a) {
  return toDate(a).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Groups a game's per-platform release dates (backend's `platformDates`,
// see gaming-views-backend/api/games.js) by distinct date, so a card/detail
// screen can show "PS5/Xbox Mar 12 · Switch Jun 3" only when platforms
// genuinely release on different days. Returns null whenever there's
// nothing worth calling out separately — no granular data at all, or every
// confirmed platform happens to share the same date — so callers can fall
// straight back to the single shared `date` field unchanged, which keeps
// the common case (most games, one date) looking exactly as it did before.
// ADDED 2026-08-19 (bug fix): a game's aggregate `date` field is the
// *earliest* confirmed date across all its platforms (see buildPlatformDates
// in gaming-views-backend/api/games.js) — correct for the default "All
// platforms" browsing view, but wrong once a specific platform filter is
// active. Found via a real report: Deadzone Rogue 2 releases on PC Aug 21
// but Xbox/PS5 Dec 31 — filtering the Calendar to PS5 still grouped/sorted
// the card under August (using the aggregate date) while the card's own
// text correctly read "Dec 31" (GameCard already reads platformDates
// per-platform, see displayDate there) — a visible contradiction, and the
// same game was simultaneously invisible under an explicit December
// month-filter for the same reason. This helper picks the right date to
// group/sort/filter by: the platform's own confirmed date when one's being
// filtered on and the game actually has it, otherwise the existing
// aggregate `date` — unchanged behavior for "All platforms" or a game with
// no granular per-platform data at all.
// UPDATED (multi-select platform filter): `platformKey` now also accepts an
// array of platform keys, not just one — Calendar's platform filter can
// select several at once. Same principle as the single-platform case, just
// scoped to whichever platforms are actually active: the earliest confirmed
// date among the given platforms' own dates when the game has any, else the
// existing aggregate `date` — identical behavior to before for a single key
// or no key at all (a one-element array reduces to that element's own
// date), so every existing single-platform caller is unaffected.
export function effectiveDate(game, platformKey) {
  if (!platformKey || !game.platformDates) return game.date;
  const keys = Array.isArray(platformKey) ? platformKey : [platformKey];
  const dates = keys.map((k) => game.platformDates[k]).filter(Boolean);
  if (dates.length === 0) return game.date;
  return dates.reduce((earliest, d) => (toDate(d) < toDate(earliest) ? d : earliest));
}

// UPDATED (multi-select platform filter): optional second argument scopes
// the breakdown down to just the given platform keys (e.g. Calendar's
// currently-active platform selection) instead of every platform the game
// has data for — used when 2+ platforms are actively selected and their
// dates genuinely differ, so the "other selected platform's date" can be
// surfaced as a note rather than silently dropped in favor of the earliest
// one (see effectiveDate above, and its call sites). Omitting the second
// argument keeps the original "every platform" behavior, unchanged for
// every existing caller.
export function platformDateGroups(game, platformKeys) {
  if (!game.platformDates) return null;
  const entries = platformKeys && platformKeys.length > 0
    ? Object.entries(game.platformDates).filter(([key]) => platformKeys.includes(key))
    : Object.entries(game.platformDates);
  const byKey = {};
  for (const [platform, d] of entries) {
    const key = d.join('-');
    if (!byKey[key]) byKey[key] = { date: d, platforms: [] };
    byKey[key].platforms.push(platform);
  }
  const groups = Object.values(byKey);
  return groups.length > 1 ? groups : null;
}
