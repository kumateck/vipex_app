import type { ParcelFullDetails } from '@mobile/types/parcels';
import { formatDate, personName } from '../utils';
import { ParcelDetailCard } from './parcel-detail-card';

/** Warns that the parcel was deleted, by whom and why, before staff act on it. */
export function ParcelDeletedNotice({ details }: { details: ParcelFullDetails }) {
  const { parcel, userNames } = details;
  if (!parcel.isDeleted) return null;
  return (
    <ParcelDetailCard
      title="Deleted parcel: consult the person before proceeding"
      rows={[
        ['Deleted By', personName(userNames, parcel.deletedBy)],
        ['Deleted At', formatDate(parcel.deletedAt)],
        ['Reason', parcel.deleteReason?.trim() || 'No reason provided'],
      ]}
    />
  );
}
