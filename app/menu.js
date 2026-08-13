import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';

function MenuRow({ icon, iconBg, title, desc, onPress }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 15 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

export default function MenuScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.top}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Menu</Text>
      </View>

      <View style={styles.list}>
        <MenuRow
          icon="⚙️"
          iconBg={colors.orangeDim}
          title="SETTINGS"
          desc="Notifications, display, and about."
          onPress={() => router.push('/settings')}
        />
        <MenuRow
          icon="🔔"
          iconBg="rgba(229,72,77,0.16)"
          title="NOTIFICATIONS"
          desc="Scheduled reminders for your watchlist."
          onPress={() => router.push('/notifications')}
        />
      </View>

      <Text style={styles.note}>More here soon — account linking (Steam, Xbox) is still being built.</Text>
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
  list: { padding: 16, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 13, padding: 14,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5, color: colors.white, letterSpacing: 0.3 },
  rowDesc: { fontSize: 12, color: colors.muted, marginTop: 2 },
  chev: { color: colors.mutedDim, fontSize: 20 },
  note: { textAlign: 'center', fontSize: 12, color: colors.mutedDim, paddingHorizontal: 30, marginTop: 10, lineHeight: 18 },
});
