import { Link } from '@mobile/navigation/router-compat';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { AppScreen } from '@mobile/components/screen';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import {
  canCreateParcelBooking,
  canReviewDeliveryChanges,
  canUseTransitReceiveScan,
  canViewCallCenterFollowUp,
  canViewCustomers,
  canViewIncomingConsignments,
  canViewOperationsHub,
  canViewParcelSearch,
  canViewQueueScreen,
  canViewSelfServiceBookings,
} from '@mobile/lib/permissions';
import { AppCard, AppPageHeader, MobileNoAccess } from '@/components/ui/mobile';
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

export function MobileOperationsHubScreen() {
  const { session } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canCreateBooking = canCreateParcelBooking(permissions);
  const canSearch = canViewParcelSearch(permissions);
  const canUseQueue = canViewQueueScreen(permissions);
  const canScan = canUseTransitReceiveScan(permissions);
  const canReceiveConsignments = canViewIncomingConsignments(permissions);
  const canUseSelfService = canViewSelfServiceBookings(permissions);
  const canUseCallCenter = canViewCallCenterFollowUp(permissions);
  const canLogDiscrepancies = canViewIncomingConsignments(permissions);
  const canReviewChanges = canReviewDeliveryChanges(permissions);
  const canUseCustomers = canViewCustomers(permissions);

  if (!canViewOperationsHub(permissions)) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to access mobile operations." />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppPageHeader title="Operations" subtitle="Quick access to core workflow modules." />

      {canCreateBooking ? (
        <>
          <ModuleCard
            icon="cash-outline"
            title="Create Paid"
            description="Create a sender-pay parcel for completion at the sender cashier."
            href="/(app)/parcel-create?payment=sender"
            linkLabel="Open Create Paid"
          />
          <ModuleCard
            icon="wallet-outline"
            title="Create TobePaid"
            description="Create a receiver-pay parcel for completion at the sender cashier."
            href="/(app)/parcel-create?payment=recipient"
            linkLabel="Open Create TobePaid"
          />
        </>
      ) : null}
      {canSearch ? (
        <ModuleCard
          icon="search-outline"
          title="Super Search"
          description="Find any parcel record across your company with one search."
          href="/(app)/super-search"
          linkLabel="Open Super Search"
        />
      ) : null}
      {canUseQueue ? (
        <ModuleCard
          icon="ticket-outline"
          title="Queue Management"
          description="Search parcels, issue queue tickets, and track queue boards."
          href="/(app)/queue"
          linkLabel="Open Queue"
        />
      ) : null}
      {canScan ? (
        <ModuleCard
          icon="qr-code-outline"
          title="Scan To Receive"
          description="Scan incoming parcels and mark them at destination."
          href="/(app)/receive"
          linkLabel="Open Receive"
        />
      ) : null}
      {canReceiveConsignments ? (
        <ModuleCard
          icon="cube-outline"
          title="Receive Consignments"
          description="Open an incoming consignment and scan every parcel against its checklist before closing it."
          href="/(app)/receive-consignments"
          linkLabel="Open Consignments"
        />
      ) : null}
      {canUseSelfService ? (
        <ModuleCard
          icon="document-text-outline"
          title="Self-Service Bookings"
          description="Claim customer drafts and complete them into parcel bookings."
          href="/(app)/self-service"
          linkLabel="Open Drafts"
        />
      ) : null}
      {canUseCallCenter ? (
        <ModuleCard
          icon="call-outline"
          title="Call Center Follow-up"
          description="Work your assigned call queue, record outcomes, and collect confirmed delivery addresses."
          href="/(app)/call-center-follow-up"
          linkLabel="Open Follow-up"
        />
      ) : null}
      {canLogDiscrepancies ? (
        <ModuleCard
          icon="alert-circle-outline"
          title="Receiving Discrepancies"
          description="Record missing or unmatched incoming parcels with photo evidence."
          href="/(app)/receive-discrepancies"
          linkLabel="Open Discrepancies"
        />
      ) : null}
      {canReviewChanges ? (
        <ModuleCard
          icon="checkmark-done-outline"
          title="Delivery Change Reviews"
          description="Approve or reject rider address and delivery-fee changes."
          href="/(app)/delivery-change-reviews"
          linkLabel="Open Reviews"
        />
      ) : null}
      {canUseCustomers ? (
        <ModuleCard
          icon="people-outline"
          title="Customers"
          description="Search customer records and maintain limited contact details."
          href="/(app)/customers"
          linkLabel="Open Customers"
        />
      ) : null}
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
