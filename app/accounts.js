import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';
import { useWatchlist } from '../lib/WatchlistContext';

const STEAM_WISHLIST_IMPORT = ['Onimusha: Way of the Sword', 'Valheim', 'Enshrouded', 'Phantom Blade Zero'];
const STEAM_MOCK_USER = 'DanPlaysGames';
const XBOX_MOCK_GAMERTAG = 'DanPlaysGames';

function AccountRow({ icon, iconBg, name, statusLabel, statusColor, desc, children }) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '29' }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.desc}>{desc}</Text>
      </View>
      {children}
    </View>
  );
}

export default function AccountsScreen() {
  const router = useRouter();
  const { saved, toggleWatchlist } = useWatchlist();

  const [steamConnected, setSteamConnected] = useState(false);
  const [steamConnecting, setSteamConnecting] = useState(false);
  const [xboxConnected, setXboxConnected] = useState(false);
  const [xboxConnecting, setXboxConnecting] = useState(false);
  const [notifyPs, setNotifyPs] = useState(false);
  const [notifySwitch, setNotifySwitch] = useState(false);

  const connectSteam = () => {
    setSteamConnecting(true);
    setTimeout(() => {
      setSteamConnecting(false);
      setSteamConnected(true);
      STEAM_WISHLIST_IMPORT.forEach((title) => {
        if (!saved.has(title)) toggleWatchlist(title);
      });
    }, 1400);
  };

  const disconnectSteam = () => {
    setSteamConnected(false);
    STEAM_WISHLIST_IMPORT.forEach((title) => {
      if (saved.has(title)) toggleWatchlist(title);
    });
  };

  const connectXbox = () => {
    setXboxConnecting(true);
    setTimeout(() => {
      setXboxConnecting(false);
      setXboxConnected(true);
    }, 1400);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.top}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Link Your Accounts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>
          Connect a platform account and we'll pull in what you already want to build your watchlist automatically.
        </Text>

        <AccountRow
          icon="🎮"
          iconBg="rgba(102,192,244,0.16)"
          name="Steam"
          statusLabel={steamConnected ? 'CONNECTED' : 'AVAILABLE'}
          statusColor="#A4D007"
          desc={
            steamConnected
              ? `Connected as ${STEAM_MOCK_USER} · ${STEAM_WISHLIST_IMPORT.length} games imported.`
              : 'Sign in to auto-import your Steam wishlist.'
          }
        >
          {steamConnecting ? (
            <ActivityIndicator color={colors.orange} />
          ) : (
            <Pressable
              style={[styles.actionBtn, steamConnected && styles.actionBtnGhost]}
              onPress={steamConnected ? disconnectSteam : connectSteam}
            >
              <Text style={[styles.actionBtnText, steamConnected && styles.actionBtnTextGhost]}>
                {steamConnected ? 'DISCONNECT' : 'CONNECT'}
              </Text>
            </Pressable>
          )}
        </AccountRow>

        <AccountRow
          icon="🟢"
          iconBg="rgba(61,163,93,0.16)"
          name="Xbox"
          statusLabel="LIMITED"
          statusColor="#D9B44A"
          desc={
            xboxConnected
              ? `Signed in as ${XBOX_MOCK_GAMERTAG}. Wishlist sync isn't available yet — Microsoft doesn't expose it to third-party apps.`
              : "You can sign in with your Microsoft account, but wishlist import isn't available yet."
          }
        >
          {xboxConnecting ? (
            <ActivityIndicator color={colors.orange} />
          ) : (
            <Pressable
              style={[styles.actionBtn, xboxConnected && styles.actionBtnGhost]}
              onPress={xboxConnected ? () => setXboxConnected(false) : connectXbox}
            >
              <Text style={[styles.actionBtnText, xboxConnected && styles.actionBtnTextGhost]}>
                {xboxConnected ? 'DISCONNECT' : 'CONNECT'}
              </Text>
            </Pressable>
          )}
        </AccountRow>

        <AccountRow
          icon="🔵"
          iconBg="rgba(47,125,225,0.16)"
          name="PlayStation"
          statusLabel="UNAVAILABLE"
          statusColor={colors.mutedDim}
          desc="Sony doesn't offer a public sign-in or wishlist API for third-party apps — no shortcuts here."
        >
          <Pressable style={[styles.actionBtn, styles.actionBtnGhost]} onPress={() => setNotifyPs(!notifyPs)}>
            <Text style={[styles.actionBtnText, styles.actionBtnTextGhost, notifyPs && { color: colors.orange }]}>
              {notifyPs ? '✓ NOTIFIED' : 'NOTIFY ME'}
            </Text>
          </Pressable>
        </AccountRow>

        <AccountRow
          icon="🔴"
          iconBg="rgba(229,72,77,0.16)"
          name="Nintendo Switch"
          statusLabel="UNAVAILABLE"
          statusColor={colors.mutedDim}
          desc="Same story as PlayStation — Nintendo doesn't provide public account access for apps like this."
        >
          <Pressable style={[styles.actionBtn, styles.actionBtnGhost]} onPress={() => setNotifySwitch(!notifySwitch)}>
            <Text style={[styles.actionBtnText, styles.actionBtnTextGhost, notifySwitch && { color: colors.orange }]}>
              {notifySwitch ? '✓ NOTIFIED' : 'NOTIFY ME'}
            </Text>
          </Pressable>
        </AccountRow>
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
  intro: { fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 13, padding: 14, marginBottom: 10,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.white },
  statusPill: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  statusPillText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  desc: { fontSize: 11.5, color: colors.muted, marginTop: 3, lineHeight: 16 },
  actionBtn: { backgroundColor: colors.orange, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 9 },
  actionBtnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.line },
  actionBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#1A0F00', letterSpacing: 0.3 },
  actionBtnTextGhost: { color: colors.muted },
});
