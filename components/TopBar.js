import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';
import { scrollCalendarToTop } from '../lib/calendarScrollRef';

// ADDED (Phase 3E — tap logo to go home/scroll to top): `route` is passed
// through from app/(tabs)/_layout.js's header render function — the only
// signal anywhere in the app for "which tab is this header currently for"
// (route.name is 'index' for Calendar, 'watchlist' for Watchlist). Tapping
// the wordmark from Watchlist navigates to Calendar via router.push('/'),
// matching the exact existing pattern already used for this elsewhere (see
// app/(tabs)/watchlist.js's own "Browse Upcoming Releases" empty-state
// button) rather than inventing a new one. Tapping it while already on
// Calendar scrolls that screen's own list to the top instead — see
// lib/calendarScrollRef.js for why this needs a small shared module rather
// than a direct ref (TopBar and Calendar are siblings in the navigation
// tree, not parent/child).
export default function TopBar({ route }) {
  const router = useRouter();
  const isOnCalendar = route?.name === 'index';

  const handleLogoPress = () => {
    if (isOnCalendar) {
      scrollCalendarToTop();
    } else {
      router.push('/');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bgNav }}>
      <View style={styles.nav}>
        <Pressable onPress={handleLogoPress} hitSlop={8}>
          <Text style={styles.brand}>
            <Text style={{ color: colors.blue }}>GAMING</Text> <Text style={{ color: colors.orange }}>VIEWS</Text>
          </Text>
        </Pressable>
        <View style={styles.navActions}>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/search')}>
            <Text style={{ fontSize: 15 }}>🔍</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/menu')}>
            <View style={styles.hamburger}>
              <View style={styles.hamburgerBar} />
              <View style={styles.hamburgerBar} />
              <View style={styles.hamburgerBar} />
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.bgNav, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  brand: { fontFamily: 'Poppins_800ExtraBold', fontSize: 16 },
  navActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  hamburger: { gap: 3.5, alignItems: 'center' },
  hamburgerBar: { width: 15, height: 1.6, borderRadius: 1, backgroundColor: colors.white },
});
