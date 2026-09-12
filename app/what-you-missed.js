import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';
import { useLastMonthGames } from '../lib/GamesContext';
import { LoadingState, ErrorState } from '../lib/StateViews';
import { MONTH_NAMES } from '../lib/dates';
import GameCard from '../components/GameCard';

// ADDED (item 35 — "What You Missed"): a fixed last-calendar-month window,
// not a general past-releases browser — see the backend's api/games.js
// (buildQueryWindow) for the deliberate v1 scope cut. Reuses GameCard as-is;
// a game that already released reads fine there already (daysUntil goes
// negative, GameCard's own badgeText logic already shows "OUT NOW" for
// that — see components/GameCard.js), so no new card variant was needed.
function lastMonthLabel() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export default function WhatYouMissedScreen() {
  const router = useRouter();
  const { games, loading, error, refetch } = useLastMonthGames();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.top}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>What You Missed</Text>
          <Text style={styles.subtitle}>{lastMonthLabel()}</Text>
        </View>
      </View>

      {loading ? (
        <LoadingState label="Loading last month's releases…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <GameCard game={item} />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nothing tracked released last month.</Text>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  top: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.bgNav, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  // FIXED (Android back-arrow vertical centering) — see app/accounts.js's
  // matching comment for the full story: same real prior fix (commit
  // 2bd96a4b, "Detail Nav Fix"), only ever applied to app/game/[title].js
  // before now, propagated here since this screen shares the identical
  // container/glyph/font-size pattern.
  backBtnText: {
    color: colors.white, fontSize: 18, lineHeight: 20,
    textAlignVertical: 'center', includeFontPadding: false,
    marginTop: -1,
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.white },
  subtitle: { fontSize: 11.5, color: colors.mutedDim, marginTop: 2, fontFamily: 'Inter_500Medium' },
  cardWrap: { paddingHorizontal: 16 },
  listContent: { paddingTop: 12, paddingBottom: 100 },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center', padding: 30 },
});
