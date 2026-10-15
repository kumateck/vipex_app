import { Button } from '@/components/ui/button';
import { ParcelStorageFeeBadge } from '../../parcel-storage-fee-badge';
import type { ShelfPickupParcel } from '../types';

export function ShelfPickupReassignmentTable({
  rows,
  loading,
  onSelect,
}: {
  rows: ShelfPickupParcel[];
  loading: boolean;
  onSelect: (parcel: ShelfPickupParcel) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-3">Parcel</th>
            <th className="p-3">Receiver</th>
            <th className="p-3">Details</th>
            <th className="p-3">Current Shelf Picker</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((parcel) => (
            <tr key={parcel.id} className="border-b last:border-0">
              <td className="p-3">
                <p className="font-medium">{parcel.bookingCode}</p>
                <p className="text-xs text-muted-foreground">{parcel.trackingCode}</p>
                <ParcelStorageFeeBadge storageChargePsw={parcel.storageChargePsw} />
              </td>
              <td className="p-3">
                {parcel.receiverName ?? '-'}
                <p className="text-muted-foreground">{parcel.receiverPhone ?? '-'}</p>
              </td>
              <td className="p-3">{parcel.parcelDetails}</td>
              <td className="p-3">{parcel.pickerStaffName ?? 'Assigned staff'}</td>
              <td className="p-3">
                <Button size="sm" disabled={loading} onClick={() => onSelect(parcel)}>
                  Reassign
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? (
        <p className="p-6 text-center text-muted-foreground">
          {loading ? 'Loading assigned parcels…' : 'No assigned parcels awaiting pickup found.'}
        </p>
      ) : null}
    </div>
  );
}
