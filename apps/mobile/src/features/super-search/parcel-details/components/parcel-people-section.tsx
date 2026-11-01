import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';
import { branchLocationLabel, formatDate, joinPhones, personName } from '../utils';
import { ParcelDetailCard } from './parcel-detail-card';

/** Sender, receivers, route and every person recorded against the parcel. */
export function ParcelPeopleSection({
  details,
  row,
}: {
  details: ParcelFullDetails;
  row: ParcelSearchRow | null;
}) {
  const summary = details.summary ?? row;
  const extras = details.summary;
  const { parcel, delivery, pickupQueue, userNames } = details;
  const name = (id?: string | null) => personName(userNames, id);

  return (
    <>
      <ParcelDetailCard
        title="Sender & Receiver"
        rows={[
          ['Sender', summary?.senderName],
          ['Sender Telephone', joinPhones(summary?.senderPhone, extras?.senderPhone2)],
          ['Receiver', summary?.receiverName],
          details.parcel.relatedStaffNameSnapshot
            ? ['Receiving staff', details.parcel.relatedStaffNameSnapshot]
            : null,
          ['Receiver Telephone', joinPhones(summary?.receiverPhone, summary?.receiverPhone2)],
          extras?.secondReceiverName ? ['Second Receiver', extras.secondReceiverName] : null,
          extras?.secondReceiverPhone
            ? ['Second Receiver Telephone', extras.secondReceiverPhone]
            : null,
          ['Call Sender (CS)', parcel.callSender ? 'Yes' : 'No'],
        ]}
      />
      <ParcelDetailCard
        title="Route"
        rows={[
          ['From', branchLocationLabel(summary?.sourceName, summary?.sourceLocationName)],
          ['To', branchLocationLabel(summary?.destinationName, summary?.pickupLocationName)],
          ['Dropoff Address', extras?.dropoffAddress ?? delivery?.dropoffAddress],
          ['Call Center Agent', summary?.callCenterAssignedToUserName],
          ['Customer Called At', formatDate(summary?.callCenterCalledAt)],
        ]}
      />
      <ParcelDetailCard
        title="Handled By"
        rows={[
          ['Created By', name(parcel.createdBy)],
          ['Processed By', name(parcel.processedBy)],
          ['Received By', name(parcel.receivedBy)],
          ['Confirmed By', name(parcel.confirmedBy)],
          ['Shelf Picker', name(parcel.shelfPickerStaffId ?? pickupQueue?.pickerStaffId)],
          pickupQueue ? ['Queued By', name(pickupQueue.queuedBy)] : null,
          delivery ? ['Delivery Created By', name(delivery.createdBy)] : null,
          delivery ? ['Rider', delivery.riderName ?? name(delivery.riderUserId)] : null,
          delivery ? ['Delivery Confirmed By', name(delivery.confirmedBy)] : null,
          parcel.isDeleted ? ['Deleted By', name(parcel.deletedBy)] : null,
        ]}
      />
    </>
  );
}
