import type { ParcelFullDetails } from '@mobile/types/parcels';
import { formatCedis, formatDate, personName } from '../utils';
import { ParcelDetailCard } from './parcel-detail-card';

const DOORSTEP = 1;

/** Full delivery record: who set it up, the rider's steps and who confirmed it. */
export function ParcelDeliverySection({ details }: { details: ParcelFullDetails }) {
  const { delivery, userNames } = details;
  if (!delivery) {
    return (
      <ParcelDetailCard
        title="Delivery"
        rows={[['Record', 'Not yet handed over or set up for delivery']]}
      />
    );
  }
  const isHome = delivery.mode === DOORSTEP;
  const name = (id?: string | null) => personName(userNames, id);

  return (
    <ParcelDetailCard
      title={isHome ? 'Home Delivery' : 'Office Delivery'}
      rows={[
        ['Status', delivery.status.replaceAll('_', ' ').toLowerCase()],
        ['Address', delivery.dropoffAddress],
        ['Delivery Fee', formatCedis(delivery.chargePsw)],
        ['Amount Paid', formatCedis(delivery.amountPaidPsw)],
        isHome && ['Rider', delivery.riderName ?? name(delivery.riderUserId)],
        isHome && ['Rider Assigned', formatDate(delivery.riderAssignedAt)],
        isHome && ['Handed To Customer', formatDate(delivery.riderCompletedAt)],
        isHome && ['Returned To Office', formatDate(delivery.returnedAt)],
        ['Delivered At', formatDate(delivery.deliveredAt)],
        ['Front Desk', name(delivery.frontDeskUserId)],
        ['Delivery Officer', name(delivery.deliveryUserId)],
        ['Receiver Call Confirmed By', name(delivery.receiverCalledConfirmedBy)],
        ['Delivery Confirmed By', name(delivery.confirmedBy)],
        ['Delivery Confirmed At', formatDate(delivery.confirmedAt)],
        ['Record Created By', name(delivery.createdBy)],
      ]}
    />
  );
}
