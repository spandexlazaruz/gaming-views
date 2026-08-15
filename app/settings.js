import { useState } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';

function SwitchRow({ title, desc, value, onValueChange }) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.14)', true: colors.orange }}
        thumbColor={colors.white}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [priceDrops, setPriceDrops] = useState(true);

  const sendFeedback = () => {
    const subject = encodeURIComponent('Gaming Views Feedback');
    const body = encodeURIComponent('\n\n—\nSent from the Gaming Views app (v0.1 · SDK 54)');
    Linking.openURL(`mailto:gamingviewspodcast@gmail.com?subject=${subject}&body=${body}`).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.top}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionHead}>NOTIFICATIONS</Text>
        <Text style={styles.sectionNote}>
          Release-day reminders are set per game — open any watchlisted title to set one. These control everything else.
        </Text>
        <SwitchRow
          title="Weekly Digest"
          desc="A Monday summary of what's releasing this week."
          value={weeklyDigest}
          onValueChange={setWeeklyDigest}
        />
        <SwitchRow
          title="Steam Price Drops"
          desc="Alerts when a watchlisted game goes on sale."
          value={priceDrops}
          onValueChange={setPriceDrops}
        />

        <Text style={[styles.sectionHead, { marginTop: 26 }]}>ABOUT</Text>
        <View style={styles.aboutBlock}>
          <Text style={styles.appName}>Gaming Views</Text>
          <Text style={styles.appVer}>v0.1 · SDK 54</Text>
        </View>
        <View style={styles.aboutLinks}>
          <Pressable style={styles.aboutLink} onPress={() => Linking.openURL('https://spandexlazaruz.github.io/gaming-views/privacy-policy.html')}>
            <Text style={styles.aboutLinkText}>Privacy Policy</Text>
            <Text style={styles.chev}>›</Text>
          </Pressable>
          <Pressable style={styles.aboutLink} onPress={() => Linking.openURL('https://spandexlazaruz.github.io/gaming-views/terms-of-service.html')}>
            <Text style={styles.aboutLinkText}>Terms of Service</Text>
            <Text style={styles.chev}>›</Text>
          </Pressable>
          <Pressable style={styles.aboutLink} onPress={sendFeedback}>
            <Text style={styles.aboutLinkText}>Send Feedback</Text>
            <Text style={styles.chev}>›</Text>
          </Pressable>
          <Pressable style={[styles.aboutLink, { borderBottomWidth: 0 }]} onPress={() => router.push('/onboarding')}>
            <Text style={styles.aboutLinkText}>Preview Onboarding</Text>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  top: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.bgNav, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: colors.white, fontSize: 18 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.white },
  body: { padding: 16, paddingBottom: 60 },
  sectionHead: { fontFamily: 'Inter_600SemiBold', fontSize: 11.5, color: colors.mutedDim, letterSpacing: 1, marginBottom: 10 },
  sectionNote: { fontSize: 12.5, color: colors.muted, lineHeight: 18, marginBottom: 12 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  switchTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5, color: colors.white },
  switchDesc: { fontSize: 11.5, color: colors.muted, marginTop: 2, lineHeight: 16 },
  aboutBlock: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 16, marginBottom: 8,
  },
  appName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.white },
  appVer: { fontSize: 11.5, color: colors.mutedDim, marginTop: 3 },
  aboutLinks: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line, borderRadius: 12 },
  aboutLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  aboutLinkText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.white },
  chev: { color: colors.mutedDim, fontSize: 18 },
});
