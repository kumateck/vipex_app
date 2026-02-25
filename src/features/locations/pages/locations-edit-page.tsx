import { useNavigate, useParams } from 'react-router-dom';
import { useGetLocationQuery } from '../api/locations.api';
import { LocationForm } from '../components/location-form';
import { LocationFormSkeleton } from '../components/location-form-skeleton';
import { LocationLoadError } from '../components/location-load-error';
import { useUpdateLocationAction } from '../hooks/use-location-actions';
import { getLocationErrorMessage } from '../utils/location-error';

export function LocationsEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/locations');
  const { data: location, isLoading, isError, error } = useGetLocationQuery(id ?? '', { skip: !id });
  const { onSubmit, isSubmitting } = useUpdateLocationAction(id ?? '');

  if (isError) {
    return (
      <LocationLoadError message={getLocationErrorMessage(error, 'Failed to load location')} onBack={handleBack} />
    );
  }

  if (!id) {
    return <LocationLoadError message="Invalid location id" onBack={handleBack} />;
  }

  if (isLoading || !location) {
    return <LocationFormSkeleton />;
  }

  return (
    <LocationForm
      mode="edit"
      initialData={location}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Edit location"
      submitButtonText="Save changes"
    />
  );
}
