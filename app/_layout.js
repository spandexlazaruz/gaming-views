import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';
import { WatchlistProvider } from '../lib/WatchlistContext';
import { GamesProvider } from '../lib/GamesContext';
import { colors } from '../lib/theme';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://9d423463abf5423c4015c039ac00dce8@o4511915073601536.ingest.de.sentry.io/4511915081990224',

  // Deliberately lean: error monitoring only. Session Replay, default PII
  // collection, and Logs are all wizard defaults we're turning off — they
  // don't match what the published Privacy Policy actually promises
  // ("no unnecessary tracking"), and they're scope this app doesn't need.
  sendDefaultPii: false,
  enableLogs: false,
});

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  return (
    <GamesProvider>
      <WatchlistProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgPage } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="game/[title]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="search" options={{ presentation: 'modal' }} />
          <Stack.Screen name="menu" options={{ presentation: 'modal' }} />
          <Stack.Screen name="accounts" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
        </Stack>
      </WatchlistProvider>
    </GamesProvider>
  );
});