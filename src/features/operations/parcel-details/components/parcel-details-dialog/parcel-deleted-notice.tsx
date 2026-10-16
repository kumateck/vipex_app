import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import type { ParcelHistoryEvent } from '../../types';
import { personName } from '../../utils/parcel-details-format';

/** Warns staff that a parcel was deleted, by whom and why, before they act on it. */
export function ParcelDeletedNotice({
  details,
  history,
}: {
  details: ParcelFullDetails;
  history: ParcelHistoryEvent[];
}) {
  const { parcel } = details;
  if (!parcel.isDeleted) return null;
  const deletion = history.findLast((event) => event.title === 'Parcel deleted');
  const reason =
    parcel.deleteReason?.trim() ||
    deletion?.description?.replace(/^Reason: /, '') ||
    'No reason provided';
  const deletedBy = parcel.deletedBy
    ? personName(details.userNames ?? {}, parcel.deletedBy)
    : (deletion?.actorName ?? 'Unknown user');

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
      This parcel was deleted by <strong>{deletedBy}</strong> for reason: <strong>{reason}</strong>.
      Please consult the person before proceeding.
    </div>
  );
}
