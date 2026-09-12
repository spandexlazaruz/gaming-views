import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';
import { scrollToTop } from '../lib/topBarScrollRefs';

// ADDED (Phase 3E — tap logo scrolls the current screen to its own top):
// `route` is passed through from app/(tabs)/_layout.js's header render
// function — the only signal anywhere in the app for "which tab is this
// header currently for" (route.name is 'index' for Calendar, 'watchlist'
// for Watchlist — TopBar is only ever rendered for these two).
//
// UPDATED (real on-device follow-up): this used to navigate to Calendar
// via router.push('/') when tapped from Watchlist, and only scroll-to-top
// on Calendar itself — a leftover from when the spec assumed the logo
// would eventually appear on other, non-list screens too (Search,
// Settings, the detail page). It doesn't (confirmed when this was first
// built — TopBar is only ever wired up for Calendar/Watchlist), so with
// both of the screens that actually have this logo being list screens,
// Dan's correction was to make it always scroll-to-top, never navigate
// away — removed the navigate branch outright rather than leave it as
// unreachable dead code. If the logo's ever extended to a non-list screen
// later, navigating from there back to Calendar would need reintroducing
// then, not kept around unused now.
export default function TopBar({ route }) {
  const router = useRouter();

  const handleLogoPress = () => {
    scrollToTop(route?.name);
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
