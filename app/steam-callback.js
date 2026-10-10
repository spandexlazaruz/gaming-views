import { useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSteamLink } from '../lib/SteamLinkContext';

// ADDED (real bug found via a closed-testing report: "Unmatched Route" -
// Page could not be found - after completing Steam login): expo-router
// intercepts every incoming deep link to resolve it against the app's own
// file-based routes before anything else gets a chance to handle it - a
// manual Linking listener (this screen's predecessor, see
// SteamLinkContext.js's own history) can still run, but expo-router's own
// "no route matched" fallback still wins the visible navigation state
// regardless. Giving it an actual route to match - this file, matching
// the `gamingviews://steam-callback` redirect URL passed to
// WebBrowser.openAuthSessionAsync in SteamLinkContext.js - fixes that at
// the source instead of fighting expo-router's own interception.
//
// Only reached via the fallback path: the OS hands control back through a
// real deep link instead of openAuthSessionAsync's own promise resolving
// (e.g. the app was backgrounded/closed during the Steam redirect). The
// common case (app stayed foregrounded) never navigates here at all -
// openAuthSessionAsync's own returned result is parsed directly inside
// linkSteamAccount, same as before this fix.
export default function SteamCallbackScreen() {
  const { steamid, error } = useLocalSearchParams();
  const router = useRouter();
  const { handleSteamCallback } = useSteamLink();
  // Guards against expo-router re-rendering this screen (e.g. a fast
  // refresh) from re-applying an already-handled callback and re-firing
  // the redirect - this should only ever run once per real navigation.
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    const id = Array.isArray(steamid) ? steamid[0] : steamid;
    const errorParam = Array.isArray(error) ? error[0] : error;
    handleSteamCallback(id, errorParam);
    // Lands back on Accounts regardless of outcome - that's the screen
    // that actually shows the linked/error state, same as the common
    // (non-fallback) path already does by just staying there.
    router.replace('/accounts');
  }, []);

  return null;
}
