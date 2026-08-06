import { Link } from '@mobile/navigation/router-compat';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { AppScreen } from '@mobile/components/screen';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canCreateParcelBooking } from '@mobile/lib/permissions';
import { AppCard, AppPageHeader } from '@/components/ui/mobile';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type ModuleCardProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  href: string;
  linkLabel: string;
};

function ModuleCard({ icon, title, description, href, linkLabel }: ModuleCardProps) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: `${theme.colors.primary}1F` }]}>
          <Ionicons name={icon} size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.cardBody, { color: theme.colors.textMuted }]}>{description}</Text>
      <Link href={href as never} style={[styles.link, { color: theme.colors.secondary }]}>
        {linkLabel} ›
      </Link>
    </AppCard>
  );
}

export default function OperationsTabScreen() {
  const { session } = useAuth();
  const canCreateBooking = canCreateParcelBooking(session.user?.permissions ?? []);

  return (
    <AppScreen>
      <AppPageHeader title="Operations" subtitle="Quick access to core workflow modules." />

      {canCreateBooking ? (
        <ModuleCard
          icon="cash-outline"
          title="Create TobePaid"
          description="Create a to-be-paid parcel booking. The receiver pays the full charge on pickup."
          href="/(app)/parcel-create"
          linkLabel="Open Create TobePaid"
        />
      ) : null}
      <ModuleCard
        icon="search-outline"
        title="Super Search"
        description="Find any parcel record across your company with one search."
        href="/(app)/super-search"
        linkLabel="Open Super Search"
      />
      <ModuleCard
        icon="ticket-outline"
        title="Queue Management"
        description="Search parcels, issue queue tickets, and track queue boards."
        href="/(app)/queue"
        linkLabel="Open Queue"
      />
      <ModuleCard
        icon="qr-code-outline"
        title="Scan To Receive"
        description="Scan incoming parcels and mark them at destination."
        href="/(app)/receive"
        linkLabel="Open Receive"
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: mobileRadius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...mobileTextStyles.headline },
  cardBody: { ...mobileTextStyles.subhead },
  link: { ...mobileTextStyles.footnote, fontWeight: '700', marginTop: mobileSpacing.xs },
});
