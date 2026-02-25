import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateBranchMutation, useUpdateBranchMutation } from '../api/branches.api';
import type { BranchFormValues } from '../schemas/branch-form.schema';
import { getErrorMessage } from '../utils/branch-error';

export function useCreateBranchAction() {
  const navigate = useNavigate();
  const [createBranch, { isLoading: isSubmitting }] = useCreateBranchMutation();

  const onSubmit = async (values: BranchFormValues) => {
    try {
      await createBranch(values).unwrap();
      toast.success('Branch created successfully');
      navigate('/branches', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateBranchAction(id: string) {
  const navigate = useNavigate();
  const [updateBranch, { isLoading: isSubmitting }] = useUpdateBranchMutation();

  const onSubmit = async (values: BranchFormValues) => {
    try {
      await updateBranch({ id, body: values }).unwrap();
      toast.success('Branch updated successfully');
      navigate('/branches', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}
