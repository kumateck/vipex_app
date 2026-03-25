import { useNavigate, useParams } from 'react-router-dom';
import { useGetUserQuery } from '../api/users.api';
import { UserForm } from '../components/user-form';
import { UserFormSkeleton } from '../components/user-form-skeleton';
import { UserLoadError } from '../components/user-load-error';
import { useUpdateUserAction } from '../hooks/use-user-actions';
import { getUserErrorMessage } from '../utils/user-error';

export function UsersEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/users');
  const { data: user, isLoading, isError, error } = useGetUserQuery(id ?? '', { skip: !id });
  const { onSubmit, isSubmitting } = useUpdateUserAction(id ?? '');

  if (isError) {
    return <UserLoadError message={getUserErrorMessage(error, 'Failed to load user')} onBack={handleBack} />;
  }

  if (!id) {
    return <UserLoadError message="Invalid user id" onBack={handleBack} />;
  }

  if (isLoading || !user) {
    return <UserFormSkeleton />;
  }

  return (
    <UserForm
      mode="edit"
      initialData={user}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Edit user"
      submitButtonText="Save changes"
    />
  );
}
