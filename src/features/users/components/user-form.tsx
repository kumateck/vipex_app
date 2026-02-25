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
import { useListRoleOptionsQuery } from '@/features/rbac';
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
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);

  const { data: branchesData, isLoading: isLoadingBranches } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: rolesData, isLoading: isLoadingRoles } = useListRoleOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const {
    control,
    register,
    handleSubmit,
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
    },
    mode: 'onSubmit',
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
      });
      return;
    }
    reset({
      fullname: '',
      telephone: '',
      email: '',
      status: 1,
      roleId: '',
      branchId: '',
    });
  }, [initialData, mode, reset]);

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
                <Input id="fullname" placeholder="Full name" aria-invalid={!!errors.fullname} {...register('fullname')} />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" placeholder="Email" aria-invalid={!!errors.email} {...register('email')} />
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
                    <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
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
                      <SelectTrigger id="roleId" aria-invalid={!!errors.roleId} disabled={isLoadingRoles}>
                        <SelectValue placeholder={isLoadingRoles ? 'Loading roles...' : 'Select role'} />
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
                      <SelectTrigger id="branchId" aria-invalid={!!errors.branchId} disabled={isLoadingBranches}>
                        <SelectValue placeholder={isLoadingBranches ? 'Loading branches...' : 'Select branch'} />
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
              </Field>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? `${mode === 'create' ? 'Creating...' : 'Saving...'}` : submitButtonText}
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
