import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // `app/onboarding.js` has always written a `hasOnboarded` flag when someone
  // finishes the flow, but nothing ever read it or redirected a first-time
  // user into onboarding in the first place — so it structurally never ran
  // for anyone, real first-time install or existing tester alike (fix log
  // item 6). This is the missing other half: check the flag once fonts are
  // ready (so navigation is actually possible) and redirect if it's unset.
  // Deliberately simple, no migration — every device without the flag set,
  // including every existing tester's, will see onboarding once on its next
  // launch. That's an intentional choice, not an oversight: it also
  // surfaces real onboarding UX feedback from active testers before public
  // launch, not just genuinely new installs.
  useEffect(() => {
    if (!fontsLoaded) return;
    (async () => {
      try {
        const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
        if (!hasOnboarded) {
          router.replace('/onboarding');
        }
      } catch {
        // Unreadable storage shouldn't block launch — fail open and just
        // skip the redirect rather than crash or hang here.
      }
    })();
  }, [fontsLoaded]);

  // ADDED 2026-08-20: GestureHandlerRootView now wraps the whole app —
  // required by react-native-gesture-handler (added for the Watchlist tab's
  // swipe-to-remove) so its gestures actually register correctly rather
  // than intermittently failing. Wraps both the loading state and the real
  // app below rather than being nested only under one branch, so it's in
  // place before any screen that might use gestures ever mounts.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!fontsLoaded ? (
        <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.orange} />
        </View>
      ) : (
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
      )}
    </GestureHandlerRootView>
  );
});
