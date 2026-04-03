import { useParams } from 'react-router-dom';
import { InventoryCategoriesCreatePage } from './inventory-categories-create-page';
import { InventoryCategoriesEditPage } from './inventory-categories-edit-page';

export function InventoryCategoriesCreateEditPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <InventoryCategoriesEditPage />;
  }

  return <InventoryCategoriesCreatePage />;
}
