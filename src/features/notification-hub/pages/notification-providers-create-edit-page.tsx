import { useParams } from 'react-router-dom';
import { NotificationProvidersCreatePage } from './notification-providers-create-page';
import { NotificationProvidersEditPage } from './notification-providers-edit-page';

export function NotificationProvidersCreateEditPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <NotificationProvidersEditPage />;
  }

  return <NotificationProvidersCreatePage />;
}
