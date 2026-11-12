import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteLocationOfficeMutation } from '@/features/operations/parcel-receiving-office';
import { getLocationErrorMessage } from '../utils/location-error';

export function useDeleteLocationOffice(locationId: string, officeId: string) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [deleteOffice, { isLoading }] = useDeleteLocationOfficeMutation();

  function onOpenChange(next: boolean) {
    if (isLoading) return;
    setOpen(next);
    setError('');
  }

  async function confirm() {
    if (isLoading) return;
    setError('');
    try {
      await deleteOffice({ locationId, officeId }).unwrap();
      setOpen(false);
      toast.success('Receiving office deleted');
    } catch (error) {
      setError(getLocationErrorMessage(error, 'Could not delete receiving office'));
    }
  }

  return { open, onOpenChange, error, isLoading, confirm };
}
