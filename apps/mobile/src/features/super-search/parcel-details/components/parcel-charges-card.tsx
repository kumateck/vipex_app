import type { ParcelFullDetails } from '@mobile/types/parcels';
import { formatCedis } from '../utils';
import { ParcelDetailCard } from './parcel-detail-card';

/** What the parcel costs, who has paid, and what is still owed. */
export function ParcelChargesCard({ details }: { details: ParcelFullDetails }) {
  const { parcel, summary, delivery } = details;
  return (
    <ParcelDetailCard
      title="Charges"
      rows={[
        parcel.chargeExemptCustomerType != null && [
          'Charge status',
          'Exempt from all charges, including storage',
        ],
        ['Parcel Charge', formatCedis(parcel.chargePsw)],
        ['To Be Paid by Receiver', formatCedis(parcel.plannedToBePaidPsw)],
        summary && ['Paid (parcel charge)', formatCedis(summary.paidPrincipalPsw)],
        summary && ['Paid by Sender', formatCedis(summary.senderPaidPrincipalPsw)],
        summary && ['Paid by Receiver', formatCedis(summary.receiverPaidPrincipalPsw)],
        summary && ['Outstanding', formatCedis(summary.outstandingPrincipalPsw)],
        ['Delivery Fee', formatCedis(summary?.deliveryFeePsw ?? delivery?.chargePsw)],
        summary && ['Outstanding Delivery Fee', formatCedis(summary.outstandingDeliveryFeePsw)],
      ]}
    />
  );
}
