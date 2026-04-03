import { useNavigate, useParams } from 'react-router-dom';
import { useGetInventoryProductQuery } from '../api/inventory-products.api';
import { InventoryProductForm } from '../components/inventory-product-form';
import { InventoryProductFormSkeleton } from '../components/inventory-product-form-skeleton';
import { InventoryProductLoadError } from '../components/inventory-product-load-error';
import { useUpdateInventoryProductAction } from '../hooks/use-inventory-product-actions';
import { getInventoryProductErrorMessage } from '../utils/inventory-product-error';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function InventoryProductsEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/inventory/products');
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useGetInventoryProductQuery(id ?? '', {
    skip: !id,
  });
  const { onSubmit, isSubmitting } = useUpdateInventoryProductAction(id ?? '');

  if (isError) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <InventoryProductLoadError
            message={getInventoryProductErrorMessage(error, 'Failed to load inventory product')}
            onBack={handleBack}
          />
        </div>
      </ScrollableWrapper>
    );
  }

  if (!id) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <InventoryProductLoadError message="Invalid inventory product id" onBack={handleBack} />
        </div>
      </ScrollableWrapper>
    );
  }

  if (isLoading || !product) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <InventoryProductFormSkeleton />
        </div>
      </ScrollableWrapper>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <InventoryProductForm
          mode="edit"
          initialData={product}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Edit inventory product"
          submitButtonText="Save changes"
        />
      </div>
    </ScrollableWrapper>
  );
}
