import type { ProcessedParcel } from '../../api/parcel.api';
import { getConsignmentPaymentStatus } from './payment-status';

type PaymentStatusBookingCellProps = {
  parcel: ProcessedParcel;
};

export function PaymentStatusBookingCell({ parcel }: PaymentStatusBookingCellProps) {
  const paymentStatus = getConsignmentPaymentStatus(parcel);

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${paymentStatus.dotClassName}`} />
      <span>{parcel.bookingCode}</span>
    </div>
  );
}
