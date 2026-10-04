import { createContext, useContext, useState, useEffect } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { useGames } from './GamesContext';
import { useWatchlist } from './WatchlistContext';

const STORAGE_KEY = 'steam_link_v1';
const API_URL = 'https://gaming-views-backend.vercel.app/api/games';
const STEAM_AUTH_URL = 'https://gaming-views-backend.vercel.app/api/steam-auth';
const CALLBACK_URL = 'gamingviews://steam-callback';

const SteamLinkContext = createContext(null);

export function SteamLinkProvider({ children }) {
  const { games } = useGames();
  const { saved, toggleWatchlist } = useWatchlist();
  const [steamId, setSteamId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState(null);

  // Load persisted state once on mount - same pattern as every other
  // context in this app (WatchlistContext.js, GamesContext.js).
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.steamId) setSteamId(parsed.steamId);
        }
      } catch {
        // Corrupt/unreadable storage shouldn't crash the app - just start fresh.
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist on every change, same hydrated-guard pattern as
  // WatchlistContext.js - avoids the first render (before loading finishes)
  // immediately overwriting a real saved steamId with null.
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ steamId, linkedAt: steamId ? Date.now() : null })).catch(() => {});
  }, [hydrated, steamId]);

  // Steam OpenID 2.0 login, not OAuth2 - the whole round trip (redirect to
  // Steam, log in, redirect back) happens inside this one browser session;
  // openAuthSessionAsync resolves directly with the final redirect URL in
  // the common case, so no separate token exchange step exists to add
  // here. See app/_layout.js's own Linking listener for the defensive
  // fallback path (cold-start deep link instead of this promise resolving).
  const linkSteamAccount = async () => {
    setLinking(true);
    setError(null);
    try {
      const result = await WebBrowser.openAuthSessionAsync(`${STEAM_AUTH_URL}?mode=login`, CALLBACK_URL);
      if (result.type !== 'success') {
        // User cancelled/dismissed - not an error worth surfacing.
        return;
      }
      const parsed = new URL(result.url);
      const id = parsed.searchParams.get('steamid');
      const errParam = parsed.searchParams.get('error');
      if (id) {
        setSteamId(id);
      } else {
        setError(errParam || 'Could not link your Steam account. Try again.');
      }
    } catch {
      setError('Could not link your Steam account. Check your connection and try again.');
    } finally {
      setLinking(false);
    }
  };

  // Only clears the locally-stored SteamID64 - there's nothing to revoke
  // with Steam itself (OpenID 2.0 issues no token to invalidate).
  const unlinkSteamAccount = () => {
    setSteamId(null);
    setError(null);
  };

  // Handles a callback URL arriving via a cold-start/background deep link
  // instead of openAuthSessionAsync's own promise resolving - same parsing,
  // same resulting state, not a second parallel code path. This is the
  // first incoming-deep-link handling anywhere in this app (confirmed via
  // a full-repo grep before building this - nothing existed), kept local
  // to this provider since it's the one piece of state a Steam callback
  // URL could ever affect.
  const handleCallbackUrl = (url) => {
    if (!url || !url.startsWith(CALLBACK_URL)) return;
    try {
      const parsed = new URL(url);
      const id = parsed.searchParams.get('steamid');
      if (id) setSteamId(id);
    } catch {
      // Malformed URL - nothing to do.
    }
  };

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleCallbackUrl(url);
    }).catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => handleCallbackUrl(url));
    return () => subscription.remove();
  }, []);

  // ADDED (Steam wishlist auto-sync): fires on the exact same
  // hydrated/games-change trigger shape as WatchlistContext.js's existing
  // syncReminderSchedule/scheduleWeeklyDigest effects - piggybacks on
  // GamesContext's own refetch cadence (cold start, pull-to-refresh)
  // rather than a new timer. Checks saved.has(title) before calling
  // toggleWatchlist for each matched game - mandatory, since
  // toggleWatchlist is a toggle, not an idempotent add; calling it on an
  // already-saved title would remove it. Once a title is in `saved`, it's
  // never toggled again by a later sync.
  // Known, expected consequence of "auto-sync from source of truth" with
  // no exclusion list (per Dan's explicit choice not to build undo-
  // tagging): a title manually removed from the Watchlist that's still on
  // the Steam wishlist gets silently re-added on the next sync.
  useEffect(() => {
    if (!hydrated || !steamId || games.length === 0) return;
    (async () => {
      try {
        const response = await fetch(`${API_URL}?when=steam-wishlist&steamid=${encodeURIComponent(steamId)}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!data.games) return;
        for (const game of data.games) {
          if (!saved.has(game.title)) {
            toggleWatchlist(game.title, undefined, game.platforms);
          }
        }
      } catch {
        // Best-effort - a failed sync just means nothing new gets added
        // until the next trigger; never surfaced as a user-facing error.
      }
    })();
  }, [hydrated, steamId, games, saved]);

  return (
    <SteamLinkContext.Provider
      value={{ steamId, hydrated, linking, error, linkSteamAccount, unlinkSteamAccount }}
    >
      {children}
    </SteamLinkContext.Provider>
  );
}

export function useSteamLink() {
  const ctx = useContext(SteamLinkContext);
  if (!ctx) throw new Error('useSteamLink must be used inside SteamLinkProvider');
  return ctx;
}
