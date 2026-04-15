import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { StockTransferFormFields } from './stock-transfer-form-fields';

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
            <StockTransferFormFields
              control={control}
              register={register}
              errors={errors}
              products={products}
              locations={locations}
              selectedFromLocationId={selectedFromLocationId}
              selectedProductId={selectedProductId}
              selectedProductUnitOfMeasure={selectedProduct?.unitOfMeasure ?? 0}
              selectedProductConversions={selectedProductConversions}
              unitOptions={unitOptions}
              isLoadingProducts={isLoadingProducts}
              isLoadingLocations={isLoadingLocations}
              sourceOnHandBase={sourceOnHandBase}
              committedTransferBase={committedTransferBase}
              availableToTransferBase={availableToTransferBase}
              exceedsAvailableTransfer={exceedsAvailableTransfer}
              isSubmitting={isSubmitting}
              submitButtonText={submitButtonText}
              onCancel={() => navigate('/inventory/stock-transfers')}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
