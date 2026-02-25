import { LocationForm } from '../components/location-form';
import { useCreateLocationAction } from '../hooks/use-location-actions';

export function LocationsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateLocationAction();

  return (
    <LocationForm
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create location"
      submitButtonText="Create location"
    />
  );
}
