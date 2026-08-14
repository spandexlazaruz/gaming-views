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
