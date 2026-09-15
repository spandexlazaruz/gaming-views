import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const GamesContext = createContext(null);

const API_URL = 'https://gaming-views-backend.vercel.app/api/games';

export function GamesProvider({ children }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
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
    } catch (e) {
      setError(e.message || 'Could not load games. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return (
    <GamesContext.Provider value={{ games, loading, error, refetch: fetchGames }}>
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
export function useGameLookup(title, { enabled = true } = {}) {
  const [state, setState] = useState({ game: null, loading: enabled, error: null });

  const fetchGame = useCallback(async () => {
    if (!title) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const response = await fetch(`${API_URL}?when=lookup&title=${encodeURIComponent(title)}`);
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
  }, [title]);

  useEffect(() => {
    if (!enabled || !title) return;
    setState((s) => ({ ...s, loading: true }));
    fetchGame();
  }, [enabled, title, fetchGame]);

  return { ...state, refetch: fetchGame };
}
