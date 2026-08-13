import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';
import { WatchlistProvider } from '../lib/WatchlistContext';
import { colors } from '../lib/theme';

export default function RootLayout() {
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
    <WatchlistProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[title]" options={{ presentation: 'card' }} />
      </Stack>
    </WatchlistProvider>
  );
}
