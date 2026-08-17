import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, PLATFORMS, posterThemes, hashStr } from '../lib/theme';
import { daysUntil, formatDateShort } from '../lib/dates';
import { useWatchlist, LEAD_OPTIONS } from '../lib/WatchlistContext';

export default function GameCard({ game, highlightPlatform, showReminder }) {
  const router = useRouter();
  const { saved, toggleWatchlist, reminders } = useWatchlist();
  const isSaved = saved.has(game.title);
  // Only meaningful for saved games — showReminder is currently only passed
  // from the Watchlist screen, where every card is saved by definition, but
  // guarding on isSaved keeps this safe if it's ever reused elsewhere.
  const reminderLabel = showReminder && isSaved
    ? (LEAD_OPTIONS.find((o) => o.key === (reminders[game.title] || 'release_day')) || LEAD_OPTIONS[0]).label
    : null;
  const theme = posterThemes[hashStr(game.title) % posterThemes.length];
  const days = daysUntil(game.date);
  const primaryPlat = (highlightPlatform && game.platforms.includes(highlightPlatform))
    ? highlightPlatform
    : game.platforms[0];

  let badgeText = null;
  if (days <= 14) {
    badgeText = days <= 0 ? 'OUT NOW' : days === 1 ? 'TOMORROW' : `${days} DAYS`;
  }

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(
        // Carry the active platform filter (if any) through to the detail
        // screen as a query param, so its own ADD TO WATCHLIST button can
        // record the same platform GameCard's own heart toggle already does
        // (see toggleWatchlist(title, platform) calls below). Without this,
        // tapping into a game from e.g. a PS5-filtered list and adding it
        // from the detail page instead of the card's heart icon silently
        // fell back to the game's first-listed platform on Watchlist/Search
        // — same root cause as fix log item 4, this closes the one path
        // that fix didn't originally cover.
        highlightPlatform
          ? `/game/${encodeURIComponent(game.title)}?platform=${highlightPlatform}`
          : `/game/${encodeURIComponent(game.title)}`
      )}
    >
      {game.coverUrl ? (
        <View style={styles.thumb}>
          <Image
            source={{ uri: game.coverUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            // expo-image (unlike core RN Image) cancels and safely tears down
            // an in-flight load when its view unmounts, instead of firing the
            // load callback against an already-deallocated native view. That
            // was the root cause of a real production crash
            // (EXC_BAD_ACCESS in nativeImageResponseProgress) when a FlatList
            // recycled an offscreen GameCard mid-image-load — see fix log
            // item 8. This swap is what makes it safe to use
            // removeClippedSubviews on the lists that render this card again.
            recyclingKey={game.title}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.platTag, { backgroundColor: PLATFORMS[primaryPlat].color }]}>
            <Text style={styles.platTagText}>{PLATFORMS[primaryPlat].label}</Text>
          </View>
          <Pressable
            style={styles.saveMini}
            hitSlop={8}
            onPress={(e) => { e.stopPropagation(); toggleWatchlist(game.title, highlightPlatform); }}
          >
            <Text style={{ fontSize: 12, color: isSaved ? colors.orange : colors.white }}>{isSaved ? '❤️' : '🤍'}</Text>
          </Pressable>
        </View>
      ) : (
        <LinearGradient colors={theme} start={{ x: 0.15, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.thumb}>
          <View style={styles.sheen} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.platTag, { backgroundColor: PLATFORMS[primaryPlat].color }]}>
            <Text style={styles.platTagText}>{PLATFORMS[primaryPlat].label}</Text>
          </View>
          <Pressable
            style={styles.saveMini}
            hitSlop={8}
            onPress={(e) => { e.stopPropagation(); toggleWatchlist(game.title, highlightPlatform); }}
          >
            <Text style={{ fontSize: 12, color: isSaved ? colors.orange : colors.white }}>{isSaved ? '❤️' : '🤍'}</Text>
          </Pressable>
          <Text numberOfLines={3} style={styles.thumbTitle}>{game.title}</Text>
        </LinearGradient>
      )}

      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.title}>{game.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.date}>{formatDateShort(game.date)}</Text>
          <Text style={styles.sep}>·</Text>
          <View style={styles.platDots}>
            {game.platforms.map((p) => (
              <View key={p} style={[styles.dot, { backgroundColor: PLATFORMS[p].color }]} />
            ))}
          </View>
          {badgeText && (
            <View style={styles.badgeSoon}>
              <Text style={styles.badgeSoonText}>{badgeText}</Text>
            </View>
          )}
        </View>
        {reminderLabel && (
          <View style={styles.reminderRow}>
            <Text style={{ fontSize: 10.5 }}>🔔</Text>
            <Text style={styles.reminderText}>Reminder: {reminderLabel}</Text>
          </View>
        )}
        {game.steam && (
          <View style={styles.steamRow}>
            <Text style={styles.steamPrice}>
              {game.steam.discountPrice
                ? `-${game.steam.discountPct}%  $${game.steam.discountPrice.toFixed(2)}`
                : `$${game.steam.price.toFixed(2)}`}
            </Text>
            {game.steam.deck && (
              <View style={[styles.deckBadge, styles[`deck_${game.steam.deck}`]]}>
                <Text style={[styles.deckBadgeText, styles[`deckText_${game.steam.deck}`]]}>
                  DECK {game.steam.deck.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: 12,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 9, marginBottom: 8,
  },
  thumb: {
    width: 96, height: 96, borderRadius: 10, overflow: 'hidden',
    justifyContent: 'flex-end', padding: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sheen: {
    position: 'absolute', top: -20, left: -40, width: 60, height: 180,
    backgroundColor: 'rgba(255,255,255,0.06)', transform: [{ rotate: '25deg' }],
  },
  platTag: {
    position: 'absolute', top: 7, left: 7, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2.5,
    zIndex: 2,
  },
  platTagText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#0A0C10', textTransform: 'uppercase' },
  saveMini: {
    position: 'absolute', top: 7, right: 7, width: 23, height: 23, borderRadius: 12,
    backgroundColor: 'rgba(10,12,16,0.55)', alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  thumbTitle: {
    fontFamily: 'Poppins_800ExtraBold', fontSize: 10.5, color: '#FFFFFF', textTransform: 'uppercase',
    letterSpacing: 0.2, lineHeight: 12.5, zIndex: 2,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  content: { flex: 1, justifyContent: 'center', gap: 6 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 15.5, color: colors.white, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  date: { fontSize: 13, color: colors.muted, fontFamily: 'Inter_500Medium' },
  sep: { color: colors.mutedDim, fontSize: 12 },
  platDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeSoon: { backgroundColor: colors.orangeDim, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2.5 },
  badgeSoonText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.orange },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  reminderText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.orange },
  steamRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2, flexWrap: 'wrap' },
  steamPrice: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#66C0F4' },
  deckBadge: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  deckBadgeText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  deck_verified: { backgroundColor: 'rgba(164,208,7,0.16)' },
  deckText_verified: { color: '#A4D007' },
  deck_playable: { backgroundColor: 'rgba(217,180,74,0.16)' },
  deckText_playable: { color: '#D9B44A' },
  deck_unsupported: { backgroundColor: 'rgba(154,161,175,0.14)' },
  deckText_unsupported: { color: colors.mutedDim },
});
