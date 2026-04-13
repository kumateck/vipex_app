import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useGetStockLevelQuery } from '@/features/inventory/api';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { StockLoadError } from '../../components/stock-load-error';
import { getInventoryStockErrorMessage } from '../../utils/inventory-stock-error';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function StockLevelDetailPage() {
  const { productId, locationId } = useParams<{ productId: string; locationId: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/inventory/stock-levels');
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);

  const { data, isLoading, isError, error } = useGetStockLevelQuery(
    { productId: productId ?? '', locationId: locationId ?? '' },
    { skip: !productId || !locationId },
  );

  const { data: productsData = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locationsData = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const productNameById = useMemo(
    () => new Map(productsData.map((product) => [product.id, product.name] as const)),
    [productsData],
  );
  const productConversionsById = useMemo(
    () =>
      new Map(productsData.map((product) => [product.id, product.unitConversions ?? []] as const)),
    [productsData],
  );
  const locationNameById = useMemo(
    () => new Map(locationsData.map((location) => [location.id, location.name] as const)),
    [locationsData],
  );

  if (!productId || !locationId) {
    return <StockLoadError message="Invalid stock level" onBack={handleBack} />;
  }

  if (isError) {
    return (
      <StockLoadError
        message={getInventoryStockErrorMessage(error, 'Failed to load stock level')}
        onBack={handleBack}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="w-full max-w-lg mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Stock level</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Loading stock level...
          </CardContent>
        </Card>
      </div>
    );
  }

  const productName = productNameById.get(data.productId) ?? 'Unknown product';
  const locationName = locationNameById.get(data.locationId) ?? 'Unknown location';

  return (
    <ScrollableWrapper>
      <div className="w-full max-w-lg mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Stock level</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Product:</span> {productName}
            </p>
            <p>
              <span className="font-medium">Location:</span> {locationName}
            </p>
            <p>
              <span className="font-medium">Quantity:</span>{' '}
              {formatBaseQuantityWithBestUnits(
                data.quantity,
                (productConversionsById.get(data.productId) ?? []).map((conversion) => ({
                  unitOfMeasure: conversion.unitOfMeasure,
                  factorToBase: Number.parseInt(conversion.factorToBase, 10),
                })),
              )}
            </p>
            <p>
              <span className="font-medium">Updated:</span> {data.updatedAt ?? '-'}
            </p>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
