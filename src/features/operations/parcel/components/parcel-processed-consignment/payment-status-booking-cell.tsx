import { getConsignmentPaymentStatus, type PaymentStatusParcel } from './payment-status';
import { ParcelStorageFeeBadge } from '../parcel-storage-fee-badge';

type PaymentStatusBookingCellProps = {
  parcel: PaymentStatusParcel & { bookingCode: string; storageChargePsw?: number | null };
};

export function PaymentStatusBookingCell({ parcel }: PaymentStatusBookingCellProps) {
  const paymentStatus = getConsignmentPaymentStatus(parcel);

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${paymentStatus.dotClassName}`} />
      <span>{parcel.bookingCode}</span>
      <ParcelStorageFeeBadge storageChargePsw={parcel.storageChargePsw} />
    </div>
  );
}
