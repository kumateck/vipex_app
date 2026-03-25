import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useCreateInventoryLocationMutation,
  useUpdateInventoryLocationMutation,
} from '../api/inventory-locations.api';
import type {
  CreateInventoryLocationFormValues,
  EditInventoryLocationFormValues,
} from '../schemas/inventory-location-form.schema';
import { getInventoryLocationErrorMessage } from '../utils/inventory-location-error';

export function useCreateInventoryLocationAction() {
  const navigate = useNavigate();
  const submitLockRef = useRef(false);
  const [createInventoryLocation, { isLoading: isSubmitting }] = useCreateInventoryLocationMutation();

  const onSubmit = async (values: CreateInventoryLocationFormValues) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      await createInventoryLocation(values).unwrap();
      toast.success('Inventory location created successfully');
      navigate('/inventory/locations', { replace: true });
    } catch (error) {
      toast.error(getInventoryLocationErrorMessage(error));
    } finally {
      submitLockRef.current = false;
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateInventoryLocationAction(id: string) {
  const navigate = useNavigate();
  const submitLockRef = useRef(false);
  const [updateInventoryLocation, { isLoading: isSubmitting }] = useUpdateInventoryLocationMutation();

  const onSubmit = async (values: EditInventoryLocationFormValues) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      await updateInventoryLocation({ id, body: values }).unwrap();
      toast.success('Inventory location updated successfully');
      navigate('/inventory/locations', { replace: true });
    } catch (error) {
      toast.error(getInventoryLocationErrorMessage(error));
    } finally {
      submitLockRef.current = false;
    }
  };

  return { onSubmit, isSubmitting };
}
