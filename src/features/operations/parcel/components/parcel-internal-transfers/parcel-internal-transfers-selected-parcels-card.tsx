import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { ParcelInternalHolderBadge } from '../parcel-internal-holder-badge';

type ParcelInternalTransfersSelectedParcelsCardProps = {
  selectedParcels: ParcelSearchRow[];
  onRemoveParcel: (parcelId: string) => void;
};

export function ParcelInternalTransfersSelectedParcelsCard({
  selectedParcels,
  onRemoveParcel,
}: ParcelInternalTransfersSelectedParcelsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Parcels</CardTitle>
        <CardDescription>
          These parcels will move together on the same internal transfer note.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedParcels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No parcels selected yet.</p>
        ) : (
          selectedParcels.map((parcel) => (
            <div
              key={parcel.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="space-y-1">
                <p className="font-medium">{parcel.trackingCode}</p>
                <p className="text-sm text-muted-foreground">
                  {parcel.bookingCode} • {parcel.receiverName || '-'} • {parcel.parcelDetails}
                </p>
                <p className="text-xs text-muted-foreground">
                  Age: {parcel.ageingDays ?? '-'} days • Storage:{' '}
                  {`GHS ${(((parcel.storageChargePsw ?? 0) as number) / 100).toFixed(2)}`}
                </p>
                <ParcelInternalHolderBadge holder={parcel} />
              </div>
              <Button size="sm" variant="outline" onClick={() => onRemoveParcel(parcel.id)}>
                Remove
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
