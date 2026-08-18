import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';
import { useGames } from '../lib/GamesContext';
import GameCard from '../components/GameCard';

export default function SearchScreen() {
  const router = useRouter();
  const { games } = useGames();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 260);
    return () => clearTimeout(t);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return games.filter(
      (g) => g.title.toLowerCase().includes(q) || g.genre.toLowerCase().includes(q)
    );
  }, [query, games]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.top}>
        <View style={styles.inputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search games or genres…"
            placeholderTextColor={colors.mutedDim}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>CANCEL</Text>
        </Pressable>
      </View>

      {results === null || results.length === 0 ? (
        <View style={styles.body}>
          <Text style={styles.hint}>
            {results === null
              ? `Search across all ${games.length} upcoming releases by title or genre.`
              : `No matches for "${query}".`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => <GameCard game={item} multiPlatformBadges />}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          // removeClippedSubviews re-enabled 2026-08-17 now that GameCard
          // uses expo-image instead of core RN Image (see GameCard.js) —
          // expo-image safely cancels in-flight loads on unmount instead of
          // firing a callback against a deallocated view, which is what
          // caused a real production crash here (fix log item 8). This list
          // swaps its full contents on every keystroke, so it's the highest
          // scroll/recycle churn in the app and was the first place that
          // crash surfaced — worth extra scrutiny here specifically if
          // anything crash-shaped turns up again.
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  top: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.bgNav, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
  },
  searchIcon: { fontSize: 13, opacity: 0.6 },
  input: { flex: 1, color: colors.white, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0 },
  cancel: { color: colors.orange, fontWeight: '700', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  body: { padding: 16, paddingBottom: 60 },
  hint: { textAlign: 'center', color: colors.mutedDim, fontSize: 13, padding: 40 },
});
