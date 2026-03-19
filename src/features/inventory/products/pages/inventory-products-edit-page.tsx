import { useNavigate, useParams } from 'react-router-dom';
import { useGetInventoryProductQuery } from '../api/inventory-products.api';
import { InventoryProductForm } from '../components/inventory-product-form';
import { InventoryProductFormSkeleton } from '../components/inventory-product-form-skeleton';
import { InventoryProductLoadError } from '../components/inventory-product-load-error';
import { useUpdateInventoryProductAction } from '../hooks/use-inventory-product-actions';
import { getInventoryProductErrorMessage } from '../utils/inventory-product-error';

export function InventoryProductsEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/inventory/products');
  const { data: product, isLoading, isError, error } = useGetInventoryProductQuery(id ?? '', {
    skip: !id,
  });
  const { onSubmit, isSubmitting } = useUpdateInventoryProductAction(id ?? '');

  if (isError) {
    return (
      <InventoryProductLoadError
        message={getInventoryProductErrorMessage(error, 'Failed to load inventory product')}
        onBack={handleBack}
      />
    );
  }

  if (!id) {
    return <InventoryProductLoadError message="Invalid inventory product id" onBack={handleBack} />;
  }

  if (isLoading || !product) {
    return <InventoryProductFormSkeleton />;
  }

  return (
    <InventoryProductForm
      mode="edit"
      initialData={product}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Edit inventory product"
      submitButtonText="Save changes"
    />
  );
}
