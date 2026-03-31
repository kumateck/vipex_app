import { useParams } from 'react-router-dom';
import { InventoryLocationsCreatePage } from './inventory-locations-create-page';
import { InventoryLocationsEditPage } from './inventory-locations-edit-page';

export function InventoryLocationsCreateEditPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <InventoryLocationsEditPage />;
  }

  return <InventoryLocationsCreatePage />;
}
