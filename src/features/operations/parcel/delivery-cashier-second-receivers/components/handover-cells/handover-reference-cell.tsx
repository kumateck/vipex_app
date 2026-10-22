import type { ParcelSearchRow } from '../../../api/parcel.api';
import { ParcelStorageFeeBadge } from '../../../components/parcel-storage-fee-badge';
import { HandoverField } from './handover-field';

export function HandoverReferenceCell({ parcel }: { parcel: ParcelSearchRow }) {
  return (
    <div className="w-40 max-w-full space-y-1 text-xs">
      <HandoverField label="Booking">{parcel.bookingCode}</HandoverField>
      <HandoverField label="Tracking">{parcel.trackingCode}</HandoverField>
      <HandoverField label="Consignment">{parcel.consignmentCode}</HandoverField>
      <ParcelStorageFeeBadge storageChargePsw={parcel.storageChargePsw} />
    </div>
  );
}
