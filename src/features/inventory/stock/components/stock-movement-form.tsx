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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { UNIT_OF_MEASURE_OPTIONS } from '@/features/inventory/products/components/inventory-product-columns';
import { convertToBaseUnits } from '@/shared/inventory/unit-conversion';
import { STOCK_MOVEMENT_TYPE_OPTIONS } from '../constants/stock-options';
import {
  createStockMovementSchema,
  type CreateStockMovementFormValues,
} from '../schemas/stock-forms.schema';

interface StockMovementFormProps {
  onSubmit: (data: CreateStockMovementFormValues) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

export function StockMovementForm({
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}: StockMovementFormProps) {
  const navigate = useNavigate();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data: products = [], isLoading: isLoadingProducts } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locations = [], isLoading: isLoadingLocations } =
    useListInventoryLocationOptionsQuery({ companyId }, { skip: !companyId });

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateStockMovementFormValues>({
    resolver: zodResolver(createStockMovementSchema),
    defaultValues: {
      productId: '',
      locationId: '',
      movementType: 0,
      quantityUnitOfMeasure: 0,
      quantity: '',
      referenceId: '',
      referenceType: '',
      notes: '',
    },
    mode: 'onSubmit',
  });
  const selectedProductId = watch('productId');
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );
  const unitOptions = useMemo(() => {
    if (!selectedProduct) return UNIT_OF_MEASURE_OPTIONS;
    const conversions = selectedProduct.unitConversions ?? [
      { unitOfMeasure: selectedProduct.unitOfMeasure, factorToBase: '1' },
    ];
    return [...conversions]
      .sort((a, b) => Number.parseInt(a.factorToBase, 10) - Number.parseInt(b.factorToBase, 10))
      .map((item) => UNIT_OF_MEASURE_OPTIONS.find((option) => option.value === item.unitOfMeasure))
      .filter((item): item is (typeof UNIT_OF_MEASURE_OPTIONS)[number] => Boolean(item));
  }, [selectedProduct]);
  useEffect(() => {
    if (!selectedProduct) return;
    setValue('quantityUnitOfMeasure', selectedProduct.unitOfMeasure);
  }, [selectedProduct, setValue]);

  const submit = async (values: CreateStockMovementFormValues) => {
    const conversions = selectedProduct?.unitConversions ?? [
      { unitOfMeasure: selectedProduct?.unitOfMeasure ?? 0, factorToBase: '1' },
    ];
    const conversionRows = conversions.map((item) => ({
      unitOfMeasure: item.unitOfMeasure,
      factorToBase: Number.parseInt(item.factorToBase, 10),
    }));
    const baseQuantity = convertToBaseUnits(
      Number.parseFloat(values.quantity),
      values.quantityUnitOfMeasure ?? selectedProduct?.unitOfMeasure ?? 0,
      conversionRows,
    );

    await onSubmit({
      ...values,
      quantity: String(baseQuantity),
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
                <FieldLabel htmlFor="productId">Product</FieldLabel>
                <Controller
                  control={control}
                  name="productId"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="productId"
                        aria-invalid={!!errors.productId}
                        disabled={isLoadingProducts}
                      >
                        <SelectValue
                          placeholder={isLoadingProducts ? 'Loading products...' : 'Select product'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.productId?.message ? (
                  <p className="text-sm text-destructive">{errors.productId.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="locationId">Location</FieldLabel>
                <Controller
                  control={control}
                  name="locationId"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="locationId"
                        aria-invalid={!!errors.locationId}
                        disabled={isLoadingLocations}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingLocations ? 'Loading locations...' : 'Select location'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.locationId?.message ? (
                  <p className="text-sm text-destructive">{errors.locationId.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="movementType">Movement type</FieldLabel>
                <Controller
                  control={control}
                  name="movementType"
                  render={({ field }) => (
                    <Select
                      value={String(field.value ?? 0)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger id="movementType" aria-invalid={!!errors.movementType}>
                        <SelectValue placeholder="Select movement type" />
                      </SelectTrigger>
                      <SelectContent>
                        {STOCK_MOVEMENT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.movementType?.message ? (
                  <p className="text-sm text-destructive">{errors.movementType.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
                <Input
                  id="quantity"
                  placeholder="e.g. 10"
                  aria-invalid={!!errors.quantity}
                  {...register('quantity')}
                />
                {errors.quantity?.message ? (
                  <p className="text-sm text-destructive">{errors.quantity.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="quantityUnitOfMeasure">Quantity Unit</FieldLabel>
                <Controller
                  control={control}
                  name="quantityUnitOfMeasure"
                  render={({ field }) => (
                    <Select
                      value={String(field.value ?? selectedProduct?.unitOfMeasure ?? 0)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger
                        id="quantityUnitOfMeasure"
                        aria-invalid={!!errors.quantityUnitOfMeasure}
                      >
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((option) => (
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
                <FieldLabel htmlFor="referenceId">Reference ID</FieldLabel>
                <Input
                  id="referenceId"
                  placeholder="Optional"
                  aria-invalid={!!errors.referenceId}
                  {...register('referenceId')}
                />
                {errors.referenceId?.message ? (
                  <p className="text-sm text-destructive">{errors.referenceId.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="referenceType">Reference type</FieldLabel>
                <Input
                  id="referenceType"
                  placeholder="Optional"
                  aria-invalid={!!errors.referenceType}
                  {...register('referenceType')}
                />
                {errors.referenceType?.message ? (
                  <p className="text-sm text-destructive">{errors.referenceType.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  id="notes"
                  placeholder="Optional"
                  aria-invalid={!!errors.notes}
                  {...register('notes')}
                />
                {errors.notes?.message ? (
                  <p className="text-sm text-destructive">{errors.notes.message}</p>
                ) : null}
              </Field>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? 'Creating...' : submitButtonText}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/inventory/stock-movements')}
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
