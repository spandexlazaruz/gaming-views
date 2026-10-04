// Counts how many watchlisted titles currently resolve to a real game in the
// live dataset, instead of just returning `saved.size` (the raw number of
// titles ever hearted, persisted in storage). Titles fall out of the live
// dataset once their release date passes (the backend only returns upcoming
// games) — the watchlist screen already accounts for that when deciding what
// to *render*, but nothing previously kept the displayed *count* (header
// text, tab bar badge) in sync with that same drop-off, so it could get
// stuck showing a stale number forever with an empty list underneath it.
//
// UPDATED (Steam wishlist auto-sync): a Steam-sourced title can resolve with
// no entry in `games` at all (outside the normal 12-month upcoming window,
// or not an IGDB record at all — see lib/WatchlistContext.js's
// externalGameSnapshots), same as app/(tabs)/watchlist.js already accounts
// for when deciding what to render. Without this, the header/tab badge
// count fell out of sync with what the Watchlist screen actually showed —
// same class of bug this function originally existed to fix, just for a
// second data source. `externalGameSnapshots` defaults to `{}` so every
// pre-existing call site keeps working unchanged until it's updated to pass
// the real value.
export function resolvedWatchlistCount(saved, games, externalGameSnapshots = {}) {
  if ((!games || games.length === 0) && Object.keys(externalGameSnapshots).length === 0) return 0;
  let count = 0;
  for (const title of saved) {
    if ((games && games.some((g) => g.title === title)) || externalGameSnapshots[title]) count++;
  }
  return count;
}
