import { useState, useMemo } from 'react';
import { View, Text, Image, SectionList, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, PLATFORMS, GENRES, posterThemes, hashStr } from '../../lib/theme';
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
  const { saved, toggleWatchlist, preferredPlatform, preferredGenre } = useWatchlist();
  const [activePlatform, setActivePlatform] = useState(preferredPlatform);
  const [activeGenre, setActiveGenre] = useState(preferredGenre);
  // No "preferred month" concept, unlike platform/genre — the whole point of
  // this filter is a rolling window that shifts day to day, so there's
  // nothing sensible to persist as a default. Always starts on "All Months".
  const [activeMonth, setActiveMonth] = useState('all');

  // Games shown on the Calendar screen exclude anything already on the
  // watchlist — once you've saved a game, the Calendar's job (helping you
  // decide what to track) is done for it, and it "moves" to the Watchlist
  // tab instead. Applies everywhere below: the hero pick, the filtered
  // list, and the month chips — derived once here so all three stay in
  // sync automatically as `saved` changes (e.g. right after tapping
  // "ADD TO WATCHLIST", the hero immediately advances to the next
  // not-yet-saved release).
  const visibleGames = useMemo(() => games.filter((g) => !saved.has(g.title)), [games, saved]);

  const hero = useMemo(() => (visibleGames.length ? pickNextRelease(visibleGames) : null), [visibleGames]);
  const heroDays = hero ? daysUntil(hero.date) : 0;
  // Always false by construction now — hero is picked from visibleGames,
  // which already excludes anything in `saved`. Left in place (rather than
  // hardcoding the button to its "not saved" state) so this keeps working
  // correctly on its own if that invariant ever changes.
  const heroSaved = hero ? saved.has(hero.title) : false;
  const heroTheme = hero ? posterThemes[hashStr(hero.title) % posterThemes.length] : posterThemes[0];

  const filtered = useMemo(
    () => visibleGames.filter((g) =>
      (activePlatform === 'all' || g.platforms.includes(activePlatform)) &&
      (activeGenre === 'all' || g.genreCategory === activeGenre) &&
      (activeMonth === 'all' || `${g.date[0]}-${g.date[1]}` === activeMonth)
    ),
    [visibleGames, activePlatform, activeGenre, activeMonth]
  );

  // SectionList wants { title, data } per section instead of the { label, games }
  // shape we used with plain arrays — same grouping logic, different output shape.
  const sections = useMemo(() => {
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
        return { title: `${MONTH_NAMES[m]} ${y}`, data: gs.sort((a, b) => a.date[2] - b.date[2]) };
      });
  }, [filtered]);

  const platformChips = [{ key: 'all', label: 'All' }, ...Object.entries(PLATFORMS).map(([k, v]) => ({ key: k, label: v.label }))];
  const genreChips = [{ key: 'all', label: 'All Genres' }, ...GENRES.map((g) => ({ key: g, label: g }))];
  // Built from the live dataset, not a fixed 12-month list — the dataset is
  // a rolling "next 12 months from today" window that shifts every day, so a
  // hardcoded month list would drift out of sync. Derived from `visibleGames`
  // (not `filtered`), same as the platform/genre chip lists above always
  // showing every option regardless of what else is active — but still
  // excludes watchlisted games, same as everything else on this screen, so a
  // month with only saved releases in it doesn't show an empty-feeling chip.
  const monthChips = useMemo(() => {
    const seen = new Map();
    visibleGames.forEach((g) => {
      const key = `${g.date[0]}-${g.date[1]}`;
      if (!seen.has(key)) seen.set(key, { y: g.date[0], m: g.date[1] });
    });
    const months = [...seen.entries()]
      .sort(([, a], [, b]) => (a.y !== b.y ? a.y - b.y : a.m - b.m))
      .map(([key, { y, m }]) => ({ key, label: `${MONTH_NAMES[m].slice(0, 3)} ${y}` }));
    return [{ key: 'all', label: 'All Months' }, ...months];
  }, [visibleGames]);

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

  const ListHeader = (
    <>
      {hero && (
        <View style={styles.hero}>
          {hero.coverUrl ? (
            <Image source={{ uri: hero.coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={heroTheme} start={{ x: 0.15, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient
            colors={['rgba(10,12,16,0.15)', 'rgba(10,12,16,0.65)', 'rgba(10,12,16,0.94)']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
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
        {platformChips.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setActivePlatform(c.key)}
            style={[styles.chip, activePlatform === c.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, activePlatform === c.key && styles.chipTextActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersSecondary} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {genreChips.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setActiveGenre(c.key)}
            style={[styles.genreChip, activeGenre === c.key && styles.genreChipActive]}
          >
            <Text style={[styles.genreChipText, activeGenre === c.key && styles.genreChipTextActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {monthChips.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersTertiary} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {monthChips.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => setActiveMonth(c.key)}
              style={[styles.monthChip, activeMonth === c.key && styles.monthChipActive]}
            >
              <Text style={[styles.monthChipText, activeMonth === c.key && styles.monthChipTextActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>UPCOMING RELEASES</Text>
        <Text style={styles.sectionCount}>{filtered.length} TITLES</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <GameCard
              game={item}
              highlightPlatform={activePlatform !== 'all' ? activePlatform : undefined}
            />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.monthLabel}>{section.title}</Text>
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {games.length > 0 && visibleGames.length === 0
              ? "You've added every upcoming release to your watchlist — check there instead."
              : 'Nothing here for this combination yet — try a different platform, genre, or month.'}
          </Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        // Rendering tuning — keeps memory bounded even with hundreds of cards.
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        // removeClippedSubviews re-enabled 2026-08-17 now that GameCard uses
        // expo-image — see the note in app/search.js for the full story on
        // the crash this previously caused (fix log item 8).
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  hero: {
    padding: 20, paddingTop: 24,
    borderBottomWidth: 1, borderBottomColor: colors.line,
    position: 'relative', overflow: 'hidden',
    minHeight: 260, justifyContent: 'flex-end',
  },
  eyebrow: {
    color: colors.orange, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1, marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroTitle: {
    fontFamily: 'Poppins_800ExtraBold', fontSize: 26, color: colors.white, marginBottom: 8, maxWidth: 320,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  heroSub: {
    color: '#D5D9DE', fontSize: 14, marginBottom: 4, maxWidth: 320, lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroMeta: {
    color: '#D5D9DE', fontSize: 12.5, marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroBtn: { backgroundColor: colors.orange, borderRadius: 9, paddingVertical: 13, alignItems: 'center' },
  heroBtnSaved: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.orange },
  heroBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 13.5, color: '#1A0F00' },
  filters: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingTop: 14, paddingBottom: 10 },
  filtersSecondary: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingTop: 4, paddingBottom: 14 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.white, borderColor: colors.white },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5, color: colors.muted },
  chipTextActive: { color: colors.bgPage },
  genreChip: { paddingHorizontal: 13, paddingVertical: 6.5, borderRadius: 999, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  genreChipActive: { backgroundColor: colors.orangeDim, borderColor: colors.orange },
  genreChipText: { fontFamily: 'Inter_500Medium', fontSize: 11.5, color: colors.mutedDim },
  genreChipTextActive: { color: colors.orange, fontFamily: 'Inter_600SemiBold' },
  filtersTertiary: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingTop: 4, paddingBottom: 14 },
  monthChip: { paddingHorizontal: 13, paddingVertical: 6.5, borderRadius: 999, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line },
  monthChipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  monthChipText: { fontFamily: 'Inter_500Medium', fontSize: 11.5, color: colors.mutedDim },
  monthChipTextActive: { color: colors.white, fontFamily: 'Inter_600SemiBold' },
  listContent: { paddingBottom: 100 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, marginTop: 4, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 15, letterSpacing: 0.5, color: colors.white },
  sectionCount: { fontSize: 11.5, color: colors.mutedDim, fontFamily: 'Inter_600SemiBold' },
  cardWrap: { paddingHorizontal: 16 },
  monthLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11.5, color: colors.mutedDim, letterSpacing: 1, textTransform: 'uppercase', marginVertical: 12, paddingHorizontal: 16 },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center', padding: 30 },
});
