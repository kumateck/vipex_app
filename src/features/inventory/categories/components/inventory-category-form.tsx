import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui';
import {
  inventoryCategoryFormSchema,
  type InventoryCategoryFormValues,
} from '../schemas/inventory-category-form.schema';
import type { InventoryCategory } from '../types/inventory-category.types';

interface InventoryCategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<InventoryCategory>;
  onSubmit: (data: InventoryCategoryFormValues) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

export function InventoryCategoryForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}: InventoryCategoryFormProps) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryCategoryFormValues>({
    resolver: zodResolver(inventoryCategoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name ?? '',
        description: initialData.description ?? '',
      });
      return;
    }

    reset({
      name: '',
      description: '',
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
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Product category name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name?.message ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
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
                  {isSubmitting ? `${mode === 'create' ? 'Creating...' : 'Saving...'}` : submitButtonText}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/inventory/categories')}>
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
