import { useNavigate, useParams } from 'react-router-dom';
import { useGetInventoryLocationQuery } from '../api/inventory-locations.api';
import { InventoryLocationForm } from '../components/inventory-location-form';
import { InventoryLocationFormSkeleton } from '../components/inventory-location-form-skeleton';
import { InventoryLocationLoadError } from '../components/inventory-location-load-error';
import { useUpdateInventoryLocationAction } from '../hooks/use-inventory-location-actions';
import { getInventoryLocationErrorMessage } from '../utils/inventory-location-error';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function InventoryLocationsEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/inventory/locations');
  const {
    data: location,
    isLoading,
    isError,
    error,
  } = useGetInventoryLocationQuery(id ?? '', {
    skip: !id,
  });
  const { onSubmit, isSubmitting } = useUpdateInventoryLocationAction(id ?? '');

  if (isError) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <InventoryLocationLoadError
            message={getInventoryLocationErrorMessage(error, 'Failed to load inventory location')}
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
          <InventoryLocationLoadError message="Invalid inventory location id" onBack={handleBack} />
        </div>
      </ScrollableWrapper>
    );
  }

  if (isLoading || !location) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <InventoryLocationFormSkeleton />
        </div>
      </ScrollableWrapper>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <InventoryLocationForm
          mode="edit"
          initialData={location}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Edit inventory location"
          submitButtonText="Save changes"
        />
      </div>
    </ScrollableWrapper>
  );
}
