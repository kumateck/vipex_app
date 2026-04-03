import { useParams } from 'react-router-dom';
import { UsersCreatePage } from './users-create-page';
import { UsersEditPage } from './users-edit-page';

export function UsersCreateEditPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <UsersEditPage />;
  }

  return <UsersCreatePage />;
}
