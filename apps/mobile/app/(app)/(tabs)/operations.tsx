import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppCard } from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

export default function OperationsTabScreen() {
  const { theme } = useAppearance();

  return (
    <AppScreen>
      <Text style={[styles.title, { color: theme.colors.text }]}>Operations</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Quick access to core workflow modules.
      </Text>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Global Search</Text>
        <Text style={{ color: theme.colors.textMuted }}>
          Search parcels, communication threads, channels, and users in one view.
        </Text>
        <Link
          href={'/(app)/global-search' as never}
          style={[styles.link, { color: theme.colors.primary }]}
        >
          Open Global Search
        </Link>
      </AppCard>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Super Search</Text>
        <Text style={{ color: theme.colors.textMuted }}>
          Find any parcel record across your company with one search.
        </Text>
        <Link
          href={'/(app)/super-search' as never}
          style={[styles.link, { color: theme.colors.primary }]}
        >
          Open Super Search
        </Link>
      </AppCard>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Queue Management</Text>
        <Text style={{ color: theme.colors.textMuted }}>
          Search parcels, issue queue tickets, and track queue boards.
        </Text>
        <Link href="/(app)/queue" style={[styles.link, { color: theme.colors.primary }]}>
          Open Queue
        </Link>
      </AppCard>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Rider Dashboard</Text>
        <Text style={{ color: theme.colors.textMuted }}>
          View assignments and complete doorstep delivery actions.
        </Text>
        <Link href="/(app)/rider" style={[styles.link, { color: theme.colors.primary }]}>
          Open Rider
        </Link>
      </AppCard>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Scan To Receive</Text>
        <Text style={{ color: theme.colors.textMuted }}>
          Scan incoming parcels and mark them at destination.
        </Text>
        <Link href="/(app)/receive" style={[styles.link, { color: theme.colors.primary }]}>
          Open Receive
        </Link>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  cardTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  link: { marginTop: mobileSpacing.xs, fontWeight: '700' },
});
