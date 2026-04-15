import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { useGetStockLevelQuery, useListStockTransfersQuery } from '@/features/inventory/api';
import { TransferStatus } from '@/db/schemas/enums';
import {
  createStockTransferSchema,
  type CreateStockTransferFormValues,
} from '../schemas/stock-forms.schema';

interface StockTransferFormProps {
  onSubmit: (data: CreateStockTransferFormValues) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

export function StockTransferForm({
  onSubmit,
  isSubmitting,
  title,
  submitButtonText,
}: StockTransferFormProps) {
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
  } = useForm<CreateStockTransferFormValues>({
    resolver: zodResolver(createStockTransferSchema),
    defaultValues: {
      productId: '',
      fromLocationId: '',
      toLocationId: '',
      quantityUnitOfMeasure: 0,
      quantity: '',
      notes: '',
    },
    mode: 'onSubmit',
  });
  const selectedProductId = watch('productId');
  const selectedFromLocationId = watch('fromLocationId');
  const selectedQuantity = watch('quantity');
  const selectedQuantityUnitOfMeasure = watch('quantityUnitOfMeasure');
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );
  const selectedProductConversions = useMemo(
    () =>
      (
        selectedProduct?.unitConversions ?? [
          { unitOfMeasure: selectedProduct?.unitOfMeasure ?? 0, factorToBase: '1' },
        ]
      ).map((item) => ({
        unitOfMeasure: item.unitOfMeasure,
        factorToBase: Number.parseInt(item.factorToBase, 10),
      })),
    [selectedProduct],
  );
  const { data: sourceStockLevel } = useGetStockLevelQuery(
    { productId: selectedProductId, locationId: selectedFromLocationId },
    { skip: !selectedProductId || !selectedFromLocationId },
  );
  const { data: stockTransfersResponse } = useListStockTransfersQuery(
    {
      page: 1,
      pageSize: 100,
      filters: { companyId, productId: selectedProductId || null },
    },
    { skip: !companyId || !selectedProductId },
  );
  const sourceOnHandBase = Number(sourceStockLevel?.quantity ?? 0);
  const committedTransferBase = useMemo(
    () =>
      (stockTransfersResponse?.data ?? [])
        .filter(
          (transfer) =>
            transfer.productId === selectedProductId &&
            transfer.fromLocationId === selectedFromLocationId &&
            [
              TransferStatus.PENDING,
              TransferStatus.IN_TRANSIT,
              TransferStatus.PARTIALLY_FULFILLED,
            ].includes(transfer.status),
        )
        .reduce(
          (sum, transfer) =>
            sum +
            Math.max(0, Number(transfer.quantity ?? 0) - Number(transfer.fulfilledQuantity ?? 0)),
          0,
        ),
    [selectedFromLocationId, selectedProductId, stockTransfersResponse?.data],
  );
  const availableToTransferBase = Math.max(0, sourceOnHandBase - committedTransferBase);
  const requestedTransferBase = useMemo(() => {
    const parsedQuantity = Number.parseFloat(selectedQuantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return 0;
    return convertToBaseUnits(
      parsedQuantity,
      selectedQuantityUnitOfMeasure ?? selectedProduct?.unitOfMeasure ?? 0,
      selectedProductConversions,
    );
  }, [
    selectedProduct?.unitOfMeasure,
    selectedProductConversions,
    selectedQuantity,
    selectedQuantityUnitOfMeasure,
  ]);
  const exceedsAvailableTransfer =
    !!selectedProductId &&
    !!selectedFromLocationId &&
    requestedTransferBase > availableToTransferBase;
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
  const selectedToLocationId = watch('toLocationId');
  useEffect(() => {
    if (!selectedFromLocationId) return;
    if (selectedToLocationId === selectedFromLocationId) {
      setValue('toLocationId', '');
    }
  }, [selectedFromLocationId, selectedToLocationId, setValue]);

  const submit = async (values: CreateStockTransferFormValues) => {
    const baseQuantity = convertToBaseUnits(
      Number.parseFloat(values.quantity),
      values.quantityUnitOfMeasure ?? selectedProduct?.unitOfMeasure ?? 0,
      selectedProductConversions,
    );
    if (baseQuantity > availableToTransferBase) {
      toast.error(
        `Transfer quantity exceeds available stock. Available: ${formatBaseQuantityWithBestUnits(
          availableToTransferBase,
          selectedProductConversions,
        )}`,
      );
      return;
    }

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
                <FieldLabel htmlFor="fromLocationId">From location</FieldLabel>
                <Controller
                  control={control}
                  name="fromLocationId"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="fromLocationId"
                        aria-invalid={!!errors.fromLocationId}
                        disabled={isLoadingLocations}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingLocations ? 'Loading locations...' : 'Select source location'
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
                {errors.fromLocationId?.message ? (
                  <p className="text-sm text-destructive">{errors.fromLocationId.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="toLocationId">To location</FieldLabel>
                <Controller
                  control={control}
                  name="toLocationId"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="toLocationId"
                        aria-invalid={!!errors.toLocationId}
                        disabled={isLoadingLocations}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingLocations
                              ? 'Loading locations...'
                              : 'Select destination location'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {locations
                          .filter((location) => location.id !== selectedFromLocationId)
                          .map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.toLocationId?.message ? (
                  <p className="text-sm text-destructive">{errors.toLocationId.message}</p>
                ) : null}
                {selectedFromLocationId ? (
                  <p className="text-xs text-muted-foreground">
                    Destination must be different from source location.
                  </p>
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
                {selectedProductId && selectedFromLocationId ? (
                  <p className="text-xs text-muted-foreground">
                    On hand:{' '}
                    {formatBaseQuantityWithBestUnits(sourceOnHandBase, selectedProductConversions)}{' '}
                    | Committed:{' '}
                    {formatBaseQuantityWithBestUnits(
                      committedTransferBase,
                      selectedProductConversions,
                    )}{' '}
                    | Available:{' '}
                    {formatBaseQuantityWithBestUnits(
                      availableToTransferBase,
                      selectedProductConversions,
                    )}
                  </p>
                ) : null}
                {selectedProductId && selectedFromLocationId ? (
                  <p className="text-xs text-muted-foreground">
                    Max transferable now:{' '}
                    {formatBaseQuantityWithBestUnits(
                      availableToTransferBase,
                      selectedProductConversions,
                    )}
                  </p>
                ) : null}
                {exceedsAvailableTransfer ? (
                  <p className="text-sm text-destructive">
                    Requested quantity exceeds available source stock.
                  </p>
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
                <Button type="submit" disabled={isSubmitting || exceedsAvailableTransfer}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? 'Creating...' : submitButtonText}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/inventory/stock-transfers')}
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
