import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateLocationMutation, useUpdateLocationMutation } from '../api/locations.api';
import type {
  CreateLocationFormValues,
  EditLocationFormValues,
} from '../schemas/location-form.schema';
import { getLocationErrorMessage } from '../utils/location-error';

export function useCreateLocationAction() {
  const navigate = useNavigate();
  const [createLocation, { isLoading: isSubmitting }] = useCreateLocationMutation();

  const onSubmit = async (values: CreateLocationFormValues) => {
    try {
      await createLocation(values).unwrap();
      toast.success('Location created successfully');
      navigate('/locations', { replace: true });
    } catch (error) {
      toast.error(getLocationErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateLocationAction(id: string) {
  const navigate = useNavigate();
  const [updateLocation, { isLoading: isSubmitting }] = useUpdateLocationMutation();

  const onSubmit = async (values: EditLocationFormValues) => {
    try {
      await updateLocation({ id, body: values }).unwrap();
      toast.success('Location updated successfully');
      navigate('/locations', { replace: true });
    } catch (error) {
      toast.error(getLocationErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}
