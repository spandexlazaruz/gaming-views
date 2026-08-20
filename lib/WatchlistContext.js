import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGames } from './GamesContext';
import { syncReminderSchedule, scheduleWeeklyDigest, cancelWeeklyDigest } from './notifications';
import { PLATFORMS } from './theme';

const STORAGE_KEY = 'watchlist_state_v1';
// Every platform key the app understands — used as the "saved for all
// platforms" default whenever a game is watchlisted with no specific
// platform in context (e.g. tapping the Calendar hero's button, or the
// detail screen's CTA when arriving with no filter), and to migrate
// pre-existing watchlist entries from before per-platform tracking existed
// (see the load effect below) so they keep showing exactly as they did
// before, on every platform, until the user explicitly re-saves them under
// one specific platform going forward.
const ALL_PLATFORM_KEYS = Object.keys(PLATFORMS);

const WatchlistContext = createContext(null);

export const LEAD_OPTIONS = [
  { key: 'release_day', label: 'Release Day', days: 0 },
  { key: '3_days', label: '3 Days Before', days: 3 },
  { key: '1_week', label: '1 Week Before', days: 7 },
];

export function WatchlistProvider({ children }) {
  const { games } = useGames();
  // The real source of truth for what's watchlisted: title -> array of
  // platform keys it's saved under. Replaces the old plain "is this title
  // saved, yes/no" model — a game wishlisted on PS5 should not read as
  // wishlisted when browsing/filtering Xbox for the same game unless that
  // was done specifically too. `saved` below is derived from this for every
  // existing consumer that only cares "is this title saved for anything".
  const [savedPlatforms, setSavedPlatforms] = useState({});
  const [reminders, setReminders] = useState({});
  // Which platform a title's single reminder should track the release date
  // of — set to whichever platform it was most recently explicitly added
  // under (see toggleWatchlist below). Originally existed only to pick a
  // badge to display (fix log item 4); that job now belongs to
  // `savedPlatforms` itself, so this field's only remaining purpose is
  // feeding syncReminderSchedule/scheduleWeeklyDigest the right per-platform
  // date when one exists (see lib/notifications.js).
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
          if (parsed.savedPlatforms && typeof parsed.savedPlatforms === 'object') {
            setSavedPlatforms(parsed.savedPlatforms);
          } else if (Array.isArray(parsed.saved)) {
            // Pre-existing data from before per-platform tracking existed —
            // every entry becomes "saved for every platform" so it keeps
            // showing exactly as it did before, on every screen/filter,
            // until the user explicitly re-saves it under one platform.
            const migrated = {};
            for (const title of parsed.saved) migrated[title] = ALL_PLATFORM_KEYS;
            setSavedPlatforms(migrated);
          }
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
      savedPlatforms,
      reminders,
      platformContext,
      preferredPlatform,
      preferredGenre,
      weeklyDigestEnabled,
    });
    AsyncStorage.setItem(STORAGE_KEY, payload).catch(() => {});
  }, [hydrated, savedPlatforms, reminders, platformContext, preferredPlatform, preferredGenre, weeklyDigestEnabled]);

  // "Is this title saved at all, for any platform" — every existing
  // consumer (badge counts, the Calendar's hide-if-watchlisted filter, the
  // Watchlist screen's own list) only ever needed this coarse view, so it
  // stays a plain Set derived from savedPlatforms rather than needing every
  // one of those call sites rewritten.
  const saved = useMemo(
    () => new Set(Object.keys(savedPlatforms).filter((t) => (savedPlatforms[t] || []).length > 0)),
    [savedPlatforms]
  );

  // Keep real scheduled local notifications in sync with the watchlist and
  // each game's lead-time choice, once game data is actually available.
  // platformContext lets a title's one reminder track the release date of
  // the specific platform it was added under, when that differs from the
  // game's other platforms (see lib/notifications.js).
  useEffect(() => {
    if (!hydrated || games.length === 0) return;
    syncReminderSchedule(saved, reminders, games, LEAD_OPTIONS, platformContext).catch(() => {});
  }, [hydrated, saved, reminders, games, platformContext]);

  // Same idea for the Weekly Digest toggle.
  useEffect(() => {
    if (!hydrated || games.length === 0) return;
    if (weeklyDigestEnabled) {
      scheduleWeeklyDigest(saved, games, platformContext).catch(() => {});
    } else {
      cancelWeeklyDigest().catch(() => {});
    }
  }, [hydrated, weeklyDigestEnabled, saved, games, platformContext]);

  // `platform` — the specific platform to toggle, when the caller has one
  // (GameCard/detail screen pass their active filter, e.g. `highlightPlatform`
  // — undefined on paths with no active filter). `gamePlatforms` — the
  // game's own current platform list, used only as the "add every platform"
  // default when there's no specific platform in context (see below).
  const toggleWatchlist = (title, platform, gamePlatforms) => {
    const current = new Set(savedPlatforms[title] || []);
    const wasSavedAtAll = current.size > 0;

    if (platform) {
      // A specific platform is in context — toggle just that one. Wishlisting
      // a game on PS5 must not affect (or read as affecting) its Xbox
      // entry, and vice versa, per the explicit ask this was built for.
      if (current.has(platform)) current.delete(platform);
      else current.add(platform);
    } else if (current.size > 0) {
      // No specific platform, already saved for at least one — treat this as
      // "un-watchlist the whole game" (e.g. the Watchlist screen's own heart,
      // which has no filter concept), same as the old single-toggle behavior.
      current.clear();
    } else {
      // No specific platform, not saved yet — default to every platform the
      // game is currently listed on, matching the old "just save the title"
      // behavior when there's no more specific intent to honor.
      (gamePlatforms || ALL_PLATFORM_KEYS).forEach((p) => current.add(p));
    }

    const willBeSavedAtAll = current.size > 0;

    setSavedPlatforms((prev) => {
      const next = { ...prev };
      if (current.size > 0) next[title] = [...current];
      else delete next[title];
      return next;
    });

    // Reminders stay one-per-title, not one-per-platform — only start/clear
    // one on a genuine add-from-nothing or remove-to-nothing. Toggling a
    // second platform on an already-saved title (or removing one of several)
    // leaves the existing reminder lead-time alone.
    if (!wasSavedAtAll && willBeSavedAtAll) {
      setReminders((r) => ({ ...r, [title]: r[title] || 'release_day' }));
    } else if (wasSavedAtAll && !willBeSavedAtAll) {
      setReminders((r) => {
        const { [title]: _, ...rest } = r;
        return rest;
      });
    }

    // Track the platform this title's single reminder should follow the
    // date of — the most recently explicitly-added platform. Only updated on
    // a genuine add of a specific platform (not a removal, and not the
    // "add every platform" no-context default, which has no one platform to
    // prefer over the others).
    if (platform && current.has(platform)) {
      setPlatformContext((p) => ({ ...p, [title]: platform }));
    }
    // Actual notification scheduling/cancellation is handled by the
    // syncReminderSchedule effect above, reacting to the `saved`/
    // `platformContext` change.
  };

  const setReminderLead = (title, key) => {
    setReminders((r) => ({ ...r, [title]: key }));
  };

  // ADDED 2026-08-20: used only by the Watchlist tab's swipe-to-remove Undo
  // action (see components/SwipeableGameCard.js / app/(tabs)/watchlist.js).
  // toggleWatchlist has no way to know what a title's exact prior state was
  // once it's already been removed — calling it again would just re-derive
  // a fresh "every platform" default, not necessarily what was actually
  // there before (e.g. a title saved on PS5 only). This restores the exact
  // platform list, reminder lead time, and reminder-tracking platform from a
  // snapshot the caller took right before removing it. Deliberately narrow —
  // not exposed as a general-purpose setter anywhere else in the app.
  const restoreWatchlistEntry = (title, snapshot) => {
    if (!snapshot || !snapshot.platforms || snapshot.platforms.length === 0) return;
    setSavedPlatforms((prev) => ({ ...prev, [title]: snapshot.platforms }));
    if (snapshot.reminderLead) {
      setReminders((r) => ({ ...r, [title]: snapshot.reminderLead }));
    }
    if (snapshot.platformContext) {
      setPlatformContext((p) => ({ ...p, [title]: snapshot.platformContext }));
    }
  };

  const value = useMemo(
    () => ({
      saved,
      savedPlatforms,
      toggleWatchlist,
      restoreWatchlistEntry,
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
    [saved, savedPlatforms, reminders, platformContext, preferredPlatform, preferredGenre, weeklyDigestEnabled]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
