import { LocationForm } from '../components/location-form';
import { useCreateLocationAction } from '../hooks/use-location-actions';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function LocationsCreatePage() {
  const { onSubmit, isSubmitting } = useCreateLocationAction();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <LocationForm
          mode="create"
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Create location"
          submitButtonText="Create location"
        />
      </div>
    </ScrollableWrapper>
  );
}
