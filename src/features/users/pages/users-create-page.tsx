import { UserForm } from '../components/user-form';
import { useCreateUserAction } from '../hooks/use-user-actions';

export function UsersCreatePage() {
  const { onSubmit, isSubmitting } = useCreateUserAction();

  return (
    <UserForm
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create user"
      submitButtonText="Create user"
    />
  );
}
