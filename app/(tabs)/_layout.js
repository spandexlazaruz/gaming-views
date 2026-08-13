import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useWatchlist } from '../../lib/WatchlistContext';
import { colors } from '../../lib/theme';

function TabIcon({ symbol, focused }) {
  return (
    <Text style={{ fontSize: 20, color: focused ? colors.orange : colors.mutedDim }}>{symbol}</Text>
  );
}

export default function TabsLayout() {
  const { saved } = useWatchlist();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
          tabBarBadge: saved.size > 0 ? saved.size : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.orange, color: '#1A0F00', fontSize: 9.5, fontFamily: 'Inter_600SemiBold' },
        }}
      />
    </Tabs>
  );
}
