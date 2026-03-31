import { useNavigate, useParams } from 'react-router-dom';
import { useGetBranchQuery } from '../api/branches.api';
import { BranchForm } from '../components/branch-form';
import { BranchFormSkeleton } from '../components/branch-form-skeleton';
import { BranchLoadError } from '../components/branch-load-error';
import { useUpdateBranchAction } from '../hooks/use-branch-actions';
import { getErrorMessage } from '../utils/branch-error';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function BranchesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/branches');
  const { data: branch, isLoading, isError, error } = useGetBranchQuery(id ?? '', { skip: !id });
  const { onSubmit, isSubmitting } = useUpdateBranchAction(id ?? '');

  if (isError) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <BranchLoadError
            message={getErrorMessage(error, 'Failed to load branch')}
            onBack={handleBack}
          />
        </div>
      </ScrollableWrapper>
    );
  }

  if (!id) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <BranchLoadError message="Invalid branch id" onBack={handleBack} />
        </div>
      </ScrollableWrapper>
    );
  }

  if (isLoading || !branch) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <BranchFormSkeleton />
        </div>
      </ScrollableWrapper>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <BranchForm
          mode="edit"
          initialData={branch}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Edit branch"
          submitButtonText="Save changes"
        />
      </div>
    </ScrollableWrapper>
  );
}
