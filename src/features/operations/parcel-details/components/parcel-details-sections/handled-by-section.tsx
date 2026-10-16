import { memo } from 'react';
import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import { personName } from '../../utils/parcel-details-format';
import { DetailCard, DetailGrid } from '../detail-grid/detail-grid';

/** Every person recorded against the parcel, by role. Full step-by-step detail is in History. */
export const HandledBySection = memo(function HandledBySection({
  details,
}: {
  details: ParcelFullDetails;
}) {
  const { parcel, delivery, pickupQueue, summary } = details;
  const userNames = details.userNames ?? {};
  const name = (id: string | null | undefined) => personName(userNames, id);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <DetailCard title="Parcel">
        <DetailGrid
          items={[
            { label: 'Created By', value: name(parcel.createdBy) },
            { label: 'Processed By', value: name(parcel.processedBy) },
            { label: 'Received By', value: name(parcel.receivedBy) },
            { label: 'Confirmed By', value: name(parcel.confirmedBy) },
            {
              label: 'Shelf Picker',
              value: name(parcel.shelfPickerStaffId ?? pickupQueue?.pickerStaffId),
            },
            { label: 'Call Center Agent', value: summary?.callCenterAssignedToUserName },
            parcel.isDeleted ? { label: 'Deleted By', value: name(parcel.deletedBy) } : null,
          ]}
        />
      </DetailCard>
      <DetailCard title="Pickup Queue">
        <DetailGrid
          items={[
            { label: 'Queued By', value: pickupQueue ? name(pickupQueue.queuedBy) : '-' },
            { label: 'Queue Ended By', value: pickupQueue ? name(pickupQueue.endedBy) : '-' },
          ]}
        />
      </DetailCard>
      <DetailCard title="Delivery">
        <DetailGrid
          items={[
            { label: 'Delivery Created By', value: delivery ? name(delivery.createdBy) : '-' },
            { label: 'Front Desk', value: delivery ? name(delivery.frontDeskUserId) : '-' },
            { label: 'Delivery Officer', value: delivery ? name(delivery.deliveryUserId) : '-' },
            { label: 'Rider', value: delivery ? name(delivery.riderUserId) : '-' },
            {
              label: 'Receiver Call Confirmed By',
              value: delivery ? name(delivery.receiverCalledConfirmedBy) : '-',
            },
            { label: 'Delivery Confirmed By', value: delivery ? name(delivery.confirmedBy) : '-' },
          ]}
        />
      </DetailCard>
      <p className="text-xs text-muted-foreground lg:col-span-3">
        Payment cashiers are listed on the Payments tab. When a field shows "-", that step was not
        recorded on the parcel; check History for who actually performed it.
      </p>
    </div>
  );
});
