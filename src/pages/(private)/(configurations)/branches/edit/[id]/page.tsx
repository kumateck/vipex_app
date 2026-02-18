/**
 * Edit branch: uses branches API hooks. Error and loading are separate components.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { editBranchSchema, type EditBranchSchema } from '../../schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui';
import { useGetBranchQuery, useUpdateBranchMutation } from '@/features/branches/api';
import { BranchLoadError } from '@/features/branches/BranchLoadError';
import { BranchFormSkeleton } from '@/features/branches/BranchFormSkeleton';

const toOptional = (v: string | null | undefined) => (v?.trim() ? v.trim() : undefined);

const EditBranchPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: branch, isLoading, isError, error } = useGetBranchQuery(id ?? '', { skip: !id });
  const [updateBranch, { isLoading: isSubmitting }] = useUpdateBranchMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditBranchSchema>({
    resolver: zodResolver(editBranchSchema),
    defaultValues: { name: '', type: '', telephone: '', address: '', email: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!branch) return;
    reset({
      name: branch.name ?? '',
      type: branch.type ?? '',
      telephone: branch.telephone ?? '',
      address: branch.address ?? '',
      email: branch.email ?? '',
    });
  }, [branch, reset]);

  const onSubmit = async (data: EditBranchSchema) => {
    if (!id) return;
    try {
      await updateBranch({
        id,
        body: {
          name: data.name.trim(),
          type: data.type.trim(),
          telephone: toOptional(data.telephone) ?? null,
          address: toOptional(data.address) ?? null,
          email: toOptional(data.email) ?? null,
        },
      }).unwrap();
      toast.success('Branch updated successfully');
      navigate('/branches', { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleBack = () => navigate('/branches');

  if (!id) {
    return <BranchLoadError message="Invalid branch id" onBack={handleBack} />;
  }

  if (isError) {
    const message =
      error && typeof (error as { data?: { message?: string } }).data?.message === 'string'
        ? (error as { data: { message: string } }).data.message
        : 'Failed to load branch';
    return <BranchLoadError message={message} onBack={handleBack} />;
  }

  if (isLoading || !branch) {
    return <BranchFormSkeleton />;
  }

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit branch</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Branch name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name?.message && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <Input
                  id="type"
                  placeholder="e.g. Warehouse, Office"
                  aria-invalid={!!errors.type}
                  {...register('type')}
                />
                {errors.type?.message && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="telephone">Telephone</FieldLabel>
                <Input
                  id="telephone"
                  placeholder="Optional"
                  aria-invalid={!!errors.telephone}
                  {...register('telephone')}
                />
                {errors.telephone?.message && (
                  <p className="text-sm text-destructive">{errors.telephone.message}</p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Input
                  id="address"
                  placeholder="Optional"
                  aria-invalid={!!errors.address}
                  {...register('address')}
                />
                {errors.address?.message && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
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
                {errors.email?.message && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </Field>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? 'Saving...' : 'Save changes'}
                </Button>
                <Button type="button" variant="outline" onClick={handleBack}>
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

export default EditBranchPage;
