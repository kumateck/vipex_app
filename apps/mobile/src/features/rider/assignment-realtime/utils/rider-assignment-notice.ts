export function getRiderAssignmentNotice(count: number) {
  return count === 1
    ? 'A new parcel has been assigned to your route.'
    : `${count} new parcels have been assigned to your route.`;
}
