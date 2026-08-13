import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, PLATFORMS, posterThemes, hashStr } from '../../lib/theme';
import { GAMES } from '../../lib/games';
import { daysUntil, formatDate, MONTH_NAMES } from '../../lib/dates';
import { useWatchlist, LEAD_OPTIONS } from '../../lib/WatchlistContext';
import GameCard from '../../components/GameCard';

export default function GameDetailScreen() {
  const { title } = useLocalSearchParams();
  const router = useRouter();
  const { saved, toggleWatchlist, reminders, setReminderLead } = useWatchlist();

  const game = GAMES.find((g) => g.title === decodeURIComponent(title));
  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: colors.white, padding: 20 }}>Game not found.</Text>
      </SafeAreaView>
    );
  }

  const isSaved = saved.has(game.title);
  const theme = posterThemes[hashStr(game.title) % posterThemes.length];
  const days = daysUntil(game.date);
  const stampText = days <= 0 ? 'OUT NOW' : days === 1 ? 'RELEASES TOMORROW' : `RELEASES IN ${days} DAYS`;

  const others = GAMES.filter(
    (g) => g.title !== game.title && g.date[0] === game.date[0] && g.date[1] === game.date[1]
  ).slice(0, 3);

  const blurb = game.desc || `A ${game.genre.toLowerCase()} title releasing on ${formatDate(game.date)} for ${game.platforms.map((p) => PLATFORMS[p].full).join(', ')}.`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>

        <LinearGradient colors={theme} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroPoster}>
          <Text style={styles.heroPosterTitle}>{game.title}</Text>
          <View style={styles.heroStamp}>
            <Text style={styles.heroStampText}>{stampText}</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.dateLine}>{formatDate(game.date)} · {game.genre}</Text>

          <View style={styles.platRow}>
            {game.platforms.map((p) => (
              <View key={p} style={styles.platChip}>
                <View style={[styles.dot, { backgroundColor: PLATFORMS[p].color }]} />
                <Text style={styles.platChipText}>{PLATFORMS[p].full}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={[styles.cta, isSaved && styles.ctaSaved]}
            onPress={() => toggleWatchlist(game.title)}
          >
            <Text style={[styles.ctaText, isSaved && { color: colors.orange }]}>
              {isSaved ? '❤️ IN YOUR WATCHLIST' : '🤍 ADD TO WATCHLIST'}
            </Text>
          </Pressable>

          {isSaved && (
            <View style={styles.leadRow}>
              <Text style={styles.leadLabel}>REMIND ME</Text>
              <View style={styles.leadChips}>
                {LEAD_OPTIONS.map((o) => {
                  const active = (reminders[game.title] || 'release_day') === o.key;
                  return (
                    <Pressable
                      key={o.key}
                      style={[styles.leadChip, active && styles.leadChipActive]}
                      onPress={() => setReminderLead(game.title, o.key)}
                    >
                      <Text style={[styles.leadChipText, active && styles.leadChipTextActive]}>{o.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionHead}>ABOUT THIS RELEASE</Text>
            <Text style={styles.blurb}>{blurb} Add it to your watchlist and we'll keep it front and center as the date gets closer.</Text>
          </View>

          {others.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHead}>ALSO RELEASING {MONTH_NAMES[game.date[1]].toUpperCase()}</Text>
              {others.map((g) => <GameCard key={g.title} game={g} />)}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  backBtn: {
    position: 'absolute', top: 14, left: 16, zIndex: 2,
    width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(10,12,16,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: colors.white, fontSize: 18 },
  heroPoster: { width: '100%', aspectRatio: 4 / 3, justifyContent: 'flex-end', padding: 20 },
  heroPosterTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 15, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' },
  heroStamp: {
    position: 'absolute', top: 60, right: 16,
    backgroundColor: colors.orangeDim, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5,
  },
  heroStampText: { color: colors.orange, fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'uppercase' },
  body: { padding: 20 },
  title: { fontFamily: 'Poppins_800ExtraBold', fontSize: 23, color: colors.white, marginBottom: 10 },
  dateLine: { color: colors.muted, fontSize: 14, marginBottom: 14, fontFamily: 'Inter_500Medium' },
  platRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  platChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 8, paddingHorizontal: 11, paddingVertical: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  platChipText: { fontSize: 11.5, fontFamily: 'Inter_600SemiBold', color: colors.white },
  cta: { backgroundColor: colors.orange, borderRadius: 11, padding: 15, alignItems: 'center', marginBottom: 20 },
  ctaSaved: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.orange },
  ctaText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#1A0F00' },
  leadRow: { marginTop: -12, marginBottom: 20 },
  leadLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.mutedDim, letterSpacing: 1, marginBottom: 8 },
  leadChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  leadChip: {
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
  },
  leadChipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  leadChipText: { fontSize: 11.5, fontFamily: 'Inter_600SemiBold', color: colors.muted },
  leadChipTextActive: { color: '#1A0F00' },
  section: { marginBottom: 22 },
  sectionHead: { fontSize: 11.5, fontFamily: 'Inter_600SemiBold', color: colors.mutedDim, letterSpacing: 1, marginBottom: 10 },
  blurb: { fontSize: 13.5, color: colors.muted, lineHeight: 21, fontFamily: 'Inter_400Regular' },
});
