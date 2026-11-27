import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { normalizeDestinationChangeReason } from '@/shared/shipments/parcel-destination-change';
import { useChangeParcelDestinationMutation, useParcelDestinationOptionsQuery } from '../services';

const EMPTY: never[] = [];

/** Destination change form state for one parcel; options load only while the dialog is open. */
export function useParcelDestinationChange(parcelId: string, open: boolean, onDone: () => void) {
  const query = useParcelDestinationOptionsQuery(parcelId, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  });
  const options = query.currentData;
  const [branchSelection, setBranchSelection] = useState<string>();
  const [locationSelection, setLocationSelection] = useState<string>();
  const [reason, setReason] = useState('');
  const [change, { isLoading: saving }] = useChangeParcelDestinationMutation();

  const branches = options?.branches ?? EMPTY;
  const destinationId = branchSelection ?? options?.destinationId ?? '';
  const locations = useMemo(
    () => branches.find((branch) => branch.id === destinationId)?.locations ?? EMPTY,
    [branches, destinationId],
  );
  const preferredLocation =
    locationSelection ??
    (destinationId === options?.destinationId ? options?.pickupLocationId : undefined);
  const pickupLocationId =
    locations.find((location) => location.id === preferredLocation)?.id ??
    (locations.length === 1 ? locations[0]!.id : '');

  const setDestinationId = useCallback((id: string) => {
    setBranchSelection(id);
    setLocationSelection(undefined);
  }, []);

  const unchanged =
    destinationId === options?.destinationId && pickupLocationId === options?.pickupLocationId;
  const validReason = normalizeDestinationChangeReason(reason);
  const canSave =
    Boolean(options && !options.restriction && destinationId && validReason) &&
    !unchanged &&
    (locations.length === 0 || Boolean(pickupLocationId)) &&
    !saving;

  const reset = useCallback(() => {
    setBranchSelection(undefined);
    setLocationSelection(undefined);
    setReason('');
  }, []);

  const save = useCallback(async () => {
    if (!options || !canSave || !validReason) return;
    try {
      await change({
        parcelId,
        destinationId,
        pickupLocationId: pickupLocationId || null,
        expectedDestinationId: options.destinationId,
        expectedPickupLocationId: options.pickupLocationId,
        reason: validReason,
      }).unwrap();
      toast.success('Parcel destination updated');
      reset();
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not change parcel destination'));
    }
  }, [
    canSave,
    change,
    destinationId,
    onDone,
    options,
    parcelId,
    pickupLocationId,
    reset,
    validReason,
  ]);

  return {
    isLoading: query.isFetching && !options,
    isError: query.isError,
    restriction: options?.restriction ?? null,
    phase: options?.phase ?? null,
    branches,
    locations,
    destinationId,
    setDestinationId,
    pickupLocationId,
    setPickupLocationId: setLocationSelection,
    reason,
    setReason,
    canSave,
    saving,
    save,
    reset,
  };
}
