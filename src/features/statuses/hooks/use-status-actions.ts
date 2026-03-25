import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateStatusMutation, useUpdateStatusMutation } from '../api/statuses.api';
import type { StatusFormValues } from '../schemas/status-form.schema';
import { getStatusErrorMessage } from '../utils/status-error';

export function useCreateStatusAction() {
  const navigate = useNavigate();
  const [createStatus, { isLoading: isSubmitting }] = useCreateStatusMutation();

  const onSubmit = async (values: StatusFormValues) => {
    try {
      await createStatus(values).unwrap();
      toast.success('Status created successfully');
      navigate('/statuses', { replace: true });
    } catch (error) {
      toast.error(getStatusErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateStatusAction(id: string) {
  const navigate = useNavigate();
  const [updateStatus, { isLoading: isSubmitting }] = useUpdateStatusMutation();

  const onSubmit = async (values: StatusFormValues) => {
    try {
      await updateStatus({ id, body: values }).unwrap();
      toast.success('Status updated successfully');
      navigate('/statuses', { replace: true });
    } catch (error) {
      toast.error(getStatusErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}
