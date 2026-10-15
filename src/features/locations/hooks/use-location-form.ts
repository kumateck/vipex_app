import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches';
import { normalizeOptionalFields } from '@/lib/optional-fields';
import { createLocationSchema, editLocationSchema } from '../schemas/location-form.schema';
import type { LocationFormProps, LocationFormValues } from '../types/location-form.types';

export function useLocationForm({ mode, initialData, onSubmit }: LocationFormProps) {
  const navigate = useNavigate();
  const schema = mode === 'create' ? createLocationSchema : editLocationSchema;
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
  } = useForm<LocationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', branchId: '', canSend: true, canReceive: true },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name ?? '',
        canSend: initialData.canSend ?? true,
        canReceive: initialData.canReceive ?? true,
      });
      return;
    }
    reset({ name: '', branchId: '', canSend: true, canReceive: true });
  }, [initialData, mode, reset]);

  const submit = async (values: LocationFormValues) => {
    if (mode === 'create') {
      const normalized = normalizeOptionalFields(values, ['branchId'] as const);
      await onSubmit({
        name: normalized.name,
        branchId: normalized.branchId as string,
        canSend: values.canSend,
        canReceive: values.canReceive,
      });
      return;
    }
    await onSubmit({ name: values.name, canSend: values.canSend, canReceive: values.canReceive });
  };

  return {
    control,
    register,
    handleSubmit,
    errors,
    submit,
    branchesData,
    isLoadingBranches,
    onCancel: () => navigate('/locations'),
  };
}
