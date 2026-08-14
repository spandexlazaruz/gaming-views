import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
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

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {results === null && (
          <Text style={styles.hint}>Search across all {games.length} upcoming releases by title or genre.</Text>
        )}
        {results !== null && results.length === 0 && (
          <Text style={styles.hint}>No matches for "{query}".</Text>
        )}
        {results !== null && results.map((g) => <GameCard key={g.title} game={g} />)}
      </ScrollView>
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
