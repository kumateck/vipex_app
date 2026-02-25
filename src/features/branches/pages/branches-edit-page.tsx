import { useNavigate, useParams } from 'react-router-dom';
import { useGetBranchQuery } from '../api/branches.api';
import { BranchForm } from '../components/branch-form';
import { BranchFormSkeleton } from '../components/branch-form-skeleton';
import { BranchLoadError } from '../components/branch-load-error';
import { useUpdateBranchAction } from '../hooks/use-branch-actions';
import { getErrorMessage } from '../utils/branch-error';

export function BranchesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/branches');
  const { data: branch, isLoading, isError, error } = useGetBranchQuery(id ?? '', { skip: !id });
  const { onSubmit, isSubmitting } = useUpdateBranchAction(id ?? '');

  if (isError) {
    return <BranchLoadError message={getErrorMessage(error, 'Failed to load branch')} onBack={handleBack} />;
  }

  if (!id) {
    return <BranchLoadError message="Invalid branch id" onBack={handleBack} />;
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
}
