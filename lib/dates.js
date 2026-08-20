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
export function effectiveDate(game, platformKey) {
  if (platformKey && game.platformDates && game.platformDates[platformKey]) {
    return game.platformDates[platformKey];
  }
  return game.date;
}

export function platformDateGroups(game) {
  if (!game.platformDates) return null;
  const byKey = {};
  for (const [platform, d] of Object.entries(game.platformDates)) {
    const key = d.join('-');
    if (!byKey[key]) byKey[key] = { date: d, platforms: [] };
    byKey[key].platforms.push(platform);
  }
  const groups = Object.values(byKey);
  return groups.length > 1 ? groups : null;
}
