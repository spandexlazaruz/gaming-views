import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWatchlist } from '../../lib/WatchlistContext';
import { useGames } from '../../lib/GamesContext';
import { resolvedWatchlistCount } from '../../lib/watchlistUtils';
import { colors } from '../../lib/theme';
import TopBar from '../../components/TopBar';

function TabIcon({ symbol, focused }) {
  return (
    <Text style={{ fontSize: 20, color: focused ? colors.orange : colors.mutedDim }}>{symbol}</Text>
  );
}

export default function TabsLayout() {
  const { saved } = useWatchlist();
  const { games } = useGames();
  // Badge reflects what's actually visible on the Watchlist screen, not the
  // raw persisted count — see lib/watchlistUtils.js for why those can differ.
  const watchlistCount = resolvedWatchlistCount(saved, games);

  // The fixed height/padding below used to bypass React Navigation's normal
  // automatic safe-area handling entirely, so on devices with a persistent
  // system nav bar (e.g. Android's 3-button nav, or an iPhone's home
  // indicator area) the bar drew UNDER those system controls instead of
  // above them — reported on a Nothing 2a (fix log item 1), and
  // independently corroborated by Play Console's own "edge-to-edge may not
  // display for all users" quality check (fix log item 10a). Pulling the
  // real per-device bottom inset and adding it in fixes both: it's 0 on
  // devices with only a slim gesture bar (nothing extra needed) and a real
  // value on devices that need the extra space.
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + insets.bottom;
  const tabBarPaddingBottom = 10 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <TopBar />,
        tabBarStyle: {
          backgroundColor: colors.bgNav,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: tabBarPaddingBottom,
        },
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.mutedDim,
        tabBarLabelStyle: { fontSize: 10.5, fontFamily: 'Inter_600SemiBold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ focused }) => <TabIcon symbol="❤️" focused={focused} />,
          tabBarBadge: watchlistCount > 0 ? watchlistCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.orange, color: '#1A0F00', fontSize: 9.5, fontFamily: 'Inter_600SemiBold' },
        }}
      />
    </Tabs>
  );
}
