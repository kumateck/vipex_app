import { useParams } from 'react-router-dom';
import { LocationsCreatePage } from './locations-create-page';
import { LocationsEditPage } from './locations-edit-page';

export function LocationsCreateEditPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <LocationsEditPage />;
  }

  return <LocationsCreatePage />;
}
