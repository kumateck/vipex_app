import { ParcelStatus } from '@/db/schemas/enums';
import type { ParcelSearchRow } from '../../../api/parcel.api';

function formatGhs(amountPsw?: number | null) {
  return `GHS ${((amountPsw ?? 0) / 100).toFixed(2)}`;
}

function statusLabel(status: number) {
  return ParcelStatus[status] ?? String(status);
}

export function ReturnedRiderParcelCell({ row }: { row: ParcelSearchRow }) {
  return (
    <div className="space-y-1 leading-tight">
      <p className="font-medium">{row.bookingCode}</p>
      <p className="text-xs text-muted-foreground">Parcel Details: {row.parcelDetails}</p>
      <p className="text-xs text-muted-foreground">Parcel Content: {row.parcelContent}</p>
    </div>
  );
}

export function ReturnedRiderRecipientCell({ row }: { row: ParcelSearchRow }) {
  return (
    <div className="space-y-1 leading-tight">
      <p className="font-medium">{row.receiverName ?? '—'}</p>
      <p className="text-xs text-muted-foreground">Telephone: {row.receiverPhone ?? '—'}</p>
      <p className="text-xs text-muted-foreground">Home Address: {row.dropoffAddress ?? '—'}</p>
    </div>
  );
}

export function ReturnedRiderPaymentCell({ row }: { row: ParcelSearchRow }) {
  return (
    <div className="space-y-1 text-xs leading-tight">
      <p>
        <span className="font-semibold">Delivery Fee:</span> {formatGhs(row.deliveryFeePsw)}
      </p>
      <p>
        <span className="font-semibold">To Be Paid Amount:</span>{' '}
        {formatGhs(row.plannedToBePaidPsw)}
      </p>
      <p>
        <span className="font-semibold">Status:</span> {statusLabel(row.status)}
      </p>
    </div>
  );
}
