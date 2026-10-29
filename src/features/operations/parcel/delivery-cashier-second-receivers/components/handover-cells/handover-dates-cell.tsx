import type { ParcelSearchRow } from '../../../api/parcel.api';
import { formatHandoverDate } from '../../utils';
import { HandoverField } from './handover-field';

export function HandoverDatesCell({ parcel }: { parcel: ParcelSearchRow }) {
  return (
    <div className="w-40 max-w-full space-y-1 text-xs">
      <HandoverField label="Created">{formatHandoverDate(parcel.createdAt)}</HandoverField>
      <HandoverField label="Received">{formatHandoverDate(parcel.receivedAt)}</HandoverField>
    </div>
  );
}
