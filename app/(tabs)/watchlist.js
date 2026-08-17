import { useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/theme';
import { useGames } from '../../lib/GamesContext';
import { toDate } from '../../lib/dates';
import { useWatchlist } from '../../lib/WatchlistContext';
import GameCard from '../../components/GameCard';

export default function WatchlistScreen() {
  const router = useRouter();
  const { games } = useGames();
  const { saved } = useWatchlist();

  const items = useMemo(
    () => [...saved].map((t) => games.find((g) => g.title === t)).filter(Boolean).sort((a, b) => toDate(a.date) - toDate(b.date)),
    [saved, games]
  );

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
          renderItem={({ item }) => <GameCard game={item} />}
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
    </View>
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
});
