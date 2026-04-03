import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppCard } from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

export default function MobileHomeTabScreen() {
  const { theme } = useAppearance();
  const { session } = useAuth();

  return (
    <AppScreen>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Welcome, {session.user?.fullname ?? session.user?.email ?? 'User'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Modern mobile workspace for operations and real-time communication.
      </Text>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Communication</Text>
        <Text style={{ color: theme.colors.textMuted }}>
          Join DMs, text channels, and always-available voice channels directly from mobile.
        </Text>
        <Link
          href={'/communication' as never}
          style={[styles.link, { color: theme.colors.primary }]}
        >
          Open Communication
        </Link>
      </AppCard>

      <View style={styles.grid}>
        <AppCard>
          <Text style={[styles.tileTitle, { color: theme.colors.text }]}>Queue</Text>
          <Link href="/(app)/queue" style={[styles.link, { color: theme.colors.primary }]}>
            Open Queue Operations
          </Link>
        </AppCard>
        <AppCard>
          <Text style={[styles.tileTitle, { color: theme.colors.text }]}>Rider</Text>
          <Link href="/(app)/rider" style={[styles.link, { color: theme.colors.primary }]}>
            Open Rider Operations
          </Link>
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  tileTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  link: { fontWeight: '700', marginTop: mobileSpacing.xs },
  grid: { gap: mobileSpacing.sm },
});
