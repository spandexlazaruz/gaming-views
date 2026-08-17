import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGames } from './GamesContext';
import { syncReminderSchedule, scheduleWeeklyDigest, cancelWeeklyDigest } from './notifications';

const STORAGE_KEY = 'watchlist_state_v1';

const WatchlistContext = createContext(null);

export const LEAD_OPTIONS = [
  { key: 'release_day', label: 'Release Day', days: 0 },
  { key: '3_days', label: '3 Days Before', days: 3 },
  { key: '1_week', label: '1 Week Before', days: 7 },
];

export function WatchlistProvider({ children }) {
  const { games } = useGames();
  const [saved, setSaved] = useState(new Set());
  const [reminders, setReminders] = useState({});
  // Which platform filter was active when each game was added — lets
  // Watchlist/Search show the platform the user actually cared about
  // instead of GameCard's arbitrary `platforms[0]` fallback (fix log item
  // 4). Stored alongside `saved` rather than folded into it, so every
  // existing `saved.has()` / `[...saved]` usage elsewhere stays untouched.
  const [platformContext, setPlatformContext] = useState({});
  const [preferredPlatform, setPreferredPlatform] = useState('all');
  const [preferredGenre, setPreferredGenre] = useState('all');
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state once on mount. Everything here used to live only
  // in memory and reset on every app restart — this is the fix for that.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.saved)) setSaved(new Set(parsed.saved));
          if (parsed.reminders && typeof parsed.reminders === 'object') setReminders(parsed.reminders);
          // Existing installs' persisted state won't have this field yet —
          // the `useState({})` default above already covers that, this just
          // avoids overwriting it with something invalid if it's ever there.
          if (parsed.platformContext && typeof parsed.platformContext === 'object') setPlatformContext(parsed.platformContext);
          if (parsed.preferredPlatform) setPreferredPlatform(parsed.preferredPlatform);
          if (parsed.preferredGenre) setPreferredGenre(parsed.preferredGenre);
          if (typeof parsed.weeklyDigestEnabled === 'boolean') setWeeklyDigestEnabled(parsed.weeklyDigestEnabled);
        }
      } catch {
        // Corrupt/unreadable storage shouldn't crash the app — just start fresh.
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist on every change, but only once initial hydration has finished —
  // otherwise the very first render (before loading finishes) would
  // immediately overwrite real saved data with empty defaults.
  useEffect(() => {
    if (!hydrated) return;
    const payload = JSON.stringify({
      saved: [...saved],
      reminders,
      platformContext,
      preferredPlatform,
      preferredGenre,
      weeklyDigestEnabled,
    });
    AsyncStorage.setItem(STORAGE_KEY, payload).catch(() => {});
  }, [hydrated, saved, reminders, platformContext, preferredPlatform, preferredGenre, weeklyDigestEnabled]);

  // Keep real scheduled local notifications in sync with the watchlist and
  // each game's lead-time choice, once game data is actually available.
  useEffect(() => {
    if (!hydrated || games.length === 0) return;
    syncReminderSchedule(saved, reminders, games, LEAD_OPTIONS).catch(() => {});
  }, [hydrated, saved, reminders, games]);

  // Same idea for the Weekly Digest toggle.
  useEffect(() => {
    if (!hydrated || games.length === 0) return;
    if (weeklyDigestEnabled) {
      scheduleWeeklyDigest(saved, games).catch(() => {});
    } else {
      cancelWeeklyDigest().catch(() => {});
    }
  }, [hydrated, weeklyDigestEnabled, saved, games]);

  const toggleWatchlist = (title, platform) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
    setReminders((r) => {
      if (r[title]) {
        const { [title]: _, ...rest } = r;
        return rest;
      }
      return { ...r, [title]: 'release_day' };
    });
    // Record which platform filter was active at the moment of adding, when
    // the caller has one to give (GameCard passes its `highlightPlatform`
    // prop — undefined on screens/paths with no active filter, e.g.
    // Watchlist/Search themselves, the Calendar hero card, or the game
    // detail screen's own CTA, which is fine — those just don't get a
    // captured value, same as today's behavior). Left alone on removal —
    // harmless if it goes stale, and a removed game has no badge to get
    // wrong anyway.
    if (platform) {
      setPlatformContext((p) => ({ ...p, [title]: platform }));
    }
    // Actual notification scheduling/cancellation is handled by the
    // syncReminderSchedule effect above, reacting to the `saved` change.
  };

  const setReminderLead = (title, key) => {
    setReminders((r) => ({ ...r, [title]: key }));
  };

  const value = useMemo(
    () => ({
      saved,
      toggleWatchlist,
      reminders,
      setReminderLead,
      platformContext,
      preferredPlatform,
      setPreferredPlatform,
      preferredGenre,
      setPreferredGenre,
      weeklyDigestEnabled,
      setWeeklyDigestEnabled,
    }),
    [saved, reminders, platformContext, preferredPlatform, preferredGenre, weeklyDigestEnabled]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
