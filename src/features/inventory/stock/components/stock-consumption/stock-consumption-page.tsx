import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import { InventoryLocationType, StockMovementType } from '@/db/schemas/enums';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import {
  useCreateStockMovementMutation,
  useGetStockLevelQuery,
  useListStockMovementsQuery,
} from '@/features/inventory/api';
import { UNIT_OF_MEASURE_OPTIONS } from '@/features/inventory/products/components/inventory-product-columns';
import { useAuthStore } from '@/stores/auth-store';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { convertToBaseUnits } from '@/shared/inventory/unit-conversion';
import { StockConsumptionHistoryTable } from './stock-consumption-history-table';
const CONSUMPTION_REFERENCE_TYPE = 'stock_consumption';
export function StockConsumptionPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState(0);
  const [notes, setNotes] = useState('');
  const { data: products = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: consumptionLocations = [] } = useListInventoryLocationOptionsQuery(
    {
      companyId,
      branchId,
      locationType: InventoryLocationType.CONSUMPTION_LOCATION,
    },
    { skip: !companyId || !branchId },
  );

  useEffect(() => {
    const singleLocation = consumptionLocations.length === 1 ? consumptionLocations[0] : null;
    if (!locationId && singleLocation) {
      setLocationId(singleLocation.id);
    }
  }, [consumptionLocations, locationId]);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === productId),
    [products, productId],
  );
  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name] as const)),
    [products],
  );
  const locationNameById = useMemo(
    () => new Map(consumptionLocations.map((location) => [location.id, location.name] as const)),
    [consumptionLocations],
  );
  const productConversionsById = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          (product.unitConversions ?? []).map((item) => ({
            unitOfMeasure: item.unitOfMeasure,
            factorToBase: Number(item.factorToBase),
          })),
        ]),
      ),
    [products],
  );

  const unitOptions = useMemo(() => {
    if (!selectedProduct) return UNIT_OF_MEASURE_OPTIONS;
    const conversions = selectedProduct.unitConversions ?? [
      { unitOfMeasure: selectedProduct.unitOfMeasure, factorToBase: '1' },
    ];
    return [...conversions]
      .sort((a, b) => Number(a.factorToBase) - Number(b.factorToBase))
      .map((item) => UNIT_OF_MEASURE_OPTIONS.find((option) => option.value === item.unitOfMeasure))
      .filter((item): item is (typeof UNIT_OF_MEASURE_OPTIONS)[number] => Boolean(item));
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) setQuantityUnit(selectedProduct.unitOfMeasure);
  }, [selectedProduct]);

  const { data: stockLevel } = useGetStockLevelQuery(
    { productId, locationId },
    { skip: !productId || !locationId },
  );

  const [createStockMovement, { isLoading: isSubmitting }] = useCreateStockMovementMutation();

  const { data: movementsData, refetch: refetchMovements } = useListStockMovementsQuery(
    {
      page: 1,
      pageSize: 20,
      filters: {
        companyId,
        branchId,
        locationType: InventoryLocationType.CONSUMPTION_LOCATION,
        locationId: locationId || undefined,
        movementType: StockMovementType.ISSUE,
      },
      sort: [{ field: 'createdAt', direction: 'desc' }],
    },
    { skip: !companyId || !branchId },
  );

  const consumptionRows = useMemo(
    () =>
      (movementsData?.data ?? [])
        .filter((row) => row.referenceType === CONSUMPTION_REFERENCE_TYPE)
        .map((row) => ({
          ...row,
          productName: row.productName ?? productNameById.get(row.productId) ?? null,
          locationName: row.locationName ?? locationNameById.get(row.locationId) ?? null,
        })),
    [locationNameById, movementsData?.data, productNameById],
  );

  const availableBase = Number(stockLevel?.quantity ?? 0);
  const selectedProductConversions = useMemo(
    () =>
      (selectedProduct?.unitConversions ?? []).map((item) => ({
        unitOfMeasure: item.unitOfMeasure,
        factorToBase: Number(item.factorToBase),
      })),
    [selectedProduct?.unitConversions],
  );
  const baseUnitLabel = useMemo(() => {
    const baseUnit = selectedProduct?.unitOfMeasure;
    const option = UNIT_OF_MEASURE_OPTIONS.find((item) => item.value === baseUnit);
    return option?.label?.toLowerCase() ?? 'unit';
  }, [selectedProduct?.unitOfMeasure]);
  const availableQuantityText = useMemo(() => {
    const pretty = formatBaseQuantityWithBestUnits(
      String(availableBase),
      selectedProductConversions,
    );
    return `${pretty} (${availableBase} ${baseUnitLabel})`;
  }, [availableBase, baseUnitLabel, selectedProductConversions]);

  const handleSubmit = async () => {
    if (!selectedProduct || !locationId) {
      toast.error('Select product and consumption location.');
      return;
    }
    if (!/^\d+(\.\d+)?$/.test(quantity) || Number(quantity) <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }

    const conversionRows = (
      selectedProduct.unitConversions ?? [
        { unitOfMeasure: selectedProduct.unitOfMeasure, factorToBase: '1' },
      ]
    ).map((item) => ({
      unitOfMeasure: item.unitOfMeasure,
      factorToBase: Number(item.factorToBase),
    }));

    const baseQuantity = convertToBaseUnits(Number(quantity), quantityUnit, conversionRows);
    if (baseQuantity > availableBase) {
      toast.error('Consumption quantity exceeds available stock.');
      return;
    }

    try {
      await createStockMovement({
        productId,
        locationId,
        movementType: StockMovementType.ISSUE,
        quantity: String(baseQuantity),
        referenceType: CONSUMPTION_REFERENCE_TYPE,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success('Stock consumption recorded.');
      setQuantity('');
      setNotes('');
      void refetchMovements();
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'data' in error
          ? (error as { data?: { error?: { message?: string } } }).data?.error?.message
          : undefined;
      toast.error(message || 'Failed to consume stock.');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Consume Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field>
                  <FieldLabel>Product</FieldLabel>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Consumption location</FieldLabel>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {consumptionLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field>
                  <FieldLabel>Quantity</FieldLabel>
                  <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Quantity unit</FieldLabel>
                  <Select
                    value={String(quantityUnit)}
                    onValueChange={(value) => setQuantityUnit(Number(value))}
                  >
                    <SelectTrigger>
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
                </Field>
              </div>

              <Field>
                <FieldLabel>Notes</FieldLabel>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional reason or context"
                />
              </Field>
            </FieldGroup>

            <div className="text-sm text-muted-foreground">Available: {availableQuantityText}</div>

            <div className="flex justify-end">
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Record consumption'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <StockConsumptionHistoryTable
          rows={consumptionRows}
          productConversionsById={productConversionsById}
        />
      </div>
    </ScrollableWrapper>
  );
}
