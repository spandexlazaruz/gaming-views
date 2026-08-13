import { createContext, useContext, useState, useMemo } from 'react';

const WatchlistContext = createContext(null);

export const LEAD_OPTIONS = [
  { key: 'release_day', label: 'Release Day', days: 0 },
  { key: '3_days', label: '3 Days Before', days: 3 },
  { key: '1_week', label: '1 Week Before', days: 7 },
];

export function WatchlistProvider({ children }) {
  const [saved, setSaved] = useState(new Set());
  const [reminders, setReminders] = useState({});
  const [preferredPlatform, setPreferredPlatform] = useState('all');

  const toggleWatchlist = (title) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
        setReminders((r) => {
          const { [title]: _, ...rest } = r;
          return rest;
        });
      } else {
        next.add(title);
        setReminders((r) => ({ ...r, [title]: 'release_day' }));
      }
      return next;
    });
  };

  const setReminderLead = (title, key) => {
    setReminders((r) => ({ ...r, [title]: key }));
  };

  const value = useMemo(
    () => ({ saved, toggleWatchlist, reminders, setReminderLead, preferredPlatform, setPreferredPlatform }),
    [saved, reminders, preferredPlatform]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}

