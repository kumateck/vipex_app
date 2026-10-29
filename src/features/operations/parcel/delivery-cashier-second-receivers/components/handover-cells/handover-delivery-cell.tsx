import { Badge } from '@/components/ui/badge';
import type { ParcelSearchRow } from '../../../api/parcel.api';
import { HandoverField } from './handover-field';

export function HandoverDeliveryCell({
  parcel,
  stage,
}: {
  parcel: ParcelSearchRow;
  stage: string;
}) {
  return (
    <div className="w-56 max-w-full space-y-2 whitespace-normal break-words text-xs">
      <div className="space-y-1">
        <Badge variant="secondary">{stage}</Badge>
        <HandoverField label="Assigned rider">{parcel.riderName || 'Not assigned'}</HandoverField>
        <HandoverField label="Delivery address">{parcel.dropoffAddress}</HandoverField>
      </div>
      <div className="space-y-1">
        <HandoverField label="From branch">{parcel.sourceName}</HandoverField>
        <HandoverField label="From location">{parcel.sourceLocationName}</HandoverField>
        <HandoverField label="To branch">{parcel.destinationName}</HandoverField>
        <HandoverField label="Pickup location">{parcel.pickupLocationName}</HandoverField>
      </div>
    </div>
  );
}
