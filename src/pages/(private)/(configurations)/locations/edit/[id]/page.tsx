/**
 * Edit location: uses locations API hooks. Error and loading are separate components.
 */
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { type EditLocationSchema } from '../../schema';
import { useGetLocationQuery, useUpdateLocationMutation } from '@/features/locations/api';
import { LoadError, FormSkeleton } from '@/components/ui';
import { LocationForm } from '@/features/locations/LocationForm';

const toOptional = (v: string | null | undefined) => (v?.trim() ? v.trim() : undefined);

const EditLocationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: location, isLoading, isError, error } = useGetLocationQuery(id ?? '', { skip: !id });
  const [updateLocation, { isLoading: isSubmitting }] = useUpdateLocationMutation();

  const onSubmit = async (data: EditLocationSchema) => {
    if (!id) return;
    try {
      await updateLocation({
        id,
        body: {
          name: data.name.trim(),
        },
      }).unwrap();
      toast.success('Location updated successfully');
      navigate('/locations', { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleBack = () => navigate('/locations');

  if (!id) {
    return <LoadError message="Invalid location id" onBack={handleBack} />;
  }

  if (isError) {
    const message =
      error && typeof (error as { data?: { message?: string } }).data?.message === 'string'
        ? (error as { data: { message: string } }).data.message
        : 'Failed to load location';
    return <LoadError message={message} onBack={handleBack} />;
  }

  if (isLoading || !location) {
    return <FormSkeleton />;
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
};

export default EditLocationPage;
