import type { ParcelSearchRow } from '../../api/parcel.api';

export function ParcelTransitRouteCell({
  parcel,
  sourceBranchFallback,
  destinationBranchFallback,
}: {
  parcel: ParcelSearchRow;
  sourceBranchFallback?: string;
  destinationBranchFallback?: string;
}) {
  return (
    <div className="space-y-0.5 leading-tight">
      <p>
        <span className="text-muted-foreground">From:</span>{' '}
        <span className="font-medium">{parcel.sourceName ?? sourceBranchFallback ?? '-'}</span>
      </p>
      <p>
        <span className="text-muted-foreground">Location:</span>{' '}
        <span className="font-medium">{parcel.sourceLocationName ?? '-'}</span>
      </p>
      <p>
        <span className="text-muted-foreground">To:</span>{' '}
        <span className="font-medium">
          {parcel.destinationName ?? destinationBranchFallback ?? '-'}
        </span>
      </p>
      <p>
        <span className="text-muted-foreground">Location:</span>{' '}
        <span className="font-medium">{parcel.pickupLocationName ?? '-'}</span>
      </p>
    </div>
  );
}
