import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PLATFORMS } from '../../lib/theme';
import { useGames } from '../../lib/GamesContext';
import { LoadingState, ErrorState } from '../../lib/StateViews';
import { daysUntil, formatDate, MONTH_NAMES } from '../../lib/dates';
import { useWatchlist } from '../../lib/WatchlistContext';
import GameCard from '../../components/GameCard';

function pickNextRelease(games) {
  return [...games].filter((g) => daysUntil(g.date) >= 0).sort((a, b) => daysUntil(a.date) - daysUntil(b.date))[0] || games[0];
}

export default function CalendarScreen() {
  const router = useRouter();
  const { games, loading, error, refetch } = useGames();
  const { saved, toggleWatchlist, preferredPlatform } = useWatchlist();
  const [activePlatform, setActivePlatform] = useState(preferredPlatform);

  const hero = useMemo(() => (games.length ? pickNextRelease(games) : null), [games]);
  const heroDays = hero ? daysUntil(hero.date) : 0;
  const heroSaved = hero ? saved.has(hero.title) : false;

  const filtered = useMemo(
    () => games.filter((g) => activePlatform === 'all' || g.platforms.includes(activePlatform)),
    [games, activePlatform]
  );

  const grouped = useMemo(() => {
    const byMonth = {};
    filtered.forEach((g) => {
      const key = `${g.date[0]}-${g.date[1]}`;
      (byMonth[key] = byMonth[key] || []).push(g);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => {
        const [ya, ma] = a.split('-').map(Number), [yb, mb] = b.split('-').map(Number);
        return ya !== yb ? ya - yb : ma - mb;
      })
      .map(([key, gs]) => {
        const [y, m] = key.split('-').map(Number);
        return { label: `${MONTH_NAMES[m]} ${y}`, games: gs.sort((a, b) => a.date[2] - b.date[2]) };
      });
  }, [filtered]);

  const filterChips = [{ key: 'all', label: 'All' }, ...Object.entries(PLATFORMS).map(([k, v]) => ({ key: k, label: v.label }))];

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState label="Loading upcoming releases…" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorState message={error} onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {hero && (
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>NEXT UP</Text>
            <Pressable onPress={() => router.push(`/game/${encodeURIComponent(hero.title)}`)}>
              <Text style={styles.heroTitle}>{hero.title}</Text>
            </Pressable>
            <Text style={styles.heroSub}>
              Releasing on {hero.platforms.map((p) => PLATFORMS[p].full).join(', ')}.
            </Text>
            <Text style={styles.heroMeta}>
              {formatDate(hero.date)} · {heroDays <= 0 ? 'Out today' : heroDays === 1 ? '1 day left' : `${heroDays} days left`}
            </Text>
            <Pressable
              style={[styles.heroBtn, heroSaved && styles.heroBtnSaved]}
              onPress={() => toggleWatchlist(hero.title)}
            >
              <Text style={[styles.heroBtnText, heroSaved && { color: colors.orange }]}>
                {heroSaved ? '❤️ ADDED TO WATCHLIST' : '🤍 ADD TO WATCHLIST'}
              </Text>
            </Pressable>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {filterChips.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => setActivePlatform(c.key)}
              style={[styles.chip, activePlatform === c.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, activePlatform === c.key && styles.chipTextActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>UPCOMING RELEASES</Text>
            <Text style={styles.sectionCount}>{filtered.length} TITLES</Text>
          </View>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>Nothing here for this platform yet.</Text>
          ) : (
            grouped.map((group) => (
              <View key={group.label}>
                <Text style={styles.monthLabel}>{group.label}</Text>
                {group.games.map((g) => (
                  <GameCard
                    key={g.title}
                    game={g}
                    highlightPlatform={activePlatform !== 'all' ? activePlatform : undefined}
                  />
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  hero: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.line },
  eyebrow: { color: colors.orange, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  heroTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 26, color: colors.white, marginBottom: 8, maxWidth: 320 },
  heroSub: { color: colors.muted, fontSize: 14, marginBottom: 4, maxWidth: 320, lineHeight: 20 },
  heroMeta: { color: colors.muted, fontSize: 12.5, marginBottom: 16 },
  heroBtn: { backgroundColor: colors.orange, borderRadius: 9, paddingVertical: 13, alignItems: 'center' },
  heroBtnSaved: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.orange },
  heroBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 13.5, color: '#1A0F00' },
  filters: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 14 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.white, borderColor: colors.white },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5, color: colors.muted },
  chipTextActive: { color: colors.bgPage },
  section: { padding: 16, paddingBottom: 100 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 15, letterSpacing: 0.5, color: colors.white },
  sectionCount: { fontSize: 11.5, color: colors.mutedDim, fontFamily: 'Inter_600SemiBold' },
  monthLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11.5, color: colors.mutedDim, letterSpacing: 1, textTransform: 'uppercase', marginVertical: 12 },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center', padding: 30 },
});
