import { StatusForm } from '../components/status-form';
import { useCreateStatusAction } from '../hooks/use-status-actions';

export function StatusesCreatePage() {
  const { onSubmit, isSubmitting } = useCreateStatusAction();

  return (
    <StatusForm
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create status"
      submitButtonText="Create status"
    />
  );
}
