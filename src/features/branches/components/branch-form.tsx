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
import { Checkbox } from '@/components/ui/checkbox';
import { BRANCH_TYPE_LABELS, BRANCH_TYPES } from '@/shared/access/constants';
import { BranchType } from '@/db/schemas/enums';
import { normalizeOptionalFields } from '@/lib/optional-fields';
import {
  branchFormSchema,
  type BranchFormInput,
  type BranchFormValues,
} from '../schemas/branch-form.schema';
import type { Branch } from '../types/branch.types';

interface BranchFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Branch>;
  onSubmit: (data: BranchFormValues) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

export function BranchForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}: BranchFormProps) {
  const navigate = useNavigate();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormInput, unknown, BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: '',
      type: BranchType.AGENCY,
      telephone: '',
      address: '',
      email: '',
      usePickupQueue: false,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name ?? '',
        type: (initialData.type as BranchFormValues['type']) ?? BranchType.AGENCY,
        telephone: initialData.telephone ?? '',
        address: initialData.address ?? '',
        email: initialData.email ?? '',
        usePickupQueue: initialData.usePickupQueue ?? false,
      });
      return;
    }

    reset({
      name: '',
      type: BranchType.AGENCY,
      telephone: '',
      address: '',
      email: '',
      usePickupQueue: false,
    });
  }, [initialData, mode, reset]);

  const submit = async (values: BranchFormValues) => {
    await onSubmit(normalizeOptionalFields(values, ['telephone', 'address', 'email'] as const));
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
                  placeholder="Branch name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name?.message ? (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger id="type" aria-invalid={!!errors.type}>
                        <SelectValue placeholder="Select branch type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCH_TYPES.map((type) => (
                          <SelectItem key={type} value={String(type)}>
                            {BRANCH_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type?.message ? (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="telephone">Telephone</FieldLabel>
                <Input
                  id="telephone"
                  placeholder="Optional"
                  aria-invalid={!!errors.telephone}
                  {...register('telephone')}
                />
                {errors.telephone?.message ? (
                  <p className="text-sm text-destructive">{errors.telephone.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Input
                  id="address"
                  placeholder="Optional"
                  aria-invalid={!!errors.address}
                  {...register('address')}
                />
                {errors.address?.message ? (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Optional"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email?.message ? (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                ) : null}
              </Field>
              <Field>
                <label
                  htmlFor="use-pickup-queue"
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <Controller
                    control={control}
                    name="usePickupQueue"
                    render={({ field }) => (
                      <Checkbox
                        id="use-pickup-queue"
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(value === true)}
                      />
                    )}
                  />
                  <span className="text-sm">
                    <span className="block font-medium">Use pickup queue</span>
                    <span className="text-muted-foreground">
                      Require queue ticket generation before parcel handover at this branch.
                    </span>
                  </span>
                </label>
              </Field>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting
                    ? `${mode === 'create' ? 'Creating...' : 'Saving...'}`
                    : submitButtonText}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/branches')}>
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
