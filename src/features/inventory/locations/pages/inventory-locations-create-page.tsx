import { InventoryLocationForm } from '../components/inventory-location-form';
import { useCreateInventoryLocationAction } from '../hooks/use-inventory-location-actions';

export function InventoryLocationsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateInventoryLocationAction();

  return (
    <InventoryLocationForm
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create inventory location"
      submitButtonText="Create inventory location"
    />
  );
}
