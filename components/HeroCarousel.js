import { useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, PLATFORMS, posterThemes, hashStr } from '../lib/theme';
import { daysUntil, formatDate } from '../lib/dates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ADDED 2026-08-20 (Phase 3C — "Gaming Views Recommends" hero carousel):
// replaces the Calendar screen's old single "Next Up" hero (picked purely
// by nearest release date) with a small swipeable set, ranked primarily by
// real anticipation rather than just which date happens to be soonest. The
// selection logic itself (pickRecommended) lives in app/(tabs)/index.js,
// same place the old pickNextRelease lived and the same place filtered/
// sections/monthChips are computed — this component is deliberately just
// the presentational carousel, handed an already-ranked list.
//
// Cards peek at the edge on purpose (CARD_WIDTH_RATIO < 1) rather than
// filling the full screen width — that's the visual cue that there's more
// to swipe through, not just a single static hero that happens to be
// narrower than before. Prototyped first as a static HTML mockup and
// approved by Dan before any of this was written — see
// gaming-views-roadmap.md Phase 3C for that history and the "Gaming Views
// Recommends" naming decision (deliberately editorial-sounding even though
// the ranking itself is fully automatic — see pickRecommended's own
// comments for why).
const CARD_WIDTH_RATIO = 0.82;
const CARD_GAP = 10;
const CARD_WIDTH = SCREEN_WIDTH * CARD_WIDTH_RATIO;

function HeroCard({ game, rankIndex, isSaved, onToggleWatchlist, onPress }) {
  const theme = posterThemes[hashStr(game.title) % posterThemes.length];
  const days = daysUntil(game.date);
  // Only genuinely hype-ranked picks (rankIndex not null — see
  // pickRecommended) get a rank badge. Fallback fill-in cards (used when
  // IGDB doesn't have enough real hype data to fill every slot) deliberately
  // show no badge at all rather than a fabricated rank — they weren't
  // actually ranked by anything.
  const badgeLabel = rankIndex === 0 ? '🔥 MOST ANTICIPATED' : rankIndex != null ? `#${rankIndex + 1} ANTICIPATED` : null;

  return (
    <View style={styles.card}>
      {game.coverUrl ? (
        <Image source={{ uri: game.coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={theme} start={{ x: 0.15, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient
        colors={['rgba(10,12,16,0.15)', 'rgba(10,12,16,0.65)', 'rgba(10,12,16,0.94)']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {badgeLabel && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>{badgeLabel}</Text>
        </View>
      )}
      <Pressable onPress={onPress}>
        <Text style={styles.cardTitle} numberOfLines={2}>{game.title}</Text>
      </Pressable>
      <Text style={styles.cardSub} numberOfLines={1}>
        Releasing on {game.platforms.map((p) => PLATFORMS[p].full).join(', ')}.
      </Text>
      <Text style={styles.cardMeta}>
        {formatDate(game.date)} · {days <= 0 ? 'Out today' : days === 1 ? '1 day left' : `${days} days left`}
      </Text>
      <Pressable
        style={[styles.cardBtn, isSaved && styles.cardBtnSaved]}
        onPress={onToggleWatchlist}
      >
        <Text style={[styles.cardBtnText, isSaved && { color: colors.orange }]}>
          {isSaved ? '❤️ ADDED TO WATCHLIST' : '🤍 ADD TO WATCHLIST'}
        </Text>
      </Pressable>
    </View>
  );
}

export default function HeroCarousel({ recommended, saved, toggleWatchlist, onOpenGame }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!recommended || recommended.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>🎮 GAMING VIEWS RECOMMENDS</Text>
        <Text style={styles.sectionCount}>{recommended.length} PICK{recommended.length !== 1 ? 'S' : ''}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={styles.carouselContent}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP));
          setActiveIndex(Math.max(0, Math.min(i, recommended.length - 1)));
        }}
      >
        {recommended.map(({ game, rankIndex }) => (
          <View key={game.title} style={{ width: CARD_WIDTH }}>
            <HeroCard
              game={game}
              rankIndex={rankIndex}
              isSaved={saved.has(game.title)}
              onToggleWatchlist={() => toggleWatchlist(game.title, undefined, game.platforms)}
              onPress={() => onOpenGame(game.title)}
            />
          </View>
        ))}
      </ScrollView>

      {recommended.length > 1 && (
        <View style={styles.dots}>
          {recommended.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  sectionTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 15, letterSpacing: 0.5, color: colors.white },
  sectionCount: { fontSize: 11.5, color: colors.mutedDim, fontFamily: 'Inter_600SemiBold' },
  carouselContent: { paddingHorizontal: 16, gap: CARD_GAP },
  card: {
    aspectRatio: 4 / 3.1,
    borderRadius: 16, overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: colors.line,
    justifyContent: 'flex-end', padding: 18,
  },
  rankBadge: {
    position: 'absolute', top: 14, left: 14, zIndex: 2,
    backgroundColor: 'rgba(10,12,16,0.72)', borderWidth: 1, borderColor: colors.line,
    borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5,
  },
  rankBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10.5, letterSpacing: 0.4, color: colors.orange },
  cardTitle: {
    fontFamily: 'Poppins_800ExtraBold', fontSize: 20, color: colors.white, marginBottom: 6, lineHeight: 24,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  cardSub: {
    color: '#D5D9DE', fontSize: 12.5, marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  cardMeta: {
    color: '#D5D9DE', fontSize: 11.5, marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  cardBtn: { backgroundColor: colors.orange, borderRadius: 9, paddingVertical: 11, alignItems: 'center' },
  cardBtnSaved: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.orange },
  cardBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 12.5, color: '#1A0F00' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { width: 16, backgroundColor: colors.orange },
});
