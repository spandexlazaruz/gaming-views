import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWatchlist } from '../lib/WatchlistContext';
import { colors } from '../lib/theme';

export default function QuickNavBar() {
  const router = useRouter();
  const { saved } = useWatchlist();

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.bgNav }}>
      <View style={styles.bar}>
        <Pressable style={styles.tab} onPress={() => router.dismissTo('/(tabs)')}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.label}>Calendar</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={() => router.dismissTo('/(tabs)/watchlist')}>
          <View>
            <Text style={styles.icon}>❤️</Text>
            {saved.size > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{saved.size}</Text>
              </View>
            )}
          </View>
          <Text style={styles.label}>Watchlist</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgNav,
    borderTopColor: colors.line, borderTopWidth: 1,
    height: 64, paddingTop: 8, paddingBottom: 10,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 20, textAlign: 'center' },
  label: { fontSize: 10.5, fontFamily: 'Inter_600SemiBold', color: colors.mutedDim },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: colors.orange, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9.5, fontFamily: 'Inter_600SemiBold', color: '#1A0F00' },
});
