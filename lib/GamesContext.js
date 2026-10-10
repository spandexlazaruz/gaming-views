import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GamesContext = createContext(null);

// The backend's own branded custom domain (api.gamingviewspod.com),
// pointed at the gaming-views-backend Vercel project via a CNAME -
// replaces the raw gaming-views-backend.vercel.app URL everywhere, partly
// for branding (Steam's OpenID login screen shows whichever domain the
// request's realm is built from - see SteamLinkContext.js) and partly so
// the two don't drift the way they did during testing (this file used to
// hardcode production directly while SteamLinkContext.js pointed dev
// builds at a branch preview URL, which caused a real bug - igdbId
// silently missing from this file's data). Both files now just use this
// one constant, dev and production alike, now that the Steam feature
// branch is merged and there's no separate branch backend left to point
// dev builds at.
const BACKEND_BASE = 'https://api.gamingviewspod.com';
const API_URL = `${BACKEND_BASE}/api/games`;

// ADDED (startup-performance fix + the Android home-screen widget's
// background update path): previously every single cold start re-fetched
// the full games list from zero with nothing shown in the meantime —
// now the last successful response is persisted here and rendered
// instantly on mount while a real fetch runs behind it to replace it, same
// "last known good, always superseded by the next real fetch" posture
// already used elsewhere in this app (see e.g. the Weekly Digest's own
// comment in lib/notifications.js). No TTL/expiry: a fetch success always
// wins regardless of how stale the cache is, so this can never show
// data staler than "since the last time the app had a working connection."
// This same cache is also what makes the Android widget's headless task
// handler able to render real data when the OS wakes it up on its own
// timer with the main app not running at all — see lib/widgetBridge.js.
const GAMES_CACHE_KEY = 'games_cache_v1';

export function GamesProvider({ children }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // True once a cached list has been shown (even before a real fetch
  // finishes) — exposed as its own flag rather than folded into `loading`,
  // so every existing consumer of `loading` ("has a fetch completed this
  // session") keeps meaning exactly what it already means.
  const [hydratedFromCache, setHydratedFromCache] = useState(false);
  // ADDED (pull-to-refresh): `loading` has always meant "no usable games yet,
  // show the full-screen spinner" (see the early-return in app/(tabs)/index.js
  // below this file) - every existing consumer of it still needs that exact
  // meaning. A pull-to-refresh call happens when games are already on screen,
  // so it must NOT flip `loading` (that would blank the whole list behind a
  // full-screen spinner mid-gesture). Each screen tracks its own local
  // `refreshing` state around its own `refetch()` call for the pull-to-
  // refresh spinner itself (see app/(tabs)/index.js and watchlist.js) - this
  // ref just tells fetchGames whether THIS call is the very first one, so a
  // retry after an initial failure still correctly uses the full-screen
  // `loading` path instead of silently doing nothing visible.
  const hasLoadedOnceRef = useRef(false);

  const fetchGames = useCallback(async () => {
    const isInitialLoad = !hasLoadedOnceRef.current;
    if (isInitialLoad) setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Server returned an error (${response.status})`);
      }
      const data = await response.json();
      if (!data.games) {
        throw new Error('Unexpected response from the server');
      }
      setGames(data.games);
      hasLoadedOnceRef.current = true;
      AsyncStorage.setItem(GAMES_CACHE_KEY, JSON.stringify({ games: data.games, savedAt: Date.now() })).catch(() => {});
    } catch (e) {
      setError(e.message || 'Could not load games. Check your connection and try again.');
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(GAMES_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.games)) {
            setGames(parsed.games);
            setHydratedFromCache(true);
          }
        }
      } catch {
        // Corrupt/unreadable cache shouldn't block a real fetch — just skip it.
      }
      fetchGames();
    })();
  }, [fetchGames]);

  return (
    <GamesContext.Provider value={{ games, loading, error, hydratedFromCache, refetch: fetchGames }}>
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error('useGames must be used inside GamesProvider');
  return ctx;
}

// ADDED (item 35 — "What You Missed"): a separate, standalone fetch rather
// than folding this into GamesProvider's own `games` state — that state (and
// everything downstream of it: Calendar, Watchlist, notifications) is built
// entirely around "upcoming releases," and mixing a fixed past-month window
// into the same array would mean filtering it back out everywhere else that
// reads `games`. Only the one screen that shows last month's releases needs
// this, so it fetches independently, same loading/error/refetch shape as
// useGames() above.
//
// UPDATED (item 42 fix — "What You Missed" games opening as "Game not
// found"): gained an optional `enabled` flag so app/game/[title].js can call
// this too, as a fallback for when a title isn't in the main upcoming-only
// `games` array (see that screen's own comment for the full story) —
// without `enabled`, every single detail-page visit would fire this fetch
// regardless of whether it's ever actually needed, when in the overwhelming
// majority of cases (opening from Calendar/Watchlist/Search, all always
// upcoming titles) it never is. Defaults to true, so the existing call in
// app/what-you-missed.js (which always wants this data) is unaffected.
export function useLastMonthGames({ enabled = true } = {}) {
  const [state, setState] = useState({ games: [], loading: enabled, error: null });

  const fetchLastMonth = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const response = await fetch(`${API_URL}?when=last-month`);
      if (!response.ok) {
        throw new Error(`Server returned an error (${response.status})`);
      }
      const data = await response.json();
      if (!data.games) {
        throw new Error('Unexpected response from the server');
      }
      setState({ games: data.games, loading: false, error: null });
    } catch (e) {
      setState({ games: [], loading: false, error: e.message || "Could not load last month's releases. Check your connection and try again." });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Set synchronously here too, not just inside fetchLastMonth itself —
    // closes a possible gap where a caller reads `loading` in the same
    // render `enabled` just flipped true in, before this effect's own
    // fetchLastMonth() call reaches its first setState.
    setState((s) => ({ ...s, loading: true }));
    fetchLastMonth();
  }, [enabled, fetchLastMonth]);

  return { ...state, refetch: fetchLastMonth };
}

// ADDED (Wolverine bug — "Game not found" for a title that already released
// THIS calendar month, not last month): useGames() is upcoming-only,
// useLastMonthGames() is a fixed previous-calendar-month window — a title
// released earlier this month, including today, matches neither, even
// though WatchlistContext's own 24h-post-release grace window keeps it
// visible on the Watchlist screen from a local cache, no backend call
// involved. This is app/game/[title].js's last-resort fallback: a direct
// by-title lookup with no date window at all (backend's ?when=lookup),
// correct for a title released at any point in the past, not just this
// specific month-boundary gap. Same enabled-flag-gated shape as
// useLastMonthGames above, for the same reason — most detail-page visits
// resolve from the primary `games` array and should never fire this.
// UPDATED (real bug found via on-device testing - "Fable" resolving to
// completely unrelated games, including an indie title and a 1996 Puzzle
// game, across different requests): a title-only lookup can't reliably
// disambiguate when IGDB has multiple real, distinct records sharing an
// exact title - confirmed live, a hypes-based sort tie-break on the
// backend still wasn't reliable since ties on that field aren't guaranteed
// stable across requests. `igdbId`, when the caller already has one (from
// the upcoming list, last-month, or a Steam match - see mapIgdbGame's own
// igdbId field), is passed through to the backend's ?when=lookup&id=
// param instead of title - a genuinely unambiguous primary-key match.
// `title` alone is still supported as a fallback for a caller with no id
// yet (a fresh Search result, or a Steam-only fallback game IGDB has no
// record of at all).
export function useGameLookup(title, { enabled = true, igdbId } = {}) {
  const [state, setState] = useState({ game: null, loading: enabled, error: null });

  const fetchGame = useCallback(async () => {
    if (!title && !igdbId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const query = igdbId ? `id=${encodeURIComponent(igdbId)}` : `title=${encodeURIComponent(title)}`;
      const response = await fetch(`${API_URL}?when=lookup&${query}`);
      if (!response.ok) {
        throw new Error(`Server returned an error (${response.status})`);
      }
      const data = await response.json();
      if (!data.games) {
        throw new Error('Unexpected response from the server');
      }
      setState({ game: data.games[0] || null, loading: false, error: null });
    } catch (e) {
      setState({ game: null, loading: false, error: e.message || 'Could not load this game. Check your connection and try again.' });
    }
  }, [title, igdbId]);

  useEffect(() => {
    if (!enabled || (!title && !igdbId)) return;
    setState((s) => ({ ...s, loading: true }));
    fetchGame();
  }, [enabled, title, igdbId, fetchGame]);

  return { ...state, refetch: fetchGame };
}
