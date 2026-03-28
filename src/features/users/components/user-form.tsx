import { useEffect } from 'react';
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
} from '@/components/ui/select';
import { Spinner } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches';
import { useListRoleOptionsQuery } from '@/features/rbac';
import { useListLocationOptionsQuery } from '@/features/locations';
import { USER_TYPE_LABELS, USER_TYPES } from '@/shared/access/constants';
import { BranchType, UserType } from '@/db/schemas/enums';
import { userFormSchema, type UserFormValues } from '../schemas/user-form.schema';
import type { User } from '../types/user.types';
import { userStatusOptions } from './user-columns';

interface UserFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<User>;
  onSubmit: (data: UserFormValues) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

export function UserForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}: UserFormProps) {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const companyId = authUser?.company?.id ?? null;
  const effectiveCompanyId = companyId ?? initialData?.companyId ?? null;
  const actorBranchId = authUser?.branch?.id ?? null;
  const actorBranchType = authUser?.branch?.type ?? null;
  const actorLocationId = authUser?.locationId ?? null;
  const isHeadOfficeActor = actorBranchType === BranchType.HEADOFFICE;
  const isLocationManagerActor = !isHeadOfficeActor && !!actorLocationId;
  const isBranchManagerActor = !isHeadOfficeActor && !actorLocationId;

  const { data: branchesData, isLoading: isLoadingBranches } = useListBranchOptionsQuery(
    { companyId: effectiveCompanyId },
    { skip: !effectiveCompanyId },
  );
  const { data: rolesData, isLoading: isLoadingRoles } = useListRoleOptionsQuery(
    { companyId: effectiveCompanyId },
    { skip: !effectiveCompanyId },
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullname: '',
      telephone: '',
      email: '',
      status: 1,
      roleId: '',
      branchId: '',
      locationId: '',
      userType: UserType.STAFF,
    },
    mode: 'onSubmit',
  });

  const selectedBranchId = watch('branchId');
  const selectedLocationId = watch('locationId');
  const effectiveBranchId = selectedBranchId || actorBranchId || '';
  const {
    data: locationOptions = [],
    isLoading: isLoadingLocations,
    isFetching: isFetchingLocations,
  } = useListLocationOptionsQuery(
    {
      companyId: effectiveCompanyId,
      branchId: effectiveBranchId || null,
    },
    { skip: !effectiveCompanyId || !effectiveBranchId },
  );

  const branchOptions = (branchesData ?? []).filter((branch) => {
    if (isHeadOfficeActor) return true;
    return branch.id === actorBranchId;
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        fullname: initialData.fullname ?? '',
        telephone: initialData.telephone ?? '',
        email: initialData.email ?? '',
        status: initialData.status ?? 1,
        roleId: initialData.roleId ?? '',
        branchId: initialData.branchId ?? '',
        locationId: initialData.locationId ?? '',
        userType: initialData.userType ?? UserType.STAFF,
      });
      return;
    }
    reset({
      fullname: '',
      telephone: '',
      email: '',
      status: 1,
      roleId: '',
      branchId: isHeadOfficeActor ? '' : (actorBranchId ?? ''),
      locationId: isLocationManagerActor ? (actorLocationId ?? '') : '',
      userType: UserType.STAFF,
    });
  }, [
    actorBranchId,
    actorLocationId,
    initialData,
    isHeadOfficeActor,
    isLocationManagerActor,
    mode,
    reset,
  ]);

  useEffect(() => {
    if (!selectedBranchId) return;
    if (isLocationManagerActor) {
      setValue('locationId', actorLocationId ?? '', { shouldValidate: true });
      return;
    }
    const isHydratingEditLocation =
      mode === 'edit' &&
      !!selectedLocationId &&
      locationOptions.length === 0 &&
      (isLoadingLocations || isFetchingLocations);
    if (isHydratingEditLocation) {
      return;
    }
    const hasCurrentLocation = locationOptions.some(
      (location) => location.id === selectedLocationId,
    );
    if (!hasCurrentLocation) {
      setValue('locationId', '', { shouldValidate: false });
    }
  }, [
    actorLocationId,
    isFetchingLocations,
    isLoadingLocations,
    isLocationManagerActor,
    locationOptions,
    mode,
    selectedBranchId,
    selectedLocationId,
    setValue,
  ]);

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fullname">Full name</FieldLabel>
                <Input
                  id="fullname"
                  placeholder="Full name"
                  aria-invalid={!!errors.fullname}
                  {...register('fullname')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="telephone">Telephone</FieldLabel>
                <Input
                  id="telephone"
                  placeholder="Telephone"
                  aria-invalid={!!errors.telephone}
                  {...register('telephone')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger id="status" aria-invalid={!!errors.status}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {userStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="roleId">Role</FieldLabel>
                <Controller
                  control={control}
                  name="roleId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="roleId"
                        aria-invalid={!!errors.roleId}
                        disabled={isLoadingRoles}
                      >
                        <SelectValue
                          placeholder={isLoadingRoles ? 'Loading roles...' : 'Select role'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(rolesData ?? []).map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="branchId">Branch</FieldLabel>
                <Controller
                  control={control}
                  name="branchId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="branchId"
                        aria-invalid={!!errors.branchId}
                        disabled={
                          isLoadingBranches || isBranchManagerActor || isLocationManagerActor
                        }
                      >
                        <SelectValue
                          placeholder={isLoadingBranches ? 'Loading branches...' : 'Select branch'}
                        />
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
              </Field>
              <Field>
                <FieldLabel htmlFor="locationId">Location</FieldLabel>
                <Controller
                  control={control}
                  name="locationId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(value) => field.onChange(value === '__any__' ? '' : value)}
                    >
                      <SelectTrigger
                        id="locationId"
                        aria-invalid={!!errors.locationId}
                        disabled={!effectiveBranchId || isLocationManagerActor}
                      >
                        <SelectValue
                          placeholder={!effectiveBranchId ? 'Select branch first' : 'Any location'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {isLocationManagerActor ? null : (
                          <SelectItem value="__any__">Any location</SelectItem>
                        )}
                        {locationOptions.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="userType">User type</FieldLabel>
                <Controller
                  control={control}
                  name="userType"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger id="userType" aria-invalid={!!errors.userType}>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_TYPES.map((type) => (
                          <SelectItem key={type} value={String(type)}>
                            {USER_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting
                    ? `${mode === 'create' ? 'Creating...' : 'Saving...'}`
                    : submitButtonText}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/users')}>
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
