type LocationOption = { id: string; branchId?: string; canReceive?: boolean; isDeleted?: boolean };
export function getRequiredPickupLocationError(input: {
  destinationId: string;
  pickupLocationId: string;
  options: readonly LocationOption[];
  loading?: boolean;
  failed?: boolean;
}) {
  if (!input.destinationId) return 'Select a destination branch';
  if (input.loading) return 'Wait for pickup locations to finish loading';
  if (input.failed) return 'Pickup locations could not load. Retry before continuing';
  if (!input.options.length)
    return 'No receiving pickup location is available for this destination';
  const selected = input.options.find((location) => location.id === input.pickupLocationId);
  if (
    !selected ||
    selected.isDeleted ||
    selected.canReceive === false ||
    (selected.branchId !== undefined && selected.branchId !== input.destinationId)
  )
    return 'Select a valid pickup location';
  return null;
}
