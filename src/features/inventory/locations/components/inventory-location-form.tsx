import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Spinner } from '@/components/ui';
import { normalizeOptionalFields } from '@/lib/optional-fields';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches';
import { InventoryLocationType } from '@/db/schemas/enums';
import { useListInventoryLocationOptionsQuery } from '../api/inventory-locations.api';
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
type InventoryLocationFormValues = {
  name: string;
  branchId?: string;
  locationType: number;
  parentLocationId?: string;
  description?: string;
};

const INVENTORY_LOCATION_TYPE_OPTIONS = [
  { value: InventoryLocationType.MAIN_STORE, label: 'Main Store' },
  { value: InventoryLocationType.BRANCH_STORE, label: 'Branch Store' },
  { value: InventoryLocationType.CONSUMPTION_LOCATION, label: 'Consumption Location' },
] as const;
const NO_PARENT_VALUE = '__none__';

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
    watch,
    formState: { errors },
  } = useForm<InventoryLocationFormValues>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === 'create'
        ? {
            name: '',
            branchId: '',
            locationType: InventoryLocationType.MAIN_STORE,
            parentLocationId: '',
            description: '',
          }
        : {
            name: '',
            locationType: InventoryLocationType.MAIN_STORE,
            parentLocationId: '',
            description: '',
          },
    mode: 'onSubmit',
  });
  const selectedCreateBranchId = watch('branchId');
  const locationOptionsParams = useMemo(
    () => ({
      companyId,
      branchId: mode === 'create' ? selectedCreateBranchId || undefined : initialData?.branchId,
    }),
    [companyId, initialData?.branchId, mode, selectedCreateBranchId],
  );
  const { data: locationOptionsData, isLoading: isLoadingLocationOptions } =
    useListInventoryLocationOptionsQuery(locationOptionsParams, {
      skip: !companyId || (mode === 'create' && !selectedCreateBranchId),
    });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name ?? '',
        locationType: initialData.locationType ?? InventoryLocationType.MAIN_STORE,
        parentLocationId: initialData.parentLocationId ?? '',
        description: initialData.description ?? '',
      });
      return;
    }
    reset({
      name: '',
      branchId: '',
      locationType: InventoryLocationType.MAIN_STORE,
      parentLocationId: '',
      description: '',
    });
  }, [initialData, mode, reset]);

  const submit = async (values: InventoryLocationFormValues) => {
    const valuesWithParent =
      values.parentLocationId === NO_PARENT_VALUE ? { ...values, parentLocationId: '' } : values;
    const normalized = normalizeOptionalFields(valuesWithParent, [
      'branchId',
      'parentLocationId',
      'description',
    ] as const);

    if (mode === 'create') {
      await onSubmit({
        name: normalized.name,
        branchId: normalized.branchId as string,
        locationType: values.locationType,
        parentLocationId: normalized.parentLocationId ? normalized.parentLocationId : undefined,
        description: normalized.description,
      });
      return;
    }
    await onSubmit({
      name: normalized.name,
      locationType: values.locationType,
      parentLocationId: normalized.parentLocationId ? normalized.parentLocationId : undefined,
      description: normalized.description,
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
                <Input
                  id="name"
                  placeholder="Location name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name?.message ? (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                ) : null}
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
                            placeholder={
                              isLoadingBranches ? 'Loading branches...' : 'Select branch'
                            }
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
                <FieldLabel htmlFor="locationType">Location Type</FieldLabel>
                <Controller
                  control={control}
                  name="locationType"
                  render={({ field }) => (
                    <Select
                      value={String(field.value ?? 0)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger id="locationType" aria-invalid={!!errors.locationType}>
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INVENTORY_LOCATION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.locationType?.message ? (
                  <p className="text-sm text-destructive">{errors.locationType.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="parentLocationId">Parent Location (Optional)</FieldLabel>
                <Controller
                  control={control}
                  name="parentLocationId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      disabled={isLoadingLocationOptions}
                    >
                      <SelectTrigger id="parentLocationId" aria-invalid={!!errors.parentLocationId}>
                        <SelectValue
                          placeholder={
                            isLoadingLocationOptions
                              ? 'Loading parent locations...'
                              : 'Select parent location'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PARENT_VALUE}>No parent</SelectItem>
                        {(locationOptionsData ?? [])
                          .filter((location) => location.id !== initialData?.id)
                          .map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.parentLocationId?.message ? (
                  <p className="text-sm text-destructive">{errors.parentLocationId.message}</p>
                ) : null}
              </Field>
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
                  {isSubmitting
                    ? `${mode === 'create' ? 'Creating...' : 'Saving...'}`
                    : submitButtonText}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/inventory/locations')}
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
}
