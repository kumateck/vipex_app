import { useNavigate, useParams } from 'react-router-dom';
import { useGetInventoryLocationQuery } from '../api/inventory-locations.api';
import { InventoryLocationForm } from '../components/inventory-location-form';
import { InventoryLocationFormSkeleton } from '../components/inventory-location-form-skeleton';
import { InventoryLocationLoadError } from '../components/inventory-location-load-error';
import { useUpdateInventoryLocationAction } from '../hooks/use-inventory-location-actions';
import { getInventoryLocationErrorMessage } from '../utils/inventory-location-error';

export function InventoryLocationsEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/inventory/locations');
  const { data: location, isLoading, isError, error } = useGetInventoryLocationQuery(id ?? '', {
    skip: !id,
  });
  const { onSubmit, isSubmitting } = useUpdateInventoryLocationAction(id ?? '');

  if (isError) {
    return (
      <InventoryLocationLoadError
        message={getInventoryLocationErrorMessage(error, 'Failed to load inventory location')}
        onBack={handleBack}
      />
    );
  }

  if (!id) {
    return <InventoryLocationLoadError message="Invalid inventory location id" onBack={handleBack} />;
  }

  if (isLoading || !location) {
    return <InventoryLocationFormSkeleton />;
  }

  return (
    <InventoryLocationForm
      mode="edit"
      initialData={location}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Edit inventory location"
      submitButtonText="Save changes"
    />
  );
}
