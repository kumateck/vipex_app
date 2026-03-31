import { InventoryCategoryForm } from '../components/inventory-category-form';
import { useCreateInventoryCategoryAction } from '../hooks/use-inventory-category-actions';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function InventoryCategoriesCreatePage() {
  const { onSubmit, isSubmitting } = useCreateInventoryCategoryAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <InventoryCategoryForm
          mode="create"
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Create product category"
          submitButtonText="Create category"
        />
      </div>
    </ScrollableWrapper>
  );
}
