import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from './theme';

export function LoadingState({ label = 'Loading releases…' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.orange} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Couldn't load releases</Text>
      <Text style={styles.desc}>{message}</Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryText}>TRY AGAIN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 10 },
  label: { color: colors.muted, fontSize: 13, fontFamily: 'Inter_500Medium' },
  icon: { fontSize: 28, marginBottom: 4 },
  title: { color: colors.white, fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 2 },
  desc: { color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 12 },
  retryBtn: { backgroundColor: colors.orange, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11 },
  retryText: { color: '#1A0F00', fontFamily: 'Inter_600SemiBold', fontSize: 12.5, letterSpacing: 0.3 },
});
