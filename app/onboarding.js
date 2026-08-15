import { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, PLATFORMS, GENRES } from '../lib/theme';
import { useWatchlist } from '../lib/WatchlistContext';

const STEPS = ['welcome', 'platforms', 'genres', 'notifications', 'done'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setPreferredPlatform, setPreferredGenre } = useWatchlist();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [selectedGenres, setSelectedGenres] = useState(new Set());

  const togglePlatform = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleGenre = (key) => {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const finish = () => {
    if (selected.size === 1) {
      setPreferredPlatform([...selected][0]);
    }
    if (selectedGenres.size === 1) {
      setPreferredGenre([...selectedGenres][0]);
    }
    // Fire-and-forget — never let a storage hiccup block navigation.
    AsyncStorage.setItem('hasOnboarded', 'true').catch(() => {});
    router.replace('/(tabs)');
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  const stepName = STEPS[step];
  const nextLabel = {
    welcome: 'Get Started',
    platforms: 'Continue',
    genres: 'Continue',
    notifications: 'Enable & Continue',
    done: 'Start Browsing',
  }[stepName];

  return (
    <SafeAreaView style={styles.container}>
      {stepName !== 'done' && (
        <Pressable style={styles.skip} onPress={finish}>
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
      )}

      <View style={styles.body}>
        {stepName === 'welcome' && (
          <>
            <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.eyebrow}>WELCOME TO</Text>
            <Text style={styles.title}>Gaming Views</Text>
            <Text style={styles.sub}>
              Every upcoming release across PlayStation, Xbox, Switch, and PC — tracked in one clean list. No clutter, no noise.
            </Text>
          </>
        )}

        {stepName === 'platforms' && (
          <>
            <Text style={styles.title}>What do you play on?</Text>
            <Text style={styles.sub}>We'll tailor your feed to start. You can always change this later in Settings.</Text>
            <View style={styles.platGrid}>
              {Object.entries(PLATFORMS).map(([key, p]) => {
                const isSel = selected.has(key);
                return (
                  <Pressable
                    key={key}
                    style={[styles.platCard, isSel && { borderColor: p.color, backgroundColor: 'rgba(255,255,255,0.04)' }]}
                    onPress={() => togglePlatform(key)}
                  >
                    <View style={[styles.platIcon, { backgroundColor: p.color }]}>
                      <Text style={styles.platIconText}>{p.label.slice(0, 2)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.platName}>{p.full}</Text>
                      {isSel && <Text style={{ color: colors.orange, fontSize: 13 }}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {stepName === 'genres' && (
          <>
            <Text style={styles.title}>What do you like to play?</Text>
            <Text style={styles.sub}>Optional — pick a genre to lead with, or skip and see everything.</Text>
            <View style={styles.genreWrap}>
              {GENRES.map((g) => {
                const isSel = selectedGenres.has(g);
                return (
                  <Pressable
                    key={g}
                    style={[styles.genreChip, isSel && styles.genreChipActive]}
                    onPress={() => toggleGenre(g)}
                  >
                    <Text style={[styles.genreChipText, isSel && styles.genreChipTextActive]}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {stepName === 'notifications' && (
          <>
            <View style={styles.bell}>
              <Text style={{ fontSize: 26 }}>🔔</Text>
            </View>
            <Text style={styles.title}>Never miss a launch</Text>
            <Text style={styles.sub}>
              "Gaming Views" Would Like to Send You Notifications. We'll remind you when watchlisted games are about to release. You can fine-tune exactly what you hear about anytime in Settings.
            </Text>
          </>
        )}

        {stepName === 'done' && (
          <>
            <View style={styles.check}>
              <Text style={{ fontSize: 26 }}>✓</Text>
            </View>
            <Text style={styles.title}>You're all set</Text>
            <Text style={styles.sub}>
              {(() => {
                const platBit = selected.size === 1 ? PLATFORMS[[...selected][0]].full : null;
                const genreBit = selectedGenres.size === 1 ? [...selectedGenres][0] : null;
                if (platBit && genreBit) return `Showing ${genreBit} releases on ${platBit} first. You can change this anytime.`;
                if (platBit) return `Showing ${platBit} releases first. You can change this anytime.`;
                if (genreBit) return `Showing ${genreBit} releases first. You can change this anytime.`;
                return "You're seeing every upcoming release. You can filter anytime.";
              })()}
            </Text>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <Pressable style={styles.nextBtn} onPress={next}>
          <Text style={styles.nextBtnText}>{nextLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  skip: { alignSelf: 'flex-end', margin: 16 },
  skipText: { color: colors.muted, fontFamily: 'Inter_600SemiBold', fontSize: 12.5 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 26 },
  logo: { width: 72, height: 72, marginBottom: 20 },
  eyebrow: { color: colors.orange, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1.5, marginBottom: 8 },
  title: { fontFamily: 'Poppins_800ExtraBold', fontSize: 24, color: colors.white, textAlign: 'center', marginBottom: 12 },
  sub: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, maxWidth: 320 },
  bell: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.orangeDim,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  check: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(164,208,7,0.16)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  platGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24, width: '100%' },
  platCard: {
    width: '47%', backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.line,
    borderRadius: 13, padding: 16, gap: 8,
  },
  platIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  platIconText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#0A0C10' },
  platName: { fontSize: 13.5, fontFamily: 'Inter_600SemiBold', color: colors.white },
  genreWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 24, justifyContent: 'center' },
  genreChip: {
    paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999,
    backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.line,
  },
  genreChipActive: { backgroundColor: colors.orangeDim, borderColor: colors.orange },
  genreChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.muted },
  genreChipTextActive: { color: colors.orange },
  footer: { padding: 24, paddingBottom: 30 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 18 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { width: 20, backgroundColor: colors.orange },
  nextBtn: { backgroundColor: colors.orange, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 14.5, color: '#1A0F00' },
});
