import { InventoryLocationForm } from '../components/inventory-location-form';
import { useCreateInventoryLocationAction } from '../hooks/use-inventory-location-actions';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function InventoryLocationsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateInventoryLocationAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <InventoryLocationForm
          mode="create"
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Create inventory location"
          submitButtonText="Create inventory location"
        />
      </div>
    </ScrollableWrapper>
  );
}
