import { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';
import { useGames } from '../lib/GamesContext';
import { useWatchlist, LEAD_OPTIONS } from '../lib/WatchlistContext';
import { getNotificationPermissionStatus, ensureNotificationPermission, sendTestNotification } from '../lib/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { saved, reminders } = useWatchlist();
  const { games } = useGames();
  const [permissionGranted, setPermissionGranted] = useState(null); // null = still checking
  const [testState, setTestState] = useState('idle'); // idle | sending | sent | denied

  useEffect(() => {
    getNotificationPermissionStatus().then(setPermissionGranted).catch(() => setPermissionGranted(false));
  }, []);

  const upcoming = useMemo(() => {
    return [...saved]
      .map((title) => {
        const game = games.find((g) => g.title === title);
        if (!game) return null;
        const leadKey = reminders[title] || 'release_day';
        const lead = LEAD_OPTIONS.find((o) => o.key === leadKey);
        const scheduled = new Date(game.date[0], game.date[1], game.date[2] - lead.days);
        return { game, lead, scheduled };
      })
      .filter(Boolean)
      .sort((a, b) => a.scheduled - b.scheduled);
  }, [saved, reminders, games]);

  const handlePreview = async () => {
    const target = upcoming[0]?.game || games[0];
    if (!target) return;
    setTestState('sending');
    const granted = await ensureNotificationPermission();
    setPermissionGranted(granted);
    if (!granted) {
      setTestState('denied');
      return;
    }
    const sent = await sendTestNotification(target);
    setTestState(sent ? 'sent' : 'denied');
    setTimeout(() => setTestState('idle'), 4000);
  };

  const previewLabel = {
    idle: 'SEND A TEST NOTIFICATION',
    sending: 'SENDING…',
    sent: 'SENT — CHECK YOUR NOTIFICATIONS',
    denied: 'NOTIFICATIONS ARE OFF — TAP TO ENABLE',
  }[testState];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.top}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {permissionGranted === false && (
          <Pressable style={styles.permissionBanner} onPress={() => Linking.openSettings()}>
            <Text style={styles.permissionBannerText}>
              Notifications are turned off for Gaming Views. Reminders below won't actually fire until you enable them in your device Settings.
            </Text>
          </Pressable>
        )}

        <Pressable style={styles.previewBtn} onPress={handlePreview} disabled={testState === 'sending'}>
          <Text style={{ fontSize: 14 }}>🔔</Text>
          <Text style={styles.previewBtnText}>{previewLabel}</Text>
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
  permissionBanner: {
    backgroundColor: colors.orangeDim, borderWidth: 1, borderColor: colors.orange,
    borderRadius: 11, padding: 13, marginBottom: 14,
  },
  permissionBannerText: { fontSize: 12, color: colors.white, lineHeight: 17 },
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
});
