import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';

// In-app review prompt gating — a deliberately narrow, explicit set of
// conditions rather than "as soon as possible": firing the native OS review
// prompt during someone's very first session (even if they add several
// games right away) would be asking for a rating before they've actually
// used the app for more than a few minutes. Requiring a second, separate
// day of app use alongside a real sign of engagement (3-5 games actively
// wishlisted) is meant to catch people once they've shown they're sticking
// around, not just poking around once.
const STORAGE_KEY = 'review_prompt_state_v1';
const MIN_WATCHLIST_COUNT = 3;
const MAX_WATCHLIST_COUNT = 5;
const MIN_OPEN_DAYS = 2;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { openDays: [], promptedForVersion: null };
    const parsed = JSON.parse(raw);
    return {
      openDays: Array.isArray(parsed.openDays) ? parsed.openDays : [],
      promptedForVersion: parsed.promptedForVersion || null,
    };
  } catch {
    // Corrupt/unreadable storage shouldn't crash the app — just start fresh,
    // same fallback WatchlistContext's own load effect uses.
    return { openDays: [], promptedForVersion: null };
  }
}

async function saveState(state) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
}

// Called once per app launch (see app/_layout.js) — records today as a
// distinct day the app's been opened. A plain deduped array of day-keys;
// small and bounded in practice (nothing here needs more than a handful of
// entries to clear MIN_OPEN_DAYS), so no pruning logic.
export async function recordAppOpenDay() {
  const state = await loadState();
  const key = todayKey();
  if (state.openDays.includes(key)) return;
  await saveState({ ...state, openDays: [...state.openDays, key] });
}

// Called right after a game is newly added to the watchlist (see
// WatchlistContext.toggleWatchlist) — `watchlistCount` should be the real,
// resolved count (resolvedWatchlistCount, same one shown in the Watchlist
// tab badge), not the raw savedPlatforms key count. Fires the native OS
// review prompt at most once per app version: neither platform tells an app
// whether the prompt actually showed or what the person did with it, and
// both silently no-op if called "too often" (their own internal throttle,
// undocumented and outside this app's control) — promptedForVersion is this
// app's OWN throttle, not a reliance on that platform behavior.
export async function maybeRequestReview(watchlistCount) {
  if (watchlistCount < MIN_WATCHLIST_COUNT || watchlistCount > MAX_WATCHLIST_COUNT) return;

  const state = await loadState();
  const currentVersion = Constants.expoConfig?.version || null;
  if (state.promptedForVersion === currentVersion) return;
  if (state.openDays.length < MIN_OPEN_DAYS) return;

  const available = await StoreReview.isAvailableAsync();
  if (!available) return;

  await StoreReview.requestReview();
  await saveState({ ...state, promptedForVersion: currentVersion });
}
