import { useParams } from 'react-router-dom';
import { NotificationTemplatesCreatePage } from './notification-templates-create-page';
import { NotificationTemplatesEditPage } from './notification-templates-edit-page';

export function NotificationTemplatesCreateEditPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <NotificationTemplatesEditPage />;
  }

  return <NotificationTemplatesCreatePage />;
}
