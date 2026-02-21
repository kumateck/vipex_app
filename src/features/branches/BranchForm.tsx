import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createBranchSchema, type CreateBranchSchema } from '../../pages/(private)/(configurations)/branches/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui';

interface Branch {
  id: string;
  name: string;
  type: string;
  telephone: string | null;
  address: string | null;
  email: string | null;
}

interface BranchFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Branch>;
  onSubmit: (data: CreateBranchSchema) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

const toOptional = (v: string | undefined) => (v?.trim() ? v.trim() : undefined);

export const BranchForm: React.FC<BranchFormProps> = ({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}) => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBranchSchema>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: '',
      type: '',
      telephone: '',
      address: '',
      email: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name ?? '',
        type: initialData.type ?? '',
        telephone: initialData.telephone ?? '',
        address: initialData.address ?? '',
        email: initialData.email ?? '',
      });
    } else if (mode === 'create') {
      reset({
        name: '',
        type: '',
        telephone: '',
        address: '',
        email: '',
      });
    }
  }, [initialData, mode, reset]);

  const handleFormSubmit = async (data: CreateBranchSchema) => {
    await onSubmit(data);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
                  {isSubmitting ? `${mode === 'create' ? 'Creating...' : 'Saving...'}` : submitButtonText}
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