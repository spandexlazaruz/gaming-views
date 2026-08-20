// ADDED 2026-08-20 (bug fix, round 2): a small, deliberately dumb piece of
// shared state that exists for exactly one reason — see
// components/SwipeableGameCard.js and components/GameCard.js for the full
// story, but in short: React Native's core Pressable and
// react-native-gesture-handler's Gesture.Pan run on two separate touch
// systems that don't always share the full touch stream with each other.
// The first fix attempt (toggling pointerEvents on the wrapped Pressable the
// moment a swipe was recognized) turned out not to be reliable — confirmed
// on-device by Dan on a fresh build that included it, the phantom
// tap-to-navigate still fired. Root cause, best understood: once
// react-native-gesture-handler's native Pan recognizer takes over a touch,
// React Native's own Pressability system can stop receiving the
// intermediate touch-move events that would normally tell it "this drifted
// outside the pressable, cancel the press" — so by the time it sees the
// touch end, it can still fire onPress, and no JS-side prop change made
// during the gesture can retroactively undo that at the native level.
//
// This sidesteps the whole native-arbitration question instead of trying to
// win it: mark a title as "just swiped away" the moment a real swipe is
// recognized (well before the finger actually lifts), and have the
// underlying card's own onPress check that flag and no-op if it's set —
// a plain synchronous JS check inside a JS callback, unaffected by whatever
// native touch-dispatch quirk caused that callback to fire in the first
// place.
const recentlyDismissed = new Set();

// How long a title stays flagged after a real swipe starts. Only needs to
// outlast the brief window between "gesture recognized" and "finger lifts /
// any phantom tap resolves" — generous on purpose so it's never the reason
// this doesn't work, but short enough that it can never suppress a later,
// genuinely new tap on a game that happens to share a title.
const WINDOW_MS = 1200;

export function markRecentlySwiped(key) {
  if (!key) return;
  recentlyDismissed.add(key);
  setTimeout(() => recentlyDismissed.delete(key), WINDOW_MS);
}

export function wasRecentlySwiped(key) {
  return !!key && recentlyDismissed.has(key);
}
