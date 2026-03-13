import { InventoryCategoryForm } from '../components/inventory-category-form';
import { useCreateInventoryCategoryAction } from '../hooks/use-inventory-category-actions';

export function InventoryCategoriesCreatePage() {
  const { onSubmit, isSubmitting } = useCreateInventoryCategoryAction();

  return (
    <InventoryCategoryForm
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create product category"
      submitButtonText="Create category"
    />
  );
}
