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
  const [createInventoryLocation, { isLoading: isSubmitting }] = useCreateInventoryLocationMutation();

  const onSubmit = async (values: CreateInventoryLocationFormValues) => {
    try {
      await createInventoryLocation(values).unwrap();
      toast.success('Inventory location created successfully');
      navigate('/inventory/locations', { replace: true });
    } catch (error) {
      toast.error(getInventoryLocationErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateInventoryLocationAction(id: string) {
  const navigate = useNavigate();
  const [updateInventoryLocation, { isLoading: isSubmitting }] = useUpdateInventoryLocationMutation();

  const onSubmit = async (values: EditInventoryLocationFormValues) => {
    try {
      await updateInventoryLocation({ id, body: values }).unwrap();
      toast.success('Inventory location updated successfully');
      navigate('/inventory/locations', { replace: true });
    } catch (error) {
      toast.error(getInventoryLocationErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}
