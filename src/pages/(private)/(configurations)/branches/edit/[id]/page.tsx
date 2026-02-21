/**
 * Edit branch: uses branches API hooks. Error and loading are separate components.
 */
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { type EditBranchSchema } from '../../schema';
import { useGetBranchQuery, useUpdateBranchMutation } from '@/features/branches/api';
import { BranchLoadError } from '@/features/branches/BranchLoadError';
import { BranchFormSkeleton } from '@/features/branches/BranchFormSkeleton';
import { BranchForm } from '@/features/branches/BranchForm';

const toOptional = (v: string | null | undefined) => (v?.trim() ? v.trim() : undefined);

const EditBranchPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: branch, isLoading, isError, error } = useGetBranchQuery(id ?? '', { skip: !id });
  const [updateBranch, { isLoading: isSubmitting }] = useUpdateBranchMutation();

  const onSubmit = async (data: EditBranchSchema) => {
    if (!id) return;
    try {
      await updateBranch({
        id,
        body: {
          name: data.name.trim(),
          type: data.type.trim(),
          telephone: toOptional(data.telephone) ?? null,
          address: toOptional(data.address) ?? null,
          email: toOptional(data.email) ?? null,
        },
      }).unwrap();
      toast.success('Branch updated successfully');
      navigate('/branches', { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleBack = () => navigate('/branches');

  if (!id) {
    return <BranchLoadError message="Invalid branch id" onBack={handleBack} />;
  }

  if (isError) {
    const message =
      error && typeof (error as { data?: { message?: string } }).data?.message === 'string'
        ? (error as { data: { message: string } }).data.message
        : 'Failed to load branch';
    return <BranchLoadError message={message} onBack={handleBack} />;
  }

  if (isLoading || !branch) {
    return <BranchFormSkeleton />;
  }

  return (
    <BranchForm
      mode="edit"
      initialData={branch}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Edit branch"
      submitButtonText="Save changes"
    />
  );
};

export default EditBranchPage;
