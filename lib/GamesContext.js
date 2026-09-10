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
export function useLastMonthGames() {
  const [state, setState] = useState({ games: [], loading: true, error: null });

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
    fetchLastMonth();
  }, [fetchLastMonth]);

  return { ...state, refetch: fetchLastMonth };
}
