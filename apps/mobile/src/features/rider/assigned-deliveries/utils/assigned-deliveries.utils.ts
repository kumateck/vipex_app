import type { RiderDoorstepRecord } from '@mobile/types/parcels';

export function filterAssignedDeliveries(rows: RiderDoorstepRecord[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return rows;

  return rows.filter((row) => {
    const searchable = [
      row.bookingCode,
      row.trackingCode,
      row.receiverName,
      row.receiverPhone,
      row.dropoffAddress,
      row.parcelDetails,
      row.parcelContent,
    ];
    return searchable.some((value) => value?.toLowerCase().includes(query));
  });
}

export function getExpectedCollectionPsw(row: RiderDoorstepRecord) {
  return getOutstandingPrincipalPsw(row) + getOutstandingDeliveryFeePsw(row);
}

export function getTotalExpectedCollectionPsw(rows: RiderDoorstepRecord[]) {
  return rows.reduce((total, row) => total + getExpectedCollectionPsw(row), 0);
}

export function getOutstandingPrincipalPsw(row: RiderDoorstepRecord) {
  return Math.max(row.outstandingPrincipalPsw ?? row.plannedToBePaidPsw ?? 0, 0);
}

export function getOutstandingDeliveryFeePsw(row: RiderDoorstepRecord) {
  return Math.max(row.outstandingDeliveryFeePsw ?? row.deliveryFeePsw ?? 0, 0);
}

export function getRiderCollectedPrincipalPsw(row: RiderDoorstepRecord) {
  const collectableAtCompletion = Math.max(
    row.principalCollectableAtCompletionPsw ?? getOutstandingPrincipalPsw(row),
    0,
  );
  if (!row.riderCollectionRecordedAt) return collectableAtCompletion;
  return Math.min(Math.max(row.riderCollectedPrincipalPsw ?? 0, 0), collectableAtCompletion);
}

export function getRiderCollectedDeliveryFeePsw(row: RiderDoorstepRecord) {
  const collectableAtCompletion = Math.max(
    row.deliveryFeeCollectableAtCompletionPsw ?? row.deliveryFeePsw ?? 0,
    0,
  );
  if (!row.riderCollectionRecordedAt) return collectableAtCompletion;
  return Math.min(Math.max(row.riderCollectedDeliveryFeePsw ?? 0, 0), collectableAtCompletion);
}
