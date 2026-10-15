import { useState } from 'react';
import { toast } from 'sonner';
import {
  useListShelfPickerStaffQuery,
  useReassignShelfPickupMutation,
  getErrorMessage,
} from '../services';
import type { ShelfPickupParcel, ShelfPickupScope } from '../types';

export function useShelfPickupReassignmentForm(
  parcel: ShelfPickupParcel,
  scope: ShelfPickupScope,
  onDone: () => void,
) {
  const [staffId, setStaffId] = useState('');
  const staff = useListShelfPickerStaffQuery(scope);
  const [reassign, mutation] = useReassignShelfPickupMutation();
  const canSave = Boolean(
    staffId &&
      staffId !== parcel.pickerStaffId &&
      staff.currentData?.some((option) => option.id === staffId) &&
      !staff.isFetching &&
      !staff.isError &&
      !mutation.isLoading,
  );
  const save = async () => {
    if (!canSave) return;
    try {
      await reassign({
        parcelId: parcel.id,
        userId: staffId,
        expectedPickerStaffId: parcel.pickerStaffId,
      }).unwrap();
      toast.success('Shelf pickup reassigned');
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not reassign shelf pickup'));
      // A stale assignment requires selecting the parcel again from fresh results.
      if (error && typeof error === 'object' && 'status' in error && error.status === 409) onDone();
    }
  };
  return { staffId, setStaffId, staff, canSave, save, isSaving: mutation.isLoading };
}
