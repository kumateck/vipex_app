/**
 * Edit Branch: form to update a branch via PATCH /v1/branches/:id.
 * Prefills from GET /v1/branches/:id, submit updates, shows success/error toast.
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { editBranchSchema, type EditBranchSchema } from '../../schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui';

type BranchDto = {
  id: string;
  name: string;
  type: string;
  telephone: string | null;
  address: string | null;
  email: string | null;
};

const toOptional = (v: string | null | undefined) => (v?.trim() ? v.trim() : undefined);

/** Action: submit update branch form (PATCH /v1/branches/:id). */
async function updateBranchAction(id: string, data: EditBranchSchema): Promise<{ id: string }> {
  const body = {
    name: data.name.trim(),
    type: data.type.trim(),
    telephone: toOptional(data.telephone) ?? null,
    address: toOptional(data.address) ?? null,
    email: toOptional(data.email) ?? null,
  };
  const res = await fetch(`/v1/branches/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.message === 'string' ? err.message : 'Failed to update branch');
  }
  return res.json();
}

const EditBranchPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [branch, setBranch] = useState<BranchDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditBranchSchema>({
    resolver: zodResolver(editBranchSchema),
    defaultValues: { name: '', type: '', telephone: '', address: '', email: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!id) return;
    setLoadError(null);
    fetch(`/v1/branches/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Branch not found');
        return res.json();
      })
      .then((data: BranchDto) => {
        setBranch(data);
        reset({
          name: data.name ?? '',
          type: data.type ?? '',
          telephone: data.telephone ?? '',
          address: data.address ?? '',
          email: data.email ?? '',
        });
      })
      .catch(() => setLoadError('Failed to load branch'))
      .finally(() => {});
  }, [id, reset]);

  const onSubmit = async (data: EditBranchSchema) => {
    if (!id) return;
    try {
      await updateBranchAction(id, data);
      toast.success('Branch updated successfully');
      navigate('/branches', { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loadError) {
    return (
      <div className="w-full max-w-lg mx-auto p-4 space-y-4">
        <p className="text-destructive">{loadError}</p>
        <Button variant="outline" onClick={() => navigate('/branches')}>
          Back to list
        </Button>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="w-full max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/branches')}
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

export default EditBranchPage;
