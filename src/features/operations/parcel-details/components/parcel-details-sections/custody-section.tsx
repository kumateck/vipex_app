import { memo } from 'react';
import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import { getParcelInternalHolderLabel } from '@/features/operations/parcel/components/parcel-internal-holder-badge';
import { formatWhen, personName } from '../../utils/parcel-details-format';
import { DetailCard, DetailGrid, EmptyNote } from '../detail-grid/detail-grid';

export const CustodySection = memo(function CustodySection({
  details,
  branchNameById,
}: {
  details: ParcelFullDetails;
  branchNameById: Map<string, string>;
}) {
  const { consignments, pickupQueue, internalHolder, parcel } = details;
  const userNames = details.userNames ?? {};
  const branch = (id: string) => branchNameById.get(id) ?? '-';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DetailCard title="Current Holder">
        <DetailGrid
          items={[
            {
              label: 'Held By',
              value: internalHolder
                ? getParcelInternalHolderLabel(internalHolder)
                : 'Main branch (no internal holder recorded)',
            },
            { label: 'Since', value: formatWhen(internalHolder?.updatedAt) },
            {
              label: 'Shelf Picker',
              value: personName(userNames, parcel.shelfPickerStaffId ?? pickupQueue?.pickerStaffId),
            },
          ]}
        />
      </DetailCard>
      <DetailCard title="Pickup Queue">
        {pickupQueue ? (
          <DetailGrid
            items={[
              { label: 'Queue Code', value: pickupQueue.queueCode },
              { label: 'Ticket Number', value: pickupQueue.queueNumber },
              { label: 'Payment Bucket', value: pickupQueue.paymentBucket },
              { label: 'Queued At', value: formatWhen(pickupQueue.queuedAt) },
              { label: 'Queued By', value: personName(userNames, pickupQueue.queuedBy) },
              { label: 'Ended At', value: formatWhen(pickupQueue.endedAt) },
              { label: 'Ended By', value: personName(userNames, pickupQueue.endedBy) },
            ]}
          />
        ) : (
          <EmptyNote>Not queued for pickup.</EmptyNote>
        )}
      </DetailCard>
      <DetailCard title={`Consignment History (${consignments.length})`} className="lg:col-span-2">
        {consignments.length === 0 ? (
          <EmptyNote>Not added to any consignment.</EmptyNote>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {consignments.map((consignment) => (
              <div
                key={`${consignment.consignmentId}-${consignment.addedAt}`}
                className="rounded-md border p-3 text-sm"
              >
                <p className="font-medium">{consignment.code}</p>
                <p className="text-muted-foreground">
                  {branch(consignment.sourceId)} → {branch(consignment.destinationId)}
                </p>
                <p className="text-muted-foreground">
                  Consignment date: {formatWhen(consignment.consignmentDate)}
                </p>
                <p className="text-muted-foreground">Added: {formatWhen(consignment.addedAt)}</p>
                <p className="text-muted-foreground">
                  {consignment.removedAt
                    ? `Removed: ${formatWhen(consignment.removedAt)}`
                    : 'Active'}
                </p>
              </div>
            ))}
          </div>
        )}
      </DetailCard>
    </div>
  );
});
