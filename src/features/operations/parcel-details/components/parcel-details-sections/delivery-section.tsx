import { memo } from 'react';
import { DeliveryMode } from '@/db/schemas/enums';
import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import { resolveParcelDeliveredAt } from '@/features/operations/parcel/components/parcel-super-search/utils';
import { formatMoney, formatWhen, personName } from '../../utils/parcel-details-format';
import { DetailCard, DetailGrid, EmptyNote } from '../detail-grid/detail-grid';

export const DeliverySection = memo(function DeliverySection({
  details,
}: {
  details: ParcelFullDetails;
}) {
  const { delivery, parcel } = details;
  const userNames = details.userNames ?? {};
  if (!delivery) {
    return (
      <DetailCard title="Delivery">
        <EmptyNote>
          No delivery record. The parcel has not been handed over or set up for delivery.
        </EmptyNote>
      </DetailCard>
    );
  }
  const isHome = delivery.mode === DeliveryMode.DOORSTEP;
  const deliveredAt = resolveParcelDeliveredAt({
    status: parcel.status,
    deliveredAt: delivery.deliveredAt,
    confirmedAt: parcel.confirmedAt,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
      <DetailCard title={isHome ? 'Home Delivery' : 'Office Delivery'}>
        <DetailGrid
          items={[
            { label: 'Delivery Status', value: delivery.status.replaceAll('_', ' ').toLowerCase() },
            { label: 'Dropoff Address', value: delivery.dropoffAddress },
            { label: 'Delivery Fee', value: formatMoney(delivery.chargePsw) },
            { label: 'Amount Paid', value: formatMoney(delivery.amountPaidPsw) },
            isHome
              ? {
                  label: 'Rider',
                  value: delivery.riderName ?? personName(userNames, delivery.riderUserId),
                }
              : null,
            isHome
              ? { label: 'Rider Assigned At', value: formatWhen(delivery.riderAssignedAt) }
              : null,
            isHome
              ? {
                  label: 'Rider Handed To Customer At',
                  value: formatWhen(delivery.riderCompletedAt),
                }
              : null,
            isHome ? { label: 'Rider Returned At', value: formatWhen(delivery.returnedAt) } : null,
            { label: 'Delivered At', value: formatWhen(deliveredAt) },
            { label: 'Front Desk', value: personName(userNames, delivery.frontDeskUserId) },
            { label: 'Delivery Officer', value: personName(userNames, delivery.deliveryUserId) },
            {
              label: 'Receiver Call Confirmed By',
              value: personName(userNames, delivery.receiverCalledConfirmedBy),
            },
            {
              label: 'Receiver Call Confirmed At',
              value: formatWhen(delivery.receiverCalledConfirmedAt),
            },
            { label: 'Delivery Confirmed By', value: personName(userNames, delivery.confirmedBy) },
            { label: 'Delivery Confirmed At', value: formatWhen(delivery.confirmedAt) },
            { label: 'Record Created By', value: personName(userNames, delivery.createdBy) },
          ]}
        />
      </DetailCard>
      {delivery.signatureImage ? (
        <DetailCard title="Receiver Signature">
          <img
            src={delivery.signatureImage}
            alt="Receiver signature"
            className="max-h-48 w-64 rounded border bg-white object-contain"
          />
        </DetailCard>
      ) : null}
    </div>
  );
});
