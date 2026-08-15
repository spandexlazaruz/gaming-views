import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';

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

function NotifyBtn({ active, onPress }) {
  return (
    <Pressable style={[styles.actionBtn, styles.actionBtnGhost]} onPress={onPress}>
      <Text style={[styles.actionBtnText, styles.actionBtnTextGhost, active && { color: colors.orange }]}>
        {active ? '✓ NOTIFIED' : 'NOTIFY ME'}
      </Text>
    </Pressable>
  );
}

export default function AccountsScreen() {
  const router = useRouter();
  const [notifySteam, setNotifySteam] = useState(false);
  const [notifyXbox, setNotifyXbox] = useState(false);

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
          statusLabel="COMING SOON"
          statusColor={colors.orange}
          desc="Real sign-in and wishlist import are in progress — not ready yet, but on the way."
        >
          <NotifyBtn active={notifySteam} onPress={() => setNotifySteam(!notifySteam)} />
        </AccountRow>

        <AccountRow
          icon="🟢"
          iconBg="rgba(61,163,93,0.16)"
          name="Xbox"
          statusLabel="COMING SOON"
          statusColor={colors.orange}
          desc="Sign-in is planned, though Microsoft doesn't expose wishlist data to third-party apps — that part may not be possible even once sign-in works."
        >
          <NotifyBtn active={notifyXbox} onPress={() => setNotifyXbox(!notifyXbox)} />
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
