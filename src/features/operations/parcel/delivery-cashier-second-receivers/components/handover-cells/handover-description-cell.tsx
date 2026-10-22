import type { ParcelSearchRow } from '../../../api/parcel.api';
import { HandoverField } from './handover-field';

export function HandoverDescriptionCell({ parcel }: { parcel: ParcelSearchRow }) {
  return (
    <div className="w-56 max-w-full space-y-1 whitespace-normal break-words text-xs">
      <HandoverField label="Details">{parcel.parcelDetails}</HandoverField>
      <HandoverField label="Content">{parcel.parcelContent}</HandoverField>
    </div>
  );
}
