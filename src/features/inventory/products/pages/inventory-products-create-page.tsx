import { InventoryProductForm } from '../components/inventory-product-form';
import { useCreateInventoryProductAction } from '../hooks/use-inventory-product-actions';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function InventoryProductsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateInventoryProductAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <InventoryProductForm
          mode="create"
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Create inventory product"
          submitButtonText="Create inventory product"
        />
      </div>
    </ScrollableWrapper>
  );
}
