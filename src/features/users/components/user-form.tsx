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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Spinner } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches';
import { useListRoleOptionsQuery } from '@/features/rbac';
import { useListLocationOptionsQuery } from '@/features/locations';
import { sanitizeNumber, sanitizeString } from '@/lib/utils';
import { PHONE_DIGITS, limitPhoneDigits } from '@/lib/phone';
import {
  CASHIER_TYPE_LABELS,
  CASHIER_TYPES,
  USER_TYPE_LABELS,
  USER_TYPES,
} from '@/shared/access/constants';
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

  const { currentData: branchesData = [], isLoading: isLoadingBranches } =
    useListBranchOptionsQuery({ companyId: effectiveCompanyId }, { skip: !effectiveCompanyId });
  const { currentData: rolesData = [], isLoading: isLoadingRoles } = useListRoleOptionsQuery(
    { companyId: effectiveCompanyId },
    { skip: !effectiveCompanyId },
  );

  // FIX: Guard reset until both branches and roles have finished loading
  const isLoadingOptions = isLoadingBranches || isLoadingRoles;

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
      cashierType: null,
    },
    mode: 'onSubmit',
  });

  const selectedBranchId = watch('branchId');
  const selectedLocationId = watch('locationId');
  const selectedUserType = sanitizeNumber(watch('userType'));
  const isCashierUserType = selectedUserType === UserType.CASHIER;
  const effectiveBranchId = selectedBranchId || actorBranchId || '';
  const {
    currentData: locationOptions = [],
    isLoading: isLoadingLocations,
    isFetching: isFetchingLocations,
  } = useListLocationOptionsQuery(
    {
      companyId: effectiveCompanyId,
      branchId: effectiveBranchId || null,
    },
    { skip: !effectiveCompanyId || !effectiveBranchId },
  );

  const branchOptions = useMemo(() => {
    const scoped = branchesData.filter((branch) => {
      if (isHeadOfficeActor) return true;
      return branch.id === actorBranchId;
    });

    if (
      mode === 'edit' &&
      initialData?.branchId &&
      !scoped.some((branch) => branch.id === initialData.branchId)
    ) {
      return [
        ...scoped,
        {
          id: initialData.branchId,
          name: initialData.branchName ?? 'Current branch',
          type: BranchType.AGENCY,
        },
      ];
    }

    return scoped;
  }, [
    actorBranchId,
    branchesData,
    initialData?.branchId,
    initialData?.branchName,
    isHeadOfficeActor,
    mode,
  ]);

  const roleOptions = useMemo(() => {
    const scoped = rolesData;
    if (
      mode === 'edit' &&
      initialData?.roleId &&
      !scoped.some((role) => role.id === initialData.roleId)
    ) {
      return [
        ...scoped,
        {
          id: initialData.roleId,
          name: initialData.roleName ?? 'Current role',
        },
      ];
    }
    return scoped;
  }, [initialData?.roleId, initialData?.roleName, mode, rolesData]);

  const locationOptionsWithCurrent = useMemo(() => {
    if (
      mode === 'edit' &&
      initialData?.locationId &&
      !locationOptions.some((location) => location.id === initialData.locationId)
    ) {
      return [
        ...locationOptions,
        {
          id: initialData.locationId,
          name: initialData.locationName ?? 'Current location',
          branchId: selectedBranchId || initialData.branchId || '',
        },
      ];
    }
    return locationOptions;
  }, [
    initialData?.branchId,
    initialData?.locationId,
    initialData?.locationName,
    locationOptions,
    mode,
    selectedBranchId,
  ]);

  const userTypeOptions = useMemo(() => {
    const options = USER_TYPES.map((type) => ({
      value: type,
      label: USER_TYPE_LABELS[type],
    }));

    const currentUserType = sanitizeNumber(initialData?.userType);
    if (
      mode === 'edit' &&
      currentUserType !== null &&
      currentUserType !== undefined &&
      !USER_TYPES.includes(currentUserType)
    ) {
      options.push({
        value: currentUserType,
        label: `Unknown (${currentUserType})`,
      });
    }

    return options;
  }, [initialData?.userType, mode]);

  const cashierTypeOptions = useMemo(() => {
    const options = CASHIER_TYPES.map((type) => ({
      value: type,
      label: CASHIER_TYPE_LABELS[type],
    }));

    const currentCashierType = initialData?.cashierType;
    if (
      mode === 'edit' &&
      currentCashierType !== null &&
      currentCashierType !== undefined &&
      !CASHIER_TYPES.includes(currentCashierType)
    ) {
      options.push({
        value: currentCashierType,
        label: `Unknown (${currentCashierType})`,
      });
    }

    return options;
  }, [initialData?.cashierType, mode]);

  // FIX: Keyed on initialData?.id (stable identifier) + isLoadingOptions so this effect:
  //  - Re-runs immediately when switching between users (id changes, options already cached)
  //  - Re-runs once options finish loading on first open / page refresh
  //  - Never gets stuck due to stale whole-object reference comparisons
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      // Still wait if options are genuinely loading (first open / hard refresh)
      if (isLoadingOptions) return;

      reset({
        fullname: initialData.fullname ?? '',
        telephone: initialData.telephone ?? '',
        email: initialData.email ?? '',
        status: sanitizeNumber(initialData.status ?? 1),
        roleId: sanitizeString(initialData.roleId),
        branchId: sanitizeString(initialData.branchId),
        locationId: sanitizeString(initialData.locationId),
        userType: sanitizeNumber(initialData.userType),
        cashierType:
          initialData.cashierType !== null && initialData.cashierType !== undefined
            ? sanitizeNumber(initialData.cashierType)
            : null,
      });
      return;
    }

    // Create mode
    reset({
      fullname: '',
      telephone: '',
      email: '',
      status: 1,
      roleId: '',
      branchId: isHeadOfficeActor ? '' : (actorBranchId ?? ''),
      locationId: isLocationManagerActor ? (actorLocationId ?? '') : '',
      userType: UserType.STAFF,
      cashierType: null,
    });
  }, [
    actorBranchId,
    actorLocationId,
    initialData?.id, // FIX: stable ID instead of whole object — fires on user switch
    isHeadOfficeActor,
    isLocationManagerActor,
    isLoadingOptions, // FIX: fires once options finish loading on first open
    mode,
    reset,
  ]);

  useEffect(() => {
    if (selectedUserType === UserType.CASHIER) return;
    setValue('cashierType', null, { shouldValidate: false, shouldDirty: true });
  }, [selectedUserType, setValue]);

  useEffect(() => {
    if (mode !== 'create') return;
    if (isLocationManagerActor) return;
    setValue('locationId', '', { shouldValidate: false });
  }, [mode, isLocationManagerActor, selectedBranchId, setValue]);

  useEffect(() => {
    if (!selectedBranchId) return;

    if (mode === 'create' && isLocationManagerActor) {
      setValue('locationId', actorLocationId ?? '', { shouldValidate: true });
      return;
    }

    // FIX: Bail out early while locations are still fetching to prevent
    // the "hasCurrentLocation" check from incorrectly clearing locationId
    // before the options list has been populated.
    if (isLoadingLocations || isFetchingLocations) return;

    const isHydratingEditLocation =
      mode === 'edit' && !!selectedLocationId && locationOptions.length === 0;

    if (isHydratingEditLocation) {
      return;
    }

    const hasCurrentLocation = locationOptionsWithCurrent.some(
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
    locationOptionsWithCurrent,
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
                  placeholder="0240000000"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={PHONE_DIGITS}
                  aria-invalid={!!errors.telephone}
                  {...register('telephone', {
                    onChange: (event) => {
                      event.target.value = limitPhoneDigits(event.target.value);
                    },
                  })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={sanitizeString(field.value)}
                      onValueChange={(value) => field.onChange(sanitizeNumber(value))}
                    >
                      <SelectTrigger id="status" aria-invalid={!!errors.status}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {userStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={sanitizeString(option.value)}>
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
                    <SearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      isLoading={isLoadingRoles}
                      disabled={isLoadingRoles}
                      placeholder={isLoadingRoles ? 'Loading roles...' : 'Select role'}
                      searchPlaceholder="Search role..."
                      options={roleOptions.map((role) => ({
                        value: role.id,
                        label: role.name,
                      }))}
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="branchId">Branch</FieldLabel>
                <Controller
                  control={control}
                  name="branchId"
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      isLoading={isLoadingBranches}
                      disabled={isLoadingBranches || isBranchManagerActor || isLocationManagerActor}
                      placeholder={isLoadingBranches ? 'Loading branches...' : 'Select branch'}
                      searchPlaceholder="Search branch..."
                      options={branchOptions.map((branch) => ({
                        value: branch.id,
                        label: branch.name,
                      }))}
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="locationId">Location</FieldLabel>
                <Controller
                  control={control}
                  name="locationId"
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value ?? '__any__'}
                      onValueChange={(value: string) =>
                        field.onChange(value === '__any__' ? '' : value)
                      }
                      disabled={!effectiveBranchId || isLocationManagerActor}
                      placeholder={!effectiveBranchId ? 'Select branch first' : 'Any location'}
                      searchPlaceholder="Search location..."
                      options={[
                        ...(isLocationManagerActor
                          ? []
                          : [{ value: '__any__', label: 'Any location' }]),
                        ...locationOptionsWithCurrent.map((location) => ({
                          value: location.id,
                          label: location.name,
                        })),
                      ]}
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="userType">User type</FieldLabel>
                <Controller
                  control={control}
                  name="userType"
                  render={({ field }) => (
                    <SearchableSelect
                      value={sanitizeString(field.value)}
                      onValueChange={(value) => field.onChange(sanitizeNumber(value))}
                      placeholder="Select user type"
                      searchPlaceholder="Search user type..."
                      options={userTypeOptions.map((type) => ({
                        value: sanitizeString(type.value),
                        label: type.label,
                      }))}
                    />
                  )}
                />
              </Field>
              {isCashierUserType ? (
                <Field>
                  <FieldLabel htmlFor="cashierType">Cashier type</FieldLabel>
                  <Controller
                    control={control}
                    name="cashierType"
                    render={({ field }) => (
                      <Select
                        value={
                          field.value !== null && field.value !== undefined
                            ? sanitizeString(field.value)
                            : ''
                        }
                        onValueChange={(value) => field.onChange(sanitizeNumber(value))}
                      >
                        <SelectTrigger id="cashierType" aria-invalid={!!errors.cashierType}>
                          <SelectValue placeholder="Select cashier type" />
                        </SelectTrigger>
                        <SelectContent>
                          {cashierTypeOptions.map((type) => (
                            <SelectItem key={type.value} value={sanitizeString(type.value)}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              ) : null}

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
