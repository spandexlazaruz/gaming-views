import { daysUntil, toDate } from './dates';
import { reminderDateFor } from './notifications';

// Pure, platform-agnostic data layer for the home-screen widgets (both
// iOS's expo-widgets and Android's react-native-android-widget). No React,
// no native imports — this file is called from the main app's own effects
// (lib/WatchlistContext.js) AND from Android's headless widget task handler
// (widgets/android/taskHandler.js), which runs outside any component tree
// and can't rely on hooks or app state existing at all. Keeping the actual
// "what should the widget show" logic here, separate from lib/widgetBridge.js
// (which only handles getting this data onto each native platform), means
// the two widget implementations can't silently drift apart on something
// like the this-week date range or the tiebreak rule.
//
// Deliberately returns only `{ title, date, platforms }` per game — neither
// widget ever shows a cover image, description, screenshots, or trailer, so
// this can run directly against the already-trimmed list-mode `games` array
// (see gaming-views-backend/api/games.js's stripDetailFields) with zero loss.

// ADDED (Dan's decision, same convention already used for GameCard's
// highlightPlatform tiebreak in app/(tabs)/index.js — see that file's own
// "fixed alphabetical tiebreak" comment): when two or more candidates share
// the exact same soonest date, pick deterministically rather than whichever
// happened to sort first out of the live `games` array's own (IGDB-query)
// order, which isn't a meaningful tiebreak and could visibly flip between
// refreshes for no reason a user could follow.
function sortByDateThenTitle(entries) {
  return [...entries].sort((a, b) => {
    const dateDiff = toDate(a.date) - toDate(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.title.localeCompare(b.title);
  });
}

function toSummaryEntry(game, date) {
  return { title: game.title, date, platforms: game.platforms };
}

// The single soonest-upcoming release from the user's Watchlist, or `null`
// when nothing saved still resolves to a real, not-yet-released game —
// same "does this still resolve to a real, current game" posture as
// resolvedWatchlistCount (lib/watchlistUtils.js), just picking the minimum
// by date instead of counting. `platformContext` is optional and behaves
// exactly as it does for reminders/the Weekly Digest (lib/notifications.js):
// when a saved title has one, its own per-platform date is used via the
// already-exported reminderDateFor rather than reimplementing that
// resolution rule a third time.
export function computeNextRelease(saved, games, platformContext = {}) {
  const candidates = [];
  for (const title of saved) {
    const game = games.find((g) => g.title === title);
    if (!game) continue;
    const date = reminderDateFor(game, platformContext);
    if (daysUntil(date) < 0) continue;
    candidates.push(toSummaryEntry(game, date));
  }
  if (candidates.length === 0) return null;
  return sortByDateThenTitle(candidates)[0];
}

// Every tracked game (not watchlist-scoped) releasing in the next 7 days,
// soonest first. Same 0-7 day bounds already established by
// scheduleWeeklyDigest's releasingThisWeek filter (lib/notifications.js),
// just applied to every game rather than only saved titles, and using each
// game's own aggregate `date` (there's no per-user platform context to
// prefer here — this isn't scoped to any one user's saved platform choice).
export function computeThisWeek(games) {
  const entries = [];
  for (const game of games) {
    const daysAway = daysUntil(game.date);
    if (daysAway < 0 || daysAway > 7) continue;
    entries.push(toSummaryEntry(game, game.date));
  }
  return sortByDateThenTitle(entries);
}

// Shared deep-link builder for widget tap targets (both platforms route a
// game tap through this same gamingviews:// scheme into app/game/[title].js).
export function gameDeepLink(title) {
  return `gamingviews://game/${encodeURIComponent(title)}`;
}

export function computeWidgetSummary(saved, games, platformContext = {}) {
  return {
    nextRelease: computeNextRelease(saved, games, platformContext),
    thisWeek: computeThisWeek(games),
  };
}
