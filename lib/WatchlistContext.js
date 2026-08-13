import { createContext, useContext, useState, useMemo } from 'react';

const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
  const [saved, setSaved] = useState(new Set());

  const toggleWatchlist = (title) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  const value = useMemo(() => ({ saved, toggleWatchlist }), [saved]);

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
