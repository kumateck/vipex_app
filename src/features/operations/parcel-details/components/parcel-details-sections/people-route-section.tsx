import { memo } from 'react';
import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import { formatWhen, joinPhones } from '../../utils/parcel-details-format';
import { DetailCard, DetailGrid } from '../detail-grid/detail-grid';

function place(branch: string | null | undefined, location: string | null | undefined) {
  return `${branch?.trim() || '-'} (${location?.trim() || '-'})`;
}

export const PeopleRouteSection = memo(function PeopleRouteSection({
  details,
  branchNameById,
}: {
  details: ParcelFullDetails;
  branchNameById: Map<string, string>;
}) {
  const { parcel, summary } = details;
  const source = place(
    summary?.sourceName ?? branchNameById.get(parcel.sourceId),
    summary?.sourceLocationName,
  );
  const destination = place(
    summary?.destinationName ?? branchNameById.get(parcel.destinationId),
    summary?.pickupLocationName,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DetailCard title="Sender">
        <DetailGrid
          items={[
            { label: 'Name', value: summary?.senderName ?? parcel.senderNameSnapshot },
            { label: 'Telephone', value: joinPhones(summary?.senderPhone, summary?.senderPhone2) },
            { label: 'Call Sender (CS)', value: parcel.callSender ? 'Yes' : 'No' },
          ]}
        />
      </DetailCard>
      <DetailCard title="Receiver">
        <DetailGrid
          items={[
            { label: 'Name', value: summary?.receiverName ?? parcel.receiverNameSnapshot },
            {
              label: 'Telephone',
              value: joinPhones(summary?.receiverPhone, summary?.receiverPhone2),
            },
            { label: 'Card', value: parcel.cardNumber },
            parcel.secondReceiverId
              ? {
                  label: 'Second Receiver',
                  value: summary?.secondReceiverName ?? parcel.secondReceiverNameSnapshot,
                }
              : null,
            parcel.secondReceiverId
              ? {
                  label: 'Second Receiver Telephone',
                  value: joinPhones(summary?.secondReceiverPhone, summary?.secondReceiverPhone2),
                }
              : null,
            parcel.secondReceiverId
              ? { label: 'Second Receiver Card', value: parcel.secondCardNumber }
              : null,
          ]}
        />
      </DetailCard>
      <DetailCard title="Route" className="lg:col-span-2">
        <DetailGrid
          items={[
            { label: 'From', value: source },
            { label: 'To', value: destination },
            { label: 'Route', value: `${source} → ${destination}` },
            { label: 'Dropoff Address', value: summary?.dropoffAddress },
            { label: 'Call Center Agent', value: summary?.callCenterAssignedToUserName },
            { label: 'Customer Called At', value: formatWhen(summary?.callCenterCalledAt) },
          ]}
        />
      </DetailCard>
    </div>
  );
});
