import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createLocationSchema, editLocationSchema, type CreateLocationSchema, type EditLocationSchema } from '../../pages/(private)/(configurations)/locations/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useListBranchesQuery } from '@/features/branches/api';
import { Spinner } from '@/components/ui';

interface Location {
  id: string;
  name: string;
  branchId: string;
}

interface LocationFormBaseProps {
  initialData?: Partial<Location>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

interface CreateLocationFormProps extends LocationFormBaseProps {
  mode: 'create';
  onSubmit: (data: CreateLocationSchema) => Promise<void>;
}

interface EditLocationFormProps extends LocationFormBaseProps {
  mode: 'edit';
  onSubmit: (data: EditLocationSchema) => Promise<void>;
}

type LocationFormProps = CreateLocationFormProps | EditLocationFormProps;

type LocationFormValues = {
  name: string;
  branchId?: string;
};

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
  const { data: branchesData, isLoading: isLoadingBranches } = useListBranchesQuery(
    { limit: 50 },
    { skip: mode !== 'create' },
  );
  const branchOptions = branchesData?.data ?? [];

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'create' 
      ? { name: '', branchId: '' }
      : { name: '' },
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

  const handleFormSubmit = async (data: LocationFormValues) => {
    if (mode === 'create') {
      await onSubmit({
        name: data.name,
        branchId: data.branchId ?? '',
      });
      return;
    }

    await onSubmit({
      name: data.name,
    });
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
                  <FieldLabel htmlFor="branchId">Branch</FieldLabel>
                  <Controller
                    control={control}
                    name="branchId"
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger id="branchId" aria-invalid={!!errors.branchId} disabled={isLoadingBranches}>
                          <SelectValue placeholder={isLoadingBranches ? 'Loading branches...' : 'Select branch'} />
                        </SelectTrigger>
                        <SelectContent>
                          {branchOptions.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
