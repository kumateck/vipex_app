import { Text } from 'react-native';
import { AppCard, AppStatusChip } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';
import { branchLocationLabel, detailLine, formatCedis, formatDate, prettyRoute } from '../utils';

export function ParcelSummarySections({
  details,
  row,
}: {
  details: ParcelFullDetails;
  row: ParcelSearchRow | null;
}) {
  const { theme } = useAppearance();
  const sourceBranchName = row?.sourceName ?? '-';
  const sourceLocationName = row?.sourceLocationName ?? '-';
  const destinationBranchName = row?.destinationName ?? '-';
  const destinationLocationName = row?.destinationLocationName ?? row?.pickupLocationName ?? '-';

  return (
    <>
      <AppCard>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>Parcel</Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine('Booking', details.parcel.bookingCode)}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine('Tracking', details.parcel.trackingCode)}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine('Source', branchLocationLabel(sourceBranchName, sourceLocationName))}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine(
            'Destination',
            branchLocationLabel(destinationBranchName, destinationLocationName),
          )}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine(
            'Route',
            prettyRoute(
              sourceBranchName,
              sourceLocationName,
              destinationBranchName,
              destinationLocationName,
            ),
          )}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine('Sender', `${row?.senderName ?? '-'} (${row?.senderPhone ?? '-'})`)}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine('Receiver', `${row?.receiverName ?? '-'} (${row?.receiverPhone ?? '-'})`)}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine('Details', details.parcel.parcelDetails)}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine('Content', details.parcel.parcelContent)}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine(
            'Charge',
            `${formatCedis(details.parcel.chargePsw)} | To Be Paid: ${formatCedis(
              details.parcel.plannedToBePaidPsw,
            )}`,
          )}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {detailLine('Created', formatDate(details.parcel.createdAt))}
        </Text>
        <AppStatusChip label={details.parcel.status} />
      </AppCard>

      {details.internalHolder ? (
        <AppCard>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>
            Current Holder
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Branch', details.internalHolder.branchName ?? '-')}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Location', details.internalHolder.locationName ?? '-')}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Warehouse', details.internalHolder.warehouseName ?? '-')}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Updated', formatDate(details.internalHolder.updatedAt))}
          </Text>
        </AppCard>
      ) : null}

      {details.pickupQueue ? (
        <AppCard>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>
            Pickup Queue
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Queue Code', details.pickupQueue.queueCode)}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Queue Number', String(details.pickupQueue.queueNumber))}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Queued At', formatDate(details.pickupQueue.queuedAt))}
          </Text>
        </AppCard>
      ) : null}

      {details.delivery ? (
        <AppCard>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>
            Delivery
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Status', details.delivery.status)}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Address', details.delivery.dropoffAddress ?? '-')}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Amount Paid', formatCedis(details.delivery.amountPaidPsw))}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Delivered At', formatDate(details.delivery.deliveredAt))}
          </Text>
        </AppCard>
      ) : null}
    </>
  );
}
