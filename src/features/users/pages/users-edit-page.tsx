import { useNavigate, useParams } from 'react-router-dom';
import { useGetUserQuery } from '../api/users.api';
import { UserForm } from '../components/user-form';
import { UserFormSkeleton } from '../components/user-form-skeleton';
import { UserLoadError } from '../components/user-load-error';
import { useUpdateUserAction } from '../hooks/use-user-actions';
import { getUserErrorMessage } from '../utils/user-error';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function UsersEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/users');
  const { data: user, isLoading, isError, error } = useGetUserQuery(id ?? '', { skip: !id });
  const { onSubmit, isSubmitting } = useUpdateUserAction(id ?? '');

  if (isError) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <UserLoadError
            message={getUserErrorMessage(error, 'Failed to load user')}
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
          <UserLoadError message="Invalid user id" onBack={handleBack} />
        </div>
      </ScrollableWrapper>
    );
  }

  if (isLoading || !user) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <UserFormSkeleton />
        </div>
      </ScrollableWrapper>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <UserForm
          mode="edit"
          initialData={user}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Edit user"
          submitButtonText="Save changes"
        />
      </div>
    </ScrollableWrapper>
  );
}
