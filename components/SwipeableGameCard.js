import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// How far (fraction of screen width) or how fast a swipe has to travel
// before it counts as "let go of it" rather than "just repositioning it" —
// tuned to feel decisive without being accidental-trigger-happy, roughly
// matching iOS Mail / Gmail's own swipe-to-remove thresholds.
const DISMISS_DISTANCE = SCREEN_WIDTH * 0.32;
const DISMISS_VELOCITY = 800;

// ADDED 2026-08-20: swipe-to-remove for the Watchlist tab, per Dan's ask —
// "the swipe itself removes the card," fluid, as if lifting the title and
// swiping it away and off the screen, either direction. Deliberately generic
// (children + onDismiss) rather than Watchlist- or GameCard-specific, so the
// pattern can wrap anything else later if it's ever wanted elsewhere.
//
// `onDismiss` fires only once the full animation sequence has actually
// finished on screen — fly off in whichever direction it was swiped, fade
// out, then the now-empty row's height collapses to close the gap — not the
// moment the gesture ends. The caller (Watchlist screen) does the real data
// removal there, not before, so nothing visibly jumps: by the time the row
// disappears from the underlying FlatList data, it's already invisible and
// zero-height, so its abrupt unmount is imperceptible.
//
// Built on react-native-gesture-handler + react-native-reanimated (plus
// react-native-worklets, reanimated 4's separate runtime package) — real new
// native dependencies, not something achievable this fluidly with core
// React Native's Animated/PanResponder alone. See the fix log / roadmap
// entry for this feature for the version-pinning research (matched to what
// Expo SDK 54 actually bundles, not just "latest") and the New Architecture
// note (Reanimated 4 requires it; app.json now sets newArchEnabled
// explicitly rather than relying on an assumed default).
export default function SwipeableGameCard({ children, onDismiss }) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  // Holds the row's own measured pixel height once known (null until the
  // first onLayout), so the collapse-after-dismiss animation has a real
  // number to animate down to 0 from — you can't animate to/from "auto".
  const height = useSharedValue(null);

  const pan = Gesture.Pan()
    // Only "claims" the gesture once the finger has actually moved mostly
    // sideways — otherwise a normal vertical scroll on the Watchlist list
    // would get hijacked by this the moment a finger lands on a card.
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onStart(() => {
      scale.value = withTiming(1.035, { duration: 120 });
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const traveled = Math.abs(e.translationX);
      const fast = Math.abs(e.velocityX) > DISMISS_VELOCITY;
      const far = traveled > DISMISS_DISTANCE;
      if (fast || far) {
        // Let go decisively — carry it the rest of the way off screen in
        // the same direction it was already moving, fade it out, then
        // collapse the gap, then (and only then) tell the caller it's
        // really gone.
        const direction = e.translationX >= 0 ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.2, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(0, { duration: 190 }, (finished) => {
          if (finished) {
            height.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished2) => {
              if (finished2 && onDismiss) scheduleOnRN(onDismiss);
            });
          }
        });
      } else {
        // Didn't travel far/fast enough to count — spring back into place.
        translateX.value = withSpring(0, { damping: 18, stiffness: 190 });
        scale.value = withTiming(1, { duration: 160 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
      // A small rotation tied to how far it's traveled — the "tossing it
      // away" feel Dan asked for, not just a flat horizontal slide.
      { rotate: `${interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-8, 0, 8], 'clamp')}deg` },
    ],
    opacity: opacity.value,
    // "Lifting" it off the list — a soft shadow that grows with the same
    // scale bump used at gesture start/end, on both platforms.
    shadowOpacity: interpolate(scale.value, [1, 1.035], [0, 0.3], 'clamp'),
    shadowRadius: interpolate(scale.value, [1, 1.035], [0, 10], 'clamp'),
    elevation: interpolate(scale.value, [1, 1.035], [0, 6], 'clamp'),
  }));

  const wrapperStyle = useAnimatedStyle(() => ({
    height: height.value === null ? undefined : height.value,
  }));

  return (
    <Animated.View
      style={[styles.wrapper, wrapperStyle]}
      onLayout={(e) => {
        // Capture the natural height exactly once — after a collapse
        // starts, height.value is no longer null, so this won't refire and
        // fight the shrinking animation with a stale re-measurement.
        if (height.value === null) height.value = e.nativeEvent.layout.height;
      }}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.shadow, rowStyle]}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden' },
  shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 } },
});
