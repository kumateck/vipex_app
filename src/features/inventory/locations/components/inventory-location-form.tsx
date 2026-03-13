import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches';
import {
  createInventoryLocationSchema,
  editInventoryLocationSchema,
  type CreateInventoryLocationFormValues,
  type EditInventoryLocationFormValues,
} from '../schemas/inventory-location-form.schema';
import type { InventoryLocation } from '../types/inventory-location.types';

interface InventoryLocationFormBaseProps {
  initialData?: Partial<InventoryLocation>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

interface CreateInventoryLocationFormProps extends InventoryLocationFormBaseProps {
  mode: 'create';
  onSubmit: (data: CreateInventoryLocationFormValues) => Promise<void>;
}

interface EditInventoryLocationFormProps extends InventoryLocationFormBaseProps {
  mode: 'edit';
  onSubmit: (data: EditInventoryLocationFormValues) => Promise<void>;
}

type InventoryLocationFormProps = CreateInventoryLocationFormProps | EditInventoryLocationFormProps;
type InventoryLocationFormValues = { name: string; branchId?: string; description?: string };

export function InventoryLocationForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}: InventoryLocationFormProps) {
  const navigate = useNavigate();
  const schema = mode === 'create' ? createInventoryLocationSchema : editInventoryLocationSchema;
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data: branchesData, isLoading: isLoadingBranches } = useListBranchOptionsQuery(
    { companyId },
    { skip: mode !== 'create' },
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryLocationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'create' ? { name: '', branchId: '', description: '' } : { name: '', description: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name ?? '',
        description: initialData.description ?? '',
      });
      return;
    }
    reset({ name: '', branchId: '', description: '' });
  }, [initialData, mode, reset]);

  const submit = async (values: InventoryLocationFormValues) => {
    if (mode === 'create') {
      await onSubmit({
        name: values.name,
        branchId: values.branchId ?? '',
        description: values.description ?? '',
      });
      return;
    }
    await onSubmit({
      name: values.name,
      description: values.description ?? '',
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" placeholder="Location name" aria-invalid={!!errors.name} {...register('name')} />
                {errors.name?.message ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
              </Field>
              {mode === 'create' ? (
                <Field>
                  <FieldLabel htmlFor="branchId">Branch</FieldLabel>
                  <Controller
                    control={control}
                    name="branchId"
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="branchId"
                          aria-invalid={!!errors.branchId}
                          disabled={isLoadingBranches}
                        >
                          <SelectValue
                            placeholder={isLoadingBranches ? 'Loading branches...' : 'Select branch'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(branchesData ?? []).map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.branchId?.message ? (
                    <p className="text-sm text-destructive">{errors.branchId.message}</p>
                  ) : null}
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Input
                  id="description"
                  placeholder="Optional"
                  aria-invalid={!!errors.description}
                  {...register('description')}
                />
                {errors.description?.message ? (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                ) : null}
              </Field>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? `${mode === 'create' ? 'Creating...' : 'Saving...'}` : submitButtonText}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/inventory/locations')}>
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
