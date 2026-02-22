/**
 * Create location: uses locations API (useCreateLocationMutation).
 */
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { type CreateLocationSchema } from '../schema';
import { useCreateLocationMutation } from '@/features/locations/api';
import { LocationForm } from '@/features/locations/LocationForm';

const toOptional = (v: string | undefined) => (v?.trim() ? v.trim() : undefined);

const CreateLocationPage = () => {
  const navigate = useNavigate();
  const [createLocation, { isLoading: isSubmitting }] = useCreateLocationMutation();

  const onSubmit = async (data: CreateLocationSchema) => {
    try {
      await createLocation({
        name: data.name.trim(),
        branchId: data.branchId.trim(),
      }).unwrap();
      toast.success('Location created successfully');
      navigate('/locations', { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <LocationForm
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      title="Create location"
      submitButtonText="Create location"
    />
  );
};

export default CreateLocationPage;
