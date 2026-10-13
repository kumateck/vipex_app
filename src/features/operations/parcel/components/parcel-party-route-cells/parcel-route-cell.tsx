import { memo } from 'react';
import type { ParcelSearchRow } from '../../api/parcel.api';

export const ParcelRouteCell = memo(function ParcelRouteCell({
  parcel,
}: {
  parcel: ParcelSearchRow;
}) {
  return (
    <div className="w-56 max-w-full space-y-2 whitespace-normal [overflow-wrap:anywhere]">
      <div className="leading-tight">
        <p className="font-medium">{parcel.sourceName ?? '-'}</p>
        <p className="text-muted-foreground text-xs">{parcel.sourceLocationName ?? '-'}</p>
      </div>
      <div className="leading-tight">
        <p className="font-medium">{parcel.destinationName ?? '-'}</p>
        <p className="text-muted-foreground text-xs">{parcel.pickupLocationName ?? '-'}</p>
      </div>
    </div>
  );
});
