import { BranchForm } from '../components/branch-form';
import { useCreateBranchAction } from '../hooks/use-branch-actions';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function BranchesCreatePage() {
  const { onSubmit, isSubmitting } = useCreateBranchAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <BranchForm
          mode="create"
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Create branch"
          submitButtonText="Create branch"
        />
      </div>
    </ScrollableWrapper>
  );
}
