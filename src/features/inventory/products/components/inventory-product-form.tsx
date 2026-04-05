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
} from '@/components/ui/select-searchable';
import { Spinner } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryProductCategoryOptionsQuery } from '../api/inventory-products.api';
import {
  createInventoryProductSchema,
  editInventoryProductSchema,
  type CreateInventoryProductFormValues,
  type EditInventoryProductFormValues,
} from '../schemas/inventory-product-form.schema';
import type { InventoryProduct } from '../types/inventory-product.types';
import { UNIT_OF_MEASURE_OPTIONS } from './inventory-product-columns';

interface InventoryProductFormBaseProps {
  initialData?: Partial<InventoryProduct>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

interface CreateInventoryProductFormProps extends InventoryProductFormBaseProps {
  mode: 'create';
  onSubmit: (data: CreateInventoryProductFormValues) => Promise<void>;
}

interface EditInventoryProductFormProps extends InventoryProductFormBaseProps {
  mode: 'edit';
  onSubmit: (data: EditInventoryProductFormValues) => Promise<void>;
}

type InventoryProductFormProps = CreateInventoryProductFormProps | EditInventoryProductFormProps;
type InventoryProductFormValues = {
  categoryId?: string;
  sku?: string;
  name: string;
  description?: string;
  unitOfMeasure: number;
  minStockLevel?: string;
};
const UNCATEGORIZED_VALUE = '__uncategorized__';

export function InventoryProductForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}: InventoryProductFormProps) {
  const navigate = useNavigate();
  const schema = mode === 'create' ? createInventoryProductSchema : editInventoryProductSchema;
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data: categoryOptions, isLoading: isLoadingCategories } =
    useListInventoryProductCategoryOptionsQuery({ companyId }, { skip: !companyId });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryProductFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues:
      mode === 'create'
        ? {
            categoryId: '',
            sku: '',
            name: '',
            description: '',
            unitOfMeasure: 0,
            minStockLevel: '',
          }
        : {
            categoryId: '',
            name: '',
            description: '',
            unitOfMeasure: 0,
            minStockLevel: '',
          },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        categoryId: initialData.categoryId ?? '',
        name: initialData.name ?? '',
        description: initialData.description ?? '',
        unitOfMeasure: initialData.unitOfMeasure ?? 0,
        minStockLevel: initialData.minStockLevel ?? '',
      });
      return;
    }
    reset({
      categoryId: '',
      sku: '',
      name: '',
      description: '',
      unitOfMeasure: 0,
      minStockLevel: '',
    });
  }, [initialData, mode, reset]);

  const submit = async (values: InventoryProductFormValues) => {
    if (mode === 'create') {
      await onSubmit({
        categoryId: values.categoryId ?? '',
        sku: values.sku ?? '',
        name: values.name,
        description: values.description ?? '',
        unitOfMeasure: values.unitOfMeasure,
        minStockLevel: values.minStockLevel ?? '',
      });
      return;
    }
    await onSubmit({
      categoryId: values.categoryId ?? '',
      name: values.name,
      description: values.description ?? '',
      unitOfMeasure: values.unitOfMeasure,
      minStockLevel: values.minStockLevel ?? '',
    });
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
                <FieldLabel htmlFor="categoryId">Category</FieldLabel>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value?.length ? field.value : UNCATEGORIZED_VALUE}
                      onValueChange={(value) =>
                        field.onChange(value === UNCATEGORIZED_VALUE ? '' : value)
                      }
                    >
                      <SelectTrigger
                        id="categoryId"
                        aria-invalid={!!errors.categoryId}
                        disabled={isLoadingCategories}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingCategories ? 'Loading categories...' : 'Select category'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNCATEGORIZED_VALUE}>Uncategorized</SelectItem>
                        {(categoryOptions ?? []).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId?.message ? (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                ) : null}
              </Field>
              {mode === 'create' ? (
                <Field>
                  <FieldLabel htmlFor="sku">SKU</FieldLabel>
                  <Input
                    id="sku"
                    placeholder="Stock keeping unit"
                    aria-invalid={!!errors.sku}
                    {...register('sku')}
                  />
                  {errors.sku?.message ? (
                    <p className="text-sm text-destructive">{errors.sku.message}</p>
                  ) : null}
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Product name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name?.message ? (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="unitOfMeasure">Unit of measure</FieldLabel>
                <Controller
                  control={control}
                  name="unitOfMeasure"
                  render={({ field }) => (
                    <Select
                      value={String(field.value ?? 0)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger id="unitOfMeasure" aria-invalid={!!errors.unitOfMeasure}>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OF_MEASURE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.unitOfMeasure?.message ? (
                  <p className="text-sm text-destructive">{errors.unitOfMeasure.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="minStockLevel">Minimum stock level</FieldLabel>
                <Input
                  id="minStockLevel"
                  placeholder="Optional (e.g. 10)"
                  aria-invalid={!!errors.minStockLevel}
                  {...register('minStockLevel')}
                />
                {errors.minStockLevel?.message ? (
                  <p className="text-sm text-destructive">{errors.minStockLevel.message}</p>
                ) : null}
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
                  {isSubmitting
                    ? `${mode === 'create' ? 'Creating...' : 'Saving...'}`
                    : submitButtonText}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/inventory/products')}
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
}
