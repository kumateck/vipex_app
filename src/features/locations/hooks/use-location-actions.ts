import { useRef } from 'react';
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
  const submitLockRef = useRef(false);
  const [createLocation, { isLoading: isSubmitting }] = useCreateLocationMutation();

  const onSubmit = async (values: CreateLocationFormValues) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      await createLocation(values).unwrap();
      toast.success('Location created successfully');
      navigate('/locations', { replace: true });
    } catch (error) {
      toast.error(getLocationErrorMessage(error));
    } finally {
      submitLockRef.current = false;
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateLocationAction(id: string) {
  const navigate = useNavigate();
  const submitLockRef = useRef(false);
  const [updateLocation, { isLoading: isSubmitting }] = useUpdateLocationMutation();

  const onSubmit = async (values: EditLocationFormValues) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      await updateLocation({ id, body: values }).unwrap();
      toast.success('Location updated successfully');
      navigate('/locations', { replace: true });
    } catch (error) {
      toast.error(getLocationErrorMessage(error));
    } finally {
      submitLockRef.current = false;
    }
  };

  return { onSubmit, isSubmitting };
}
