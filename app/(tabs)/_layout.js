import { Tabs } from 'expo-router';
import { Text } from 'react-native';
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

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <TopBar />,
        tabBarStyle: {
          backgroundColor: colors.bgNav,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
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
