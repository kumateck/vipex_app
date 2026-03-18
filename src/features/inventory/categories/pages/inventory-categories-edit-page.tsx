import { useNavigate, useParams } from 'react-router-dom';
import { useGetInventoryCategoryQuery } from '../api/inventory-categories.api';
import { InventoryCategoryForm } from '../components/inventory-category-form';
import { InventoryCategoryFormSkeleton } from '../components/inventory-category-form-skeleton';
import { InventoryCategoryLoadError } from '../components/inventory-category-load-error';
import { useUpdateInventoryCategoryAction } from '../hooks/use-inventory-category-actions';
import { getInventoryCategoryErrorMessage } from '../utils/inventory-category-error';

export function InventoryCategoriesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/inventory/categories');

  const { data: category, isLoading, isError, error } = useGetInventoryCategoryQuery(id ?? '', {
    skip: !id,
  });
  const { onSubmit, isSubmitting } = useUpdateInventoryCategoryAction(id ?? '');

  if (isError) {
    return (
      <InventoryCategoryLoadError
        message={getInventoryCategoryErrorMessage(error, 'Failed to load product category')}
        onBack={handleBack}
      />
    );
  }

  if (!id) {
    return <InventoryCategoryLoadError message="Invalid product category id" onBack={handleBack} />;
  }

  if (isLoading || !category) {
    return <InventoryCategoryFormSkeleton />;
  }

  return (
    <InventoryCategoryForm
      mode="edit"
      initialData={category}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Edit product category"
      submitButtonText="Save changes"
    />
  );
}
