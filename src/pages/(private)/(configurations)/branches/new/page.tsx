/**
 * Create Branch: form to add a new branch via POST /v1/branches/.
 * Validates required inputs, shows success toast, redirects to list after creation.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createBranchSchema, type CreateBranchSchema } from '../schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';

const toOptional = (v: string | undefined) => (v?.trim() ? v.trim() : undefined);

/** Action: submit create branch form (POST /v1/branches/). */
async function createBranchAction(data: CreateBranchSchema): Promise<{ id: string }> {
  const user = useAuthStore.getState().user;
  if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
  const body = {
    companyId: user.company.id,
    name: data.name.trim(),
    type: data.type.trim(),
    telephone: toOptional(data.telephone) ?? null,
    address: toOptional(data.address) ?? null,
    email: toOptional(data.email) ?? null,
    createdBy: user.id,
  };
  const res = await fetch('/v1/branches/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.message === 'string' ? err.message : 'Failed to create branch');
  }
  return res.json();
}

const CreateBranchPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateBranchSchema>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: { name: '', type: '', telephone: '', address: '', email: '' },
    mode: 'onSubmit',
  });

  const onSubmit = async (data: CreateBranchSchema) => {
    try {
      await createBranchAction(data);
      toast.success('Branch created successfully');
      navigate('/branches', { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create branch</CardTitle>
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
                  {isSubmitting ? 'Creating...' : 'Create branch'}
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

export default CreateBranchPage;
