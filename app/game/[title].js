import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, PLATFORMS, posterThemes, hashStr } from '../../lib/theme';
import { STORE_LABELS, resolveStoreUrl } from '../../lib/stores';
import { useGames } from '../../lib/GamesContext';
import { LoadingState } from '../../lib/StateViews';
import { daysUntil, formatDate, formatDateShort, MONTH_NAMES, platformDateGroups } from '../../lib/dates';
import { useWatchlist, LEAD_OPTIONS } from '../../lib/WatchlistContext';
import { ensureNotificationPermission } from '../../lib/notifications';
import GameCard from '../../components/GameCard';
import QuickNavBar from '../../components/QuickNavBar';

export default function GameDetailScreen() {
  const { title, platform } = useLocalSearchParams();
  // GameCard passes its active platform filter through as a query param when
  // navigating here (see components/GameCard.js) — undefined on paths with
  // no active filter, same as before. Defensive Array.isArray check since
  // useLocalSearchParams can hand back an array if a param key ever repeats.
  const arrivedPlatform = Array.isArray(platform) ? platform[0] : platform;
  const router = useRouter();
  const { games, loading } = useGames();
  const { saved, savedPlatforms, toggleWatchlist, reminders, setReminderLead } = useWatchlist();
  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [storeChecking, setStoreChecking] = useState(false);
  // ADDED 2026-08-20 (game detail page enrichment — description/trailer/
  // screenshots, layout locked 2026-08-20): descExpanded/descTruncatable
  // drive the description's "Show more/less" toggle — descTruncatable only
  // flips true if the real text actually overflows the collapsed clamp (see
  // the description Text's onTextLayout below), so the toggle never shows
  // for a game whose description already fits. trailerPlaying swaps the
  // trailer thumbnail for a real embedded YouTube player on tap (Dan's
  // explicit choice over an outbound link — see roadmap Phase 7 for the
  // tradeoff that was presented). All three reset when navigating between
  // different games' detail pages, below, since expo-router can reuse this
  // screen's component instance across a title param change rather than
  // remounting it.
  const [descExpanded, setDescExpanded] = useState(false);
  const [descTruncatable, setDescTruncatable] = useState(false);
  const [trailerPlaying, setTrailerPlaying] = useState(false);

  const game = games.find((g) => g.title === decodeURIComponent(title));

  useEffect(() => {
    setDescExpanded(false);
    setDescTruncatable(false);
    setTrailerPlaying(false);
  }, [title]);

  const FixedHeader = (
    <View style={styles.headerBar}>
      <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={8}>
        <Text style={styles.headerBtnText}>←</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {FixedHeader}
        <LoadingState label="Loading…" />
        <QuickNavBar />
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {FixedHeader}
        <Text style={{ color: colors.white, padding: 20 }}>Game not found.</Text>
        <QuickNavBar />
      </SafeAreaView>
    );
  }

  // Arrived via a filtered platform link (see GameCard.js) → that platform's
  // own saved state, so a game saved on Xbox doesn't read as saved while
  // looking at it from a PS5-filtered path, and vice versa. Otherwise, "saved
  // for anything" — same as before.
  const isSaved = arrivedPlatform
    ? (savedPlatforms[game.title] || []).includes(arrivedPlatform)
    : saved.has(game.title);
  const theme = posterThemes[hashStr(game.title) % posterThemes.length];
  // A per-platform date only when this game's platforms genuinely differ —
  // an arrived/filtered platform with its own confirmed date takes priority,
  // otherwise the breakdown (dateGroups) covers the unfiltered case below.
  const dateGroups = platformDateGroups(game);
  const displayDate = (arrivedPlatform && game.platformDates && game.platformDates[arrivedPlatform])
    || game.date;
  const days = daysUntil(displayDate);
  const stampText = days <= 0 ? 'OUT NOW' : days === 1 ? 'RELEASES TOMORROW' : `RELEASES IN ${days} DAYS`;

  const others = games.filter(
    (g) => g.title !== game.title && g.date[0] === game.date[0] && g.date[1] === game.date[1]
  ).slice(0, 3);

  const blurb = game.desc || `A ${game.genre.toLowerCase()} title releasing on ${formatDate(game.date)} for ${game.platforms.map((p) => PLATFORMS[p].full).join(', ')}.`;

  // Opens the exact store product page when the backend found one for this
  // game (game.storeLinks, sourced from IGDB's external_games data) AND it
  // still resolves to a real page — falls back to a plain store search
  // otherwise (see lib/stores.js's live-check logic). Single-platform games
  // skip the picker and go straight to that one store; multi-platform games
  // get a small picker so the tap always lands on the right storefront.
  // Async now (resolveStoreUrl does a real network check before returning),
  // so this guards against double-taps and drives the button's loading
  // state below.
  const openStore = async (platformKey) => {
    if (storeChecking) return;
    setStorePickerOpen(false);
    setStoreChecking(true);
    try {
      const url = await resolveStoreUrl(platformKey, game.title, game.storeLinks);
      if (url) Linking.openURL(url).catch(() => {});
    } finally {
      setStoreChecking(false);
    }
  };

  const handleViewInStorePress = () => {
    if (storeChecking) return;
    if (game.platforms.length === 1) {
      openStore(game.platforms[0]);
    } else {
      setStorePickerOpen(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {FixedHeader}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {game.coverUrl ? (
          <View style={styles.heroPoster}>
            <Image source={{ uri: game.coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.65)']}
              start={{ x: 0, y: 0.4 }} end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroStamp}>
              <Text style={styles.heroStampText}>{stampText}</Text>
            </View>
          </View>
        ) : (
          <LinearGradient colors={theme} start={{ x: 0.15, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.heroPoster}>
            <View style={styles.heroSheen} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.65)']}
              start={{ x: 0, y: 0.4 }} end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.heroPosterTitle}>{game.title}</Text>
            <View style={styles.heroStamp}>
              <Text style={styles.heroStampText}>{stampText}</Text>
            </View>
          </LinearGradient>
        )}

        <View style={styles.body}>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.dateLine}>
            {dateGroups && !arrivedPlatform
              ? dateGroups
                  .map((g) => `${g.platforms.map((p) => PLATFORMS[p].label).join('/')} ${formatDateShort(g.date)}`)
                  .join('  ·  ')
              : formatDate(displayDate)}
            {' '}· {game.genre}
          </Text>

          <View style={styles.platRow}>
            {game.platforms.map((p) => {
              const pd = game.platformDates && game.platformDates[p];
              return (
                <View key={p} style={styles.platChip}>
                  <View style={[styles.dot, { backgroundColor: PLATFORMS[p].color }]} />
                  <Text style={styles.platChipText}>{PLATFORMS[p].full}</Text>
                  {dateGroups && pd && <Text style={styles.platChipDate}> · {formatDateShort(pd)}</Text>}
                </View>
              );
            })}
          </View>

          <Pressable
            style={[styles.storeBtn, storeChecking && styles.storeBtnDisabled]}
            onPress={handleViewInStorePress}
            disabled={storeChecking}
          >
            <Text style={styles.storeBtnText}>
              {storeChecking ? 'CHECKING…' : '🔗 VIEW IN STORE'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.cta, isSaved && styles.ctaSaved]}
            onPress={() => {
              // Adding a game sets a default "Release Day" reminder immediately
              // (see WatchlistContext.toggleWatchlist) — so this is the real
              // first moment a notification actually gets turned on for most
              // people, not just the REMIND ME chips below. Request the OS
              // permission prompt right here so it has a chance to actually
              // fire. ensureNotificationPermission() only shows the real
              // system dialog once ever (iOS/Android both no-op silently on
              // repeat calls after the first grant/deny), so this is safe to
              // call on every add, not just a tracked "first time".
              const wasSaved = isSaved;
              toggleWatchlist(game.title, arrivedPlatform, game.platforms);
              if (!wasSaved) {
                ensureNotificationPermission().catch(() => {});
              }
            }}
          >
            <Text style={[styles.ctaText, isSaved && { color: colors.orange }]}>
              {isSaved ? '❤️ IN YOUR WATCHLIST' : '🤍 ADD TO WATCHLIST'}
            </Text>
          </Pressable>

          {isSaved && (
            <View style={styles.leadRow}>
              <Text style={styles.leadLabel}>REMIND ME</Text>
              <View style={styles.leadChips}>
                {LEAD_OPTIONS.map((o) => {
                  const active = (reminders[game.title] || 'release_day') === o.key;
                  return (
                    <Pressable
                      key={o.key}
                      style={[styles.leadChip, active && styles.leadChipActive]}
                      onPress={() => {
                        // Same permission request as the watchlist CTA above —
                        // explicitly changing the lead time is the other real
                        // "selecting a notification option" moment worth
                        // covering, in case someone already granted/denied
                        // before ever adding a game (e.g. from the
                        // Notifications tab's test button).
                        ensureNotificationPermission().catch(() => {});
                        setReminderLead(game.title, o.key);
                      }}
                    >
                      <Text style={[styles.leadChipText, active && styles.leadChipTextActive]}>{o.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {game.steam && (
            <View style={styles.section}>
              <Text style={styles.sectionHead}>ON STEAM</Text>
              <View style={styles.steamCard}>
                <Text style={styles.steamCardPrice}>
                  {game.steam.discountPrice
                    ? `-${game.steam.discountPct}%   $${game.steam.discountPrice.toFixed(2)}  (was $${game.steam.price.toFixed(2)})`
                    : `$${game.steam.price.toFixed(2)}`}
                </Text>
                {game.steam.deck && (
                  <View style={[styles.deckBadgeLg, styles[`deckLg_${game.steam.deck}`]]}>
                    <Text style={[styles.deckBadgeLgText, styles[`deckLgText_${game.steam.deck}`]]}>
                      DECK {game.steam.deck.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ADDED/CHANGED 2026-08-20 (game detail page enrichment, layout
              locked 2026-08-20): description → trailer → screenshots, in
              that order, per the approved HTML prototype. Description itself
              is the same section as before, now showing the backend's full
              untruncated summary (the old 220-char DESC_LIMIT is gone — see
              gaming-views-backend/api/games.js) behind a "Show more/less"
              clamp instead. */}
          <View style={styles.section}>
            <Text style={styles.sectionHead}>ABOUT THIS RELEASE</Text>
            <Text
              style={styles.blurb}
              numberOfLines={descExpanded ? undefined : 4}
              onTextLayout={(e) => {
                // Only ever flips true — once a description is confirmed to
                // overflow 4 lines while collapsed, that's true regardless of
                // anything that fires after (e.g. a stray re-layout).
                if (!descExpanded && e.nativeEvent.lines.length > 4) setDescTruncatable(true);
              }}
            >
              {blurb}
            </Text>
            {descTruncatable && (
              <Pressable onPress={() => setDescExpanded((v) => !v)} hitSlop={6}>
                <Text style={styles.showMoreText}>{descExpanded ? 'Show less' : 'Show more'}</Text>
              </Pressable>
            )}
            {!isSaved && (
              <Text style={styles.blurbCta}>Add it to your watchlist and we'll keep it front and center as the date gets closer.</Text>
            )}
          </View>

          {/* Hidden entirely when a game has no video data — common for
              smaller titles, same "don't show what you don't have" pattern
              already used for coverUrl/steam elsewhere on this screen. */}
          {game.videoId && (
            <View style={styles.section}>
              <Text style={styles.sectionHead}>TRAILER</Text>
              <View style={styles.trailerBox}>
                {trailerPlaying ? (
                  // No Pressable wrapper here on purpose — once the embed is
                  // live, touches need to reach YouTube's own player controls
                  // (play/pause, scrub, fullscreen), not get intercepted by
                  // this screen.
                  <WebView
                    style={StyleSheet.absoluteFill}
                    originWhitelist={['*']}
                    source={{ uri: `https://www.youtube.com/embed/${game.videoId}?autoplay=1&playsinline=1&rel=0` }}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                  />
                ) : (
                  <Pressable style={StyleSheet.absoluteFill} onPress={() => setTrailerPlaying(true)}>
                    {/* img.youtube.com's thumbnail endpoint needs no API key
                        and matches the same video_id IGDB gave us — standard,
                        reliable approach, not a scrape. */}
                    <Image
                      source={{ uri: `https://img.youtube.com/vi/${game.videoId}/hqdefault.jpg` }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                    <View style={styles.trailerPlayOverlay}>
                      <View style={styles.trailerPlayBtn}>
                        <Text style={styles.trailerPlayIcon}>▶</Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {game.screenshots && game.screenshots.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHead}>SCREENSHOTS</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.screenshotsRow}
              >
                {game.screenshots.map((url, i) => (
                  <Image key={url || i} source={{ uri: url }} style={styles.screenshotThumb} resizeMode="cover" />
                ))}
              </ScrollView>
            </View>
          )}

          {others.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHead}>ALSO RELEASING {MONTH_NAMES[game.date[1]].toUpperCase()}</Text>
              {others.map((g) => <GameCard key={g.title} game={g} />)}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={storePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStorePickerOpen(false)}
      >
        <Pressable style={styles.storeModalBackdrop} onPress={() => setStorePickerOpen(false)}>
          <View style={styles.storeSheet}>
            <Text style={styles.storeSheetTitle}>VIEW IN STORE</Text>
            {game.platforms.map((p) => (
              <Pressable
                key={p}
                style={styles.storeSheetRow}
                onPress={() => openStore(p)}
                disabled={storeChecking}
              >
                <View style={[styles.dot, { backgroundColor: PLATFORMS[p].color }]} />
                <Text style={styles.storeSheetRowText}>{STORE_LABELS[p]}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.storeSheetCancel} onPress={() => setStorePickerOpen(false)}>
              <Text style={styles.storeSheetCancelText}>CANCEL</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <QuickNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.bgNav, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  headerBtn: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBtnText: {
    color: colors.white, fontSize: 18, lineHeight: 20,
    textAlignVertical: 'center', includeFontPadding: false,
    marginTop: -1,
  },
  heroPoster: {
    width: '100%', aspectRatio: 4 / 3, justifyContent: 'flex-end', padding: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  heroSheen: {
    position: 'absolute', top: -60, left: -80, width: 160, height: 400,
    backgroundColor: 'rgba(255,255,255,0.05)', transform: [{ rotate: '25deg' }],
  },
  heroPosterTitle: {
    fontFamily: 'Poppins_800ExtraBold', fontSize: 17, color: '#FFFFFF', textTransform: 'uppercase',
    letterSpacing: 0.3, zIndex: 2,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5,
  },
  heroStamp: {
    position: 'absolute', top: 16, right: 16, zIndex: 2,
    backgroundColor: colors.orangeDim, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5,
  },
  heroStampText: { color: colors.orange, fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'uppercase' },
  body: { padding: 20 },
  title: { fontFamily: 'Poppins_800ExtraBold', fontSize: 23, color: colors.white, marginBottom: 10 },
  dateLine: { color: colors.muted, fontSize: 14, marginBottom: 14, fontFamily: 'Inter_500Medium' },
  platRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  platChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 8, paddingHorizontal: 11, paddingVertical: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  platChipText: { fontSize: 11.5, fontFamily: 'Inter_600SemiBold', color: colors.white },
  platChipDate: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.mutedDim },
  storeBtn: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 11, padding: 13, alignItems: 'center', marginBottom: 12,
  },
  storeBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5, color: colors.white, letterSpacing: 0.3 },
  storeBtnDisabled: { opacity: 0.5 },
  storeModalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end',
  },
  storeSheet: {
    backgroundColor: colors.bgNav, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 18, paddingBottom: 28, borderTopWidth: 1, borderColor: colors.line,
  },
  storeSheetTitle: {
    fontSize: 11.5, fontFamily: 'Inter_600SemiBold', color: colors.mutedDim,
    letterSpacing: 1, marginBottom: 14,
  },
  storeSheetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 11, padding: 14, marginBottom: 8,
  },
  storeSheetRowText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.white },
  storeSheetCancel: { alignItems: 'center', padding: 12, marginTop: 4 },
  storeSheetCancelText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.muted },
  cta: { backgroundColor: colors.orange, borderRadius: 11, padding: 15, alignItems: 'center', marginBottom: 20 },
  ctaSaved: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.orange },
  ctaText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#1A0F00' },
  leadRow: { marginTop: -12, marginBottom: 20 },
  leadLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.mutedDim, letterSpacing: 1, marginBottom: 8 },
  leadChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  leadChip: {
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
  },
  leadChipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  leadChipText: { fontSize: 11.5, fontFamily: 'Inter_600SemiBold', color: colors.muted },
  leadChipTextActive: { color: '#1A0F00' },
  section: { marginBottom: 22 },
  sectionHead: { fontSize: 11.5, fontFamily: 'Inter_600SemiBold', color: colors.mutedDim, letterSpacing: 1, marginBottom: 10 },
  blurb: { fontSize: 13.5, color: colors.muted, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  showMoreText: { fontSize: 12.5, color: colors.orange, fontFamily: 'Inter_600SemiBold', marginTop: 6 },
  blurbCta: { fontSize: 12, color: colors.mutedDim, lineHeight: 18, fontFamily: 'Inter_500Medium', fontStyle: 'italic', marginTop: 8 },
  trailerBox: {
    width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden',
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
  },
  trailerPlayOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  trailerPlayBtn: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(10,12,16,0.75)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  trailerPlayIcon: { color: colors.white, fontSize: 20, marginLeft: 3 },
  screenshotsRow: { gap: 10, paddingRight: 4 },
  screenshotThumb: {
    width: 220, height: 124, borderRadius: 10, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.line,
  },
  steamCard: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
  },
  steamCardPrice: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#66C0F4' },
  deckBadgeLg: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  deckBadgeLgText: { fontSize: 10.5, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  deckLg_verified: { backgroundColor: 'rgba(164,208,7,0.16)' },
  deckLgText_verified: { color: '#A4D007' },
  deckLg_playable: { backgroundColor: 'rgba(217,180,74,0.16)' },
  deckLgText_playable: { color: '#D9B44A' },
  deckLg_unsupported: { backgroundColor: 'rgba(154,161,175,0.14)' },
  deckLgText_unsupported: { color: colors.mutedDim },
});
