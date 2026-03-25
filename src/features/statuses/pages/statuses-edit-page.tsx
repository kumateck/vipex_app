import { useNavigate, useParams } from 'react-router-dom';
import { useGetStatusQuery } from '../api/statuses.api';
import { StatusForm } from '../components/status-form';
import { StatusFormSkeleton } from '../components/status-form-skeleton';
import { StatusLoadError } from '../components/status-load-error';
import { useUpdateStatusAction } from '../hooks/use-status-actions';
import { getStatusErrorMessage } from '../utils/status-error';

export function StatusesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/statuses');
  const { data: status, isLoading, isError, error } = useGetStatusQuery(id ?? '', { skip: !id });
  const { onSubmit, isSubmitting } = useUpdateStatusAction(id ?? '');

  if (isError) {
    return <StatusLoadError message={getStatusErrorMessage(error, 'Failed to load status')} onBack={handleBack} />;
  }

  if (!id) {
    return <StatusLoadError message="Invalid status id" onBack={handleBack} />;
  }

  if (isLoading || !status) {
    return <StatusFormSkeleton />;
  }

  return (
    <StatusForm
      mode="edit"
      initialData={status}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Edit status"
      submitButtonText="Save changes"
    />
  );
}
