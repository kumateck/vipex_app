/**
 * Create branch: uses branches API (useCreateBranchMutation).
 */
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { type CreateBranchSchema } from '../schema';
import { useCreateBranchMutation } from '@/features/branches/api';
import { BranchForm } from '@/features/branches/BranchForm';

const toOptional = (v: string | undefined) => (v?.trim() ? v.trim() : undefined);

const CreateBranchPage = () => {
  const navigate = useNavigate();
  const [createBranch, { isLoading: isSubmitting }] = useCreateBranchMutation();

  const onSubmit = async (data: CreateBranchSchema) => {
    try {
      await createBranch({
        name: data.name.trim(),
        type: data.type.trim(),
        telephone: toOptional(data.telephone) ?? null,
        address: toOptional(data.address) ?? null,
        email: toOptional(data.email) ?? null,
      }).unwrap();
      toast.success('Branch created successfully');
      navigate('/branches', { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <BranchForm
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create branch"
      submitButtonText="Create branch"
    />
  );
};

export default CreateBranchPage;
