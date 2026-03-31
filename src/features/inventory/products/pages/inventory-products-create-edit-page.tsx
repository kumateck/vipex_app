import { useParams } from 'react-router-dom';
import { InventoryProductsCreatePage } from './inventory-products-create-page';
import { InventoryProductsEditPage } from './inventory-products-edit-page';

export function InventoryProductsCreateEditPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <InventoryProductsEditPage />;
  }

  return <InventoryProductsCreatePage />;
}
