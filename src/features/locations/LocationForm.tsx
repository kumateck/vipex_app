import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createLocationSchema, editLocationSchema, type CreateLocationSchema, type EditLocationSchema } from '../../pages/(private)/(configurations)/locations/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui';

interface Location {
  id: string;
  name: string;
  branchId: string;
}

interface LocationFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Location>;
  onSubmit: (data: CreateLocationSchema | EditLocationSchema) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

const toOptional = (v: string | undefined) => (v?.trim() ? v.trim() : undefined);

export const LocationForm: React.FC<LocationFormProps> = ({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}) => {
  const navigate = useNavigate();
  const schema = mode === 'create' ? createLocationSchema : editLocationSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateLocationSchema | EditLocationSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      branchId: mode === 'create' ? '' : undefined,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name ?? '',
      });
    } else if (mode === 'create') {
      reset({
        name: '',
        branchId: '',
      });
    }
  }, [initialData, mode, reset]);

  const handleFormSubmit = async (data: CreateLocationSchema | EditLocationSchema) => {
    await onSubmit(data);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Location name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name?.message && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </Field>
              {mode === 'create' && (
                <Field>
                  <FieldLabel htmlFor="branchId">Branch ID</FieldLabel>
                  <Input
                    id="branchId"
                    placeholder="Branch ID"
                    aria-invalid={!!errors.branchId}
                    {...register('branchId')}
                  />
                  {errors.branchId?.message && (
                    <p className="text-sm text-destructive">{errors.branchId.message}</p>
                  )}
                </Field>
              )}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? `${mode === 'create' ? 'Creating...' : 'Saving...'}` : submitButtonText}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/locations')}
                >
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
