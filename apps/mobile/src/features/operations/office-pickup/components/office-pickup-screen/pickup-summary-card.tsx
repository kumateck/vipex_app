import { ParcelHandoverNoteAction } from '@mobile/features/operations/parcel-handover-note';
import { memo } from 'react';
import { Text, View } from 'react-native';
import { AppCard } from '@mobile/components/ui/mobile';
import { formatQueueDate } from '@mobile/features/operations/queue-management/utils';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { PickupParcel, PickupParcelDetails } from '../../types';
import { pickupStyles } from './office-pickup.styles';

function Line({ label, value }: { label: string; value?: string | null }) {
  const { theme } = useAppearance();
  return (
    <Text style={[pickupStyles.text, { color: theme.colors.textMuted }]}>
      <Text style={[pickupStyles.strong, { color: theme.colors.text }]}>{label}: </Text>
      {value || '-'}
    </Text>
  );
}

export const PickupSummaryCard = memo(function PickupSummaryCard({
  parcel,
}: {
  parcel: PickupParcel;
}) {
  const { theme } = useAppearance();
  const phones = [parcel.receiverPhone, parcel.receiverPhone2].filter(Boolean).join(' · ');
  return (
    <AppCard>
      <Text style={[pickupStyles.title, { color: theme.colors.text }]}>{parcel.trackingCode}</Text>
      <Line label="Booking" value={parcel.bookingCode} />
      <ParcelHandoverNoteAction
        parcelId={parcel.id}
        hasHandoverNote={parcel.hasHandoverNote}
        handoverNoteCritical={parcel.handoverNoteCritical}
      />
      <Line
        label="Receiver"
        value={`${parcel.receiverName ?? '-'}${phones ? ` (${phones})` : ''}`}
      />
      <Line label="Parcel" value={parcel.parcelDetails} />
      <Line label="Content" value={parcel.parcelContent} />
      <Line label="Pickup location" value={parcel.pickupLocationName} />
    </AppCard>
  );
});

/** Queue ticket status for branches that hand over through the pickup queue. */
export const PickupQueueNotice = memo(function PickupQueueNotice({
  queue,
}: {
  queue: PickupParcelDetails['pickupQueue'];
}) {
  const { theme } = useAppearance();
  return (
    <View
      style={[
        pickupStyles.notice,
        { borderColor: queue ? theme.colors.border : theme.colors.warning },
      ]}
    >
      <Text style={[pickupStyles.text, pickupStyles.strong, { color: theme.colors.text }]}>
        Pickup queue
      </Text>
      {queue ? (
        <>
          <Line label="Queue code" value={queue.queueCode} />
          <Line label="Queue number" value={String(queue.queueNumber)} />
          <Line label="Queued at" value={formatQueueDate(queue.queuedAt)} />
        </>
      ) : (
        <Text style={[pickupStyles.hint, { color: theme.colors.textMuted }]}>
          No queue ticket found yet. Issue one from Queue Management, then return here to complete
          handover.
        </Text>
      )}
    </View>
  );
});
