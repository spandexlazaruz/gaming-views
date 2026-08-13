import { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';
import { GAMES } from '../lib/games';
import { daysUntil } from '../lib/dates';
import { useWatchlist, LEAD_OPTIONS } from '../lib/WatchlistContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const { saved, reminders } = useWatchlist();
  const slideAnim = useRef(new Animated.Value(-140)).current;
  const [previewGame, setPreviewGame] = useState(null);
  const hideTimer = useRef(null);

  const upcoming = useMemo(() => {
    return [...saved]
      .map((title) => {
        const game = GAMES.find((g) => g.title === title);
        if (!game) return null;
        const leadKey = reminders[title] || 'release_day';
        const lead = LEAD_OPTIONS.find((o) => o.key === leadKey);
        const scheduled = new Date(game.date[0], game.date[1], game.date[2] - lead.days);
        return { game, lead, scheduled };
      })
      .filter(Boolean)
      .sort((a, b) => a.scheduled - b.scheduled);
  }, [saved, reminders]);

  const showPreview = () => {
    const target = upcoming[0]?.game || GAMES[0];
    setPreviewGame(target);
    Animated.spring(slideAnim, { toValue: 10, useNativeDriver: true, friction: 8 }).start();
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(slideAnim, { toValue: -140, duration: 250, useNativeDriver: true }).start();
    }, 3500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.top}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Pressable style={styles.previewBtn} onPress={showPreview}>
          <Text style={{ fontSize: 14 }}>🔔</Text>
          <Text style={styles.previewBtnText}>PREVIEW A PUSH NOTIFICATION</Text>
        </Pressable>

        {upcoming.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔕</Text>
            <Text style={styles.emptyTitle}>No reminders scheduled</Text>
            <Text style={styles.emptyDesc}>
              Add games to your watchlist and we'll schedule reminders based on your lead-time preference for each.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionHead}>SCHEDULED</Text>
            {upcoming.map(({ game, lead, scheduled }) => (
              <View key={game.title} style={styles.notifRow}>
                <View style={styles.notifBell}>
                  <Text style={{ fontSize: 15 }}>🔔</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>{game.title}</Text>
                  <Text style={styles.notifDesc}>
                    {lead.label} · {scheduled.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Animated.View style={[styles.pushPreview, { transform: [{ translateY: slideAnim }] }]} pointerEvents="none">
        {previewGame && (
          <View style={styles.pushCard}>
            <View style={styles.pushIcon} />
            <View style={{ flex: 1 }}>
              <View style={styles.pushAppRow}>
                <Text style={styles.pushApp}>GAMING VIEWS</Text>
                <Text style={styles.pushNow}>now</Text>
              </View>
              <Text style={styles.pushTitle}>🎮 {previewGame.title}</Text>
              <Text style={styles.pushBody}>
                {previewGame.title} {daysUntil(previewGame.date) <= 0 ? 'is out now' : daysUntil(previewGame.date) === 1 ? 'releases tomorrow' : `releases in ${daysUntil(previewGame.date)} days`}. Tap to view details.
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
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
  backBtnText: { color: colors.white, fontSize: 18 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.white },
  body: { padding: 16, paddingBottom: 60 },
  previewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 11, paddingVertical: 13, marginBottom: 18,
  },
  previewBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5, color: colors.white, letterSpacing: 0.3 },
  sectionHead: { fontFamily: 'Inter_600SemiBold', fontSize: 11.5, color: colors.mutedDim, letterSpacing: 1, marginBottom: 10 },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 13, marginBottom: 8,
  },
  notifBell: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: colors.orangeDim,
    alignItems: 'center', justifyContent: 'center',
  },
  notifTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.white },
  notifDesc: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 30, marginBottom: 12 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.white, marginBottom: 6 },
  emptyDesc: { fontSize: 12.5, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  pushPreview: { position: 'absolute', top: 0, left: 16, right: 16 },
  pushCard: {
    flexDirection: 'row', gap: 11,
    backgroundColor: 'rgba(28,33,41,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 13,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  pushIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.orange, flexShrink: 0 },
  pushAppRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  pushApp: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.muted, letterSpacing: 0.5 },
  pushNow: { fontSize: 10, color: colors.mutedDim },
  pushTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.white, marginBottom: 2 },
  pushBody: { fontSize: 11.5, color: colors.muted, lineHeight: 16 },
});
