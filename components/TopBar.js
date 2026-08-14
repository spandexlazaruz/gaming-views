import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';

export default function TopBar() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bgNav }}>
      <View style={styles.nav}>
        <Text style={styles.brand}>
          <Text style={{ color: colors.blue }}>GAMING</Text> <Text style={{ color: colors.orange }}>VIEWS</Text>
        </Text>
        <View style={styles.navActions}>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/search')}>
            <Text style={{ fontSize: 15 }}>🔍</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/menu')}>
            <View style={styles.hamburger}>
              <View style={styles.hamburgerBar} />
              <View style={styles.hamburgerBar} />
              <View style={styles.hamburgerBar} />
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.bgNav, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  brand: { fontFamily: 'Poppins_800ExtraBold', fontSize: 16 },
  navActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  hamburger: { gap: 3.5, alignItems: 'center' },
  hamburgerBar: { width: 15, height: 1.6, borderRadius: 1, backgroundColor: colors.white },
});
