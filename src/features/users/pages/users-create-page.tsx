import { UserForm } from '../components/user-form';
import { useCreateUserAction } from '../hooks/use-user-actions';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function UsersCreatePage() {
  const { onSubmit, isSubmitting } = useCreateUserAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <UserForm
          mode="create"
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Create user"
          submitButtonText="Create user"
        />
      </div>
    </ScrollableWrapper>
  );
}
