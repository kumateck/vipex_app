import { StyleSheet, Text, View } from 'react-native';
import { AppCard, AppStatusChip } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { branchLocationLabel, formatCedis, formatDate, prettyRoute } from '../utils';

function DetailRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const { theme } = useAppearance();
  return (
    <View
      style={[
        styles.detailRow,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.separator,
        },
      ]}
    >
      <Text style={[styles.detailLabel, { color: theme.colors.textSubtle }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function SectionHead({ title, statusLabel }: { title: string; statusLabel?: string | number }) {
  const { theme } = useAppearance();
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {statusLabel !== undefined ? <AppStatusChip label={statusLabel} /> : null}
    </View>
  );
}

export function ParcelSummarySections({
  details,
  row,
}: {
  details: ParcelFullDetails;
  row: ParcelSearchRow | null;
}) {
  const sourceBranchName = row?.sourceName ?? '-';
  const sourceLocationName = row?.sourceLocationName ?? '-';
  const destinationBranchName = row?.destinationName ?? '-';
  const destinationLocationName = row?.destinationLocationName ?? row?.pickupLocationName ?? '-';

  return (
    <>
      <AppCard>
        <SectionHead title="Parcel" statusLabel={details.parcel.status} />
        <View style={styles.detailList}>
          <DetailRow first label="Booking" value={details.parcel.bookingCode} />
          <DetailRow
            label="Source"
            value={branchLocationLabel(sourceBranchName, sourceLocationName)}
          />
          <DetailRow
            label="Destination"
            value={branchLocationLabel(destinationBranchName, destinationLocationName)}
          />
          <DetailRow
            label="Route"
            value={prettyRoute(
              sourceBranchName,
              sourceLocationName,
              destinationBranchName,
              destinationLocationName,
            )}
          />
          <DetailRow
            label="Sender"
            value={`${row?.senderName ?? '-'} (${row?.senderPhone ?? '-'})`}
          />
          <DetailRow
            label="Receiver"
            value={`${row?.receiverName ?? '-'} (${row?.receiverPhone ?? '-'})`}
          />
          <DetailRow label="Details" value={details.parcel.parcelDetails ?? '-'} />
          <DetailRow label="Content" value={details.parcel.parcelContent ?? '-'} />
          <DetailRow label="Charge" value={formatCedis(details.parcel.chargePsw)} />
          <DetailRow label="To Be Paid" value={formatCedis(details.parcel.plannedToBePaidPsw)} />
          <DetailRow label="Created" value={formatDate(details.parcel.createdAt)} />
        </View>
      </AppCard>

      {details.internalHolder ? (
        <AppCard>
          <SectionHead title="Current Holder" />
          <View style={styles.detailList}>
            <DetailRow first label="Branch" value={details.internalHolder.branchName ?? '-'} />
            <DetailRow label="Location" value={details.internalHolder.locationName ?? '-'} />
            <DetailRow label="Warehouse" value={details.internalHolder.warehouseName ?? '-'} />
            <DetailRow label="Updated" value={formatDate(details.internalHolder.updatedAt)} />
          </View>
        </AppCard>
      ) : null}

      {details.pickupQueue ? (
        <AppCard>
          <SectionHead title="Pickup Queue" />
          <View style={styles.detailList}>
            <DetailRow first label="Queue Code" value={details.pickupQueue.queueCode} />
            <DetailRow label="Queue Number" value={String(details.pickupQueue.queueNumber)} />
            <DetailRow label="Queued At" value={formatDate(details.pickupQueue.queuedAt)} />
          </View>
        </AppCard>
      ) : null}

      {details.delivery ? (
        <AppCard>
          <SectionHead title="Delivery" statusLabel={details.delivery.status} />
          <View style={styles.detailList}>
            <DetailRow first label="Address" value={details.delivery.dropoffAddress ?? '-'} />
            <DetailRow label="Amount Paid" value={formatCedis(details.delivery.amountPaidPsw)} />
            <DetailRow label="Delivered At" value={formatDate(details.delivery.deliveredAt)} />
          </View>
        </AppCard>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  title: { ...mobileTextStyles.title3 },
  detailList: { marginTop: -mobileSpacing.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
  },
  detailLabel: { ...mobileTextStyles.subhead, flexShrink: 0 },
  detailValue: { ...mobileTextStyles.subhead, fontWeight: '600', flex: 1, textAlign: 'right' },
});
