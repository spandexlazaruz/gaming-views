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
