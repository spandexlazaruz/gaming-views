import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '../../lib/theme';
import { useGames } from '../../lib/GamesContext';
import { toDate } from '../../lib/dates';
import { useWatchlist } from '../../lib/WatchlistContext';
import GameCard from '../../components/GameCard';
import SwipeableGameCard from '../../components/SwipeableGameCard';

// ADDED 2026-08-20: how long the "Removed — Undo" toast stays up before a
// swipe-removal becomes final. Long enough to actually notice and react to
// (the swipe motion itself doesn't leave much time to process what just
// happened), short enough not to linger — roughly Android's own Snackbar
// default.
const UNDO_WINDOW_MS = 4000;

export default function WatchlistScreen() {
  const router = useRouter();
  const { games } = useGames();
  const { saved, savedPlatforms, reminders, platformContext, toggleWatchlist, restoreWatchlistEntry } = useWatchlist();
  // The most recent swipe-removal still within its undo window, or null.
  // Single-slot deliberately — matches how most apps handle this (e.g.
  // Gmail's own archive-undo snackbar): swiping a second card before the
  // first's window closes replaces the offer rather than stacking toasts.
  const [recentlyRemoved, setRecentlyRemoved] = useState(null); // { title, snapshot }
  const undoTimer = useRef(null);

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  const items = useMemo(
    () => [...saved].map((t) => games.find((g) => g.title === t)).filter(Boolean).sort((a, b) => toDate(a.date) - toDate(b.date)),
    [saved, games]
  );

  const handleSwipeRemove = (title) => {
    // Snapshot exactly what's about to be removed — the platforms it was
    // saved under, its reminder lead time, and which platform its reminder
    // was following — so Undo can restore it exactly as it was rather than
    // toggleWatchlist re-deriving a fresh "every platform" default (see
    // restoreWatchlistEntry in WatchlistContext).
    const snapshot = {
      platforms: savedPlatforms[title] || [],
      reminderLead: reminders[title],
      platformContext: platformContext[title],
    };
    // No platform in context on this screen → un-watchlists the whole game,
    // same as tapping the card's own heart icon here.
    toggleWatchlist(title);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setRecentlyRemoved({ title, snapshot });
    undoTimer.current = setTimeout(() => setRecentlyRemoved(null), UNDO_WINDOW_MS);
  };

  const handleUndo = () => {
    if (!recentlyRemoved) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    restoreWatchlistEntry(recentlyRemoved.title, recentlyRemoved.snapshot);
    setRecentlyRemoved(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>Your Watchlist</Text>
        {/* Reflects `items` (what's actually rendered below), not the raw
            saved.size — a title stops resolving once its game drops out of
            the live dataset (e.g. past its release date), and the count
            needs to follow that, not just the add/remove tally. */}
        <Text style={styles.count}>{items.length} GAME{items.length !== 1 ? 'S' : ''}</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎮</Text>
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptyDesc}>Tap the heart on any game — from the calendar, search, or its detail page — to start tracking it here.</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push('/')}>
            <Text style={styles.emptyBtnText}>Browse Upcoming Releases</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => (
            // ADDED 2026-08-20: swipe left or right to remove — the swipe
            // itself removes the card (no confirm step), see
            // SwipeableGameCard for the gesture/animation and the Undo
            // toast below for the accidental-swipe safety net.
            <SwipeableGameCard onDismiss={() => handleSwipeRemove(item.title)} swipeKey={item.title}>
              {/* multiPlatformBadges: shows every platform this title is
                  actually saved under (e.g. wishlisted on PS5 and Xbox
                  separately shows both badges on the one card) instead of a
                  single arbitrary platform — see components/GameCard.js. */}
              <GameCard game={item} showReminder multiPlatformBadges />
            </SwipeableGameCard>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          // removeClippedSubviews re-enabled 2026-08-17 now that GameCard
          // uses expo-image — see the note in app/search.js (fix log item 8).
          removeClippedSubviews
        />
      )}

      {recentlyRemoved && <UndoToast title={recentlyRemoved.title} onUndo={handleUndo} />}
    </View>
  );
}

// Small fade/slide-up confirmation with an Undo action. Kept as a plain
// conditionally-rendered view (not remounted per removal) so swiping a
// second card while the first's toast is still up just updates the title
// and replays the entrance, rather than stacking toasts.
function UndoToast({ title, onUndo }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 220 });
  }, [title]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));

  return (
    <Animated.View style={[styles.toast, style]} pointerEvents="box-none">
      <Text style={styles.toastText} numberOfLines={1}>Removed “{title}”</Text>
      <Pressable onPress={onUndo} hitSlop={10} style={styles.toastUndoBtn}>
        <Text style={styles.toastUndoText}>UNDO</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', padding: 20, paddingBottom: 6 },
  title: { fontFamily: 'Poppins_800ExtraBold', fontSize: 20, color: colors.white },
  count: { fontSize: 11.5, color: colors.mutedDim, fontFamily: 'Inter_600SemiBold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyIcon: { fontSize: 34, marginBottom: 14 },
  emptyTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 16, color: colors.white, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: colors.orange, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  emptyBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#1A0F00' },
  toast: {
    position: 'absolute', left: 16, right: 16, bottom: 24,
    backgroundColor: colors.bgNav, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  toastText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.white },
  toastUndoBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  toastUndoText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.orange, letterSpacing: 0.3 },
});
