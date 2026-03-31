import { useNavigate, useParams } from 'react-router-dom';
import { useGetInventoryCategoryQuery } from '../api/inventory-categories.api';
import { InventoryCategoryForm } from '../components/inventory-category-form';
import { InventoryCategoryFormSkeleton } from '../components/inventory-category-form-skeleton';
import { InventoryCategoryLoadError } from '../components/inventory-category-load-error';
import { useUpdateInventoryCategoryAction } from '../hooks/use-inventory-category-actions';
import { getInventoryCategoryErrorMessage } from '../utils/inventory-category-error';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function InventoryCategoriesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/inventory/categories');

  const {
    data: category,
    isLoading,
    isError,
    error,
  } = useGetInventoryCategoryQuery(id ?? '', {
    skip: !id,
  });
  const { onSubmit, isSubmitting } = useUpdateInventoryCategoryAction(id ?? '');

  if (isError) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <InventoryCategoryLoadError
            message={getInventoryCategoryErrorMessage(error, 'Failed to load product category')}
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
          <InventoryCategoryLoadError message="Invalid product category id" onBack={handleBack} />
        </div>
      </ScrollableWrapper>
    );
  }

  if (isLoading || !category) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <InventoryCategoryFormSkeleton />
        </div>
      </ScrollableWrapper>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <InventoryCategoryForm
          mode="edit"
          initialData={category}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Edit product category"
          submitButtonText="Save changes"
        />
      </div>
    </ScrollableWrapper>
  );
}
