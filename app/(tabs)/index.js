import { useState, useMemo } from 'react';
import { View, Text, SectionList, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PLATFORMS, GENRES } from '../../lib/theme';
import { useGames } from '../../lib/GamesContext';
import { LoadingState, ErrorState } from '../../lib/StateViews';
import { daysUntil, MONTH_NAMES, effectiveDate } from '../../lib/dates';
import { useWatchlist } from '../../lib/WatchlistContext';
import GameCard from '../../components/GameCard';
import HeroCarousel from '../../components/HeroCarousel';

const HERO_COUNT = 5;

// ADDED 2026-08-20 (Phase 3C — "Gaming Views Recommends" hero carousel):
// replaces the old pickNextRelease (which just picked the single nearest-
// date game) as the Calendar screen's hero selection logic. Researched
// IGDB's fields before building this rather than guessing: `hypes` (a plain
// integer field right on the standard /games endpoint — see the backend's
// api/games.js for the fields list and its own comment) is IGDB's purpose-
// built "how many people have marked this as anticipated" signal, confirmed
// via a third-party IGDB MCP server's own get_most_anticipated_games tool,
// which queries exactly `where hypes >= X & first_release_date > now; sort
// hypes desc;`. Deliberately NOT using IGDB's newer PopScore/
// popularity_primitives system — that's a separate endpoint requiring its
// own join, and isn't confirmed to be populated pre-release the way `hypes`
// reliably is.
//
// Ranks by hypes desc, takes the top HERO_COUNT. IGDB's hype data is
// sometimes sparse for a given dataset/window though — if fewer than
// HERO_COUNT games have any real hype at all, backfill the remaining slots
// with the old nearest-release logic (same as pickNextRelease used to do)
// so the carousel is never emptier than it needs to be. rankIndex is only
// set on genuinely hype-ranked picks — fallback fill-ins get rankIndex:
// null, and HeroCarousel.js's own badge logic deliberately shows no rank
// badge at all for those rather than a fabricated one.
function pickRecommended(games) {
  const hyped = [...games]
    .filter((g) => (g.hypes || 0) > 0)
    .sort((a, b) => (b.hypes || 0) - (a.hypes || 0))
    .slice(0, HERO_COUNT);

  const picks = hyped.map((game, rankIndex) => ({ game, rankIndex }));

  if (picks.length < HERO_COUNT) {
    const already = new Set(picks.map((p) => p.game.title));
    const fillers = [...games]
      .filter((g) => !already.has(g.title) && daysUntil(g.date) >= 0)
      .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
      .slice(0, HERO_COUNT - picks.length)
      .map((game) => ({ game, rankIndex: null }));
    picks.push(...fillers);
  }

  return picks;
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

  // Picked from visibleGames, same as the old hero was — a game already on
  // the watchlist has no business still showing up as a "recommendation" to
  // add it.
  const recommended = useMemo(() => pickRecommended(visibleGames), [visibleGames]);

  // ADDED 2026-08-19 (bug fix): both the month-filter match below and the
  // section grouping/sort further down now key off `effectiveDate(g,
  // activePlatform)` instead of the game's raw aggregate `g.date` — see
  // lib/dates.js's effectiveDate() for the full story (a real report:
  // Deadzone Rogue 2, PC Aug 21 but Xbox/PS5 Dec 31, was grouped/sorted
  // under August even while filtered to PS5, and didn't show up at all
  // under an explicit December filter, because both checks were still
  // reading the aggregate earliest-platform date instead of PS5's own).
  // Resolves to the same `g.date` as before whenever activePlatform is
  // 'all' or the game has no per-platform breakdown — no behavior change
  // for the common case.
  const filtered = useMemo(
    () => visibleGames.filter((g) => {
      const platformFilter = activePlatform !== 'all' ? activePlatform : null;
      const d = effectiveDate(g, platformFilter);
      return (
        (activePlatform === 'all' || g.platforms.includes(activePlatform)) &&
        (activeGenre === 'all' || g.genreCategory === activeGenre) &&
        (activeMonth === 'all' || `${d[0]}-${d[1]}` === activeMonth)
      );
    }),
    [visibleGames, activePlatform, activeGenre, activeMonth]
  );

  // SectionList wants { title, data } per section instead of the { label, games }
  // shape we used with plain arrays — same grouping logic, different output shape.
  const sections = useMemo(() => {
    const platformFilter = activePlatform !== 'all' ? activePlatform : null;
    const byMonth = {};
    filtered.forEach((g) => {
      const d = effectiveDate(g, platformFilter);
      const key = `${d[0]}-${d[1]}`;
      (byMonth[key] = byMonth[key] || []).push({ game: g, sortDate: d });
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => {
        const [ya, ma] = a.split('-').map(Number), [yb, mb] = b.split('-').map(Number);
        return ya !== yb ? ya - yb : ma - mb;
      })
      .map(([key, entries]) => {
        const [y, m] = key.split('-').map(Number);
        return {
          title: `${MONTH_NAMES[m]} ${y}`,
          data: entries.sort((a, b) => a.sortDate[2] - b.sortDate[2]).map((e) => e.game),
        };
      });
  }, [filtered, activePlatform]);

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
      <HeroCarousel
        recommended={recommended}
        saved={saved}
        toggleWatchlist={toggleWatchlist}
        onOpenGame={(title) => router.push(`/game/${encodeURIComponent(title)}`)}
      />

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
