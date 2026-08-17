// Counts how many watchlisted titles currently resolve to a real game in the
// live dataset, instead of just returning `saved.size` (the raw number of
// titles ever hearted, persisted in storage). Titles fall out of the live
// dataset once their release date passes (the backend only returns upcoming
// games) — the watchlist screen already accounts for that when deciding what
// to *render*, but nothing previously kept the displayed *count* (header
// text, tab bar badge) in sync with that same drop-off, so it could get
// stuck showing a stale number forever with an empty list underneath it.
export function resolvedWatchlistCount(saved, games) {
  if (!games || games.length === 0) return 0;
  let count = 0;
  for (const title of saved) {
    if (games.some((g) => g.title === title)) count++;
  }
  return count;
}
