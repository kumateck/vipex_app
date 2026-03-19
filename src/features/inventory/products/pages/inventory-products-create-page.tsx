import { InventoryProductForm } from '../components/inventory-product-form';
import { useCreateInventoryProductAction } from '../hooks/use-inventory-product-actions';

export function InventoryProductsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateInventoryProductAction();

  return (
    <InventoryProductForm
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create inventory product"
      submitButtonText="Create inventory product"
    />
  );
}
