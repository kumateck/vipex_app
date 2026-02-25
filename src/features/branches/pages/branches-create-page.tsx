import { BranchForm } from '../components/branch-form';
import { useCreateBranchAction } from '../hooks/use-branch-actions';

export function BranchesCreatePage() {
  const { onSubmit, isSubmitting } = useCreateBranchAction();

  return (
    <BranchForm
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create branch"
      submitButtonText="Create branch"
    />
  );
}
