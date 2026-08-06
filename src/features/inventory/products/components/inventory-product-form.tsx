import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
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
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
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
  isRecoverable: boolean;
  unitConversions: { unitOfMeasure: number; factorToBase: string }[];
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
    watch,
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
            isRecoverable: false,
            unitConversions: [],
            minStockLevel: '',
          }
        : {
            categoryId: '',
            name: '',
            description: '',
            unitOfMeasure: 0,
            isRecoverable: false,
            unitConversions: [],
            minStockLevel: '',
          },
    mode: 'onSubmit',
  });
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'unitConversions',
  });
  const selectedBaseUnit = watch('unitOfMeasure');
  const watchedConversions = watch('unitConversions');
  const availableConversionUnitOptions = useMemo(
    () => UNIT_OF_MEASURE_OPTIONS.filter((option) => option.value !== selectedBaseUnit),
    [selectedBaseUnit],
  );
  const categorySelectOptions = useMemo<SearchableSelectOption[]>(
    () => [
      { value: UNCATEGORIZED_VALUE, label: 'Uncategorized' },
      ...(categoryOptions ?? []).map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categoryOptions],
  );

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        categoryId: initialData.categoryId ?? '',
        name: initialData.name ?? '',
        description: initialData.description ?? '',
        unitOfMeasure: initialData.unitOfMeasure ?? 0,
        isRecoverable: Boolean(initialData.isRecoverable),
        unitConversions: (initialData.unitConversions ?? [])
          .filter((conversion) => conversion.factorToBase !== '1')
          .map((conversion) => ({
            unitOfMeasure: conversion.unitOfMeasure,
            factorToBase: conversion.factorToBase,
          })),
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
      isRecoverable: false,
      unitConversions: [],
      minStockLevel: '',
    });
  }, [initialData, mode, reset]);

  useEffect(() => {
    const next = (watchedConversions ?? []).filter((row) => row.unitOfMeasure !== selectedBaseUnit);
    if (next.length !== (watchedConversions ?? []).length) {
      replace(next);
    }
  }, [replace, selectedBaseUnit, watchedConversions]);

  const submit = async (values: InventoryProductFormValues) => {
    if (mode === 'create') {
      await onSubmit({
        categoryId: values.categoryId ?? '',
        sku: values.sku ?? '',
        name: values.name,
        description: values.description ?? '',
        unitOfMeasure: values.unitOfMeasure,
        isRecoverable: values.isRecoverable,
        unitConversions: values.unitConversions,
        minStockLevel: values.minStockLevel ?? '',
      });
      return;
    }
    await onSubmit({
      categoryId: values.categoryId ?? '',
      name: values.name,
      description: values.description ?? '',
      unitOfMeasure: values.unitOfMeasure,
      isRecoverable: values.isRecoverable,
      unitConversions: values.unitConversions,
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
                    <SearchableSelect
                      options={categorySelectOptions}
                      value={field.value?.length ? field.value : UNCATEGORIZED_VALUE}
                      onValueChange={(value) =>
                        field.onChange(value === UNCATEGORIZED_VALUE ? '' : value)
                      }
                      isLoading={isLoadingCategories}
                      disabled={isLoadingCategories}
                      placeholder={
                        isLoadingCategories ? 'Loading categories...' : 'Select category'
                      }
                      searchPlaceholder="Search category..."
                      emptyMessage="No categories found."
                      triggerClassName={errors.categoryId ? 'border-destructive' : undefined}
                    />
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
                <FieldLabel htmlFor="isRecoverable">Recoverable item</FieldLabel>
                <Controller
                  control={control}
                  name="isRecoverable"
                  render={({ field }) => (
                    <Select
                      value={field.value ? 'yes' : 'no'}
                      onValueChange={(value) => field.onChange(value === 'yes')}
                    >
                      <SelectTrigger id="isRecoverable">
                        <SelectValue placeholder="Select recoverability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No (consumable)</SelectItem>
                        <SelectItem value="yes">Yes (recoverable)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Additional Unit Conversions</FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        unitOfMeasure: availableConversionUnitOptions[0]?.value ?? 0,
                        factorToBase: '',
                      })
                    }
                    disabled={!availableConversionUnitOptions.length}
                  >
                    Add Unit
                  </Button>
                </div>
                <div className="space-y-3 pt-2">
                  {fields.length ? null : (
                    <p className="text-sm text-muted-foreground">
                      Optional. Example: pack = 12 (base pieces), box = 120.
                    </p>
                  )}
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                      <Controller
                        control={control}
                        name={`unitConversions.${index}.unitOfMeasure`}
                        render={({ field: conversionField }) => (
                          <Select
                            value={String(conversionField.value)}
                            onValueChange={(value) => conversionField.onChange(Number(value))}
                          >
                            <SelectTrigger
                              aria-invalid={!!errors.unitConversions?.[index]?.unitOfMeasure}
                            >
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableConversionUnitOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <Input
                        placeholder="Factor to base"
                        inputMode="numeric"
                        aria-invalid={!!errors.unitConversions?.[index]?.factorToBase}
                        {...register(`unitConversions.${index}.factorToBase`)}
                      />
                      <Button type="button" variant="outline" onClick={() => remove(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
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
