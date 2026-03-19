import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useGetStockLevelQuery } from '@/features/inventory/api';
import { StockLoadError } from '../components/stock-load-error';
import { getInventoryStockErrorMessage } from '../utils/inventory-stock-error';

const OPTIONS_PAGE_SIZE = 100;

export function StockLevelDetailPage() {
  const { productId, locationId } = useParams<{ productId: string; locationId: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/inventory/stock-levels');
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);

  const { data, isLoading, isError, error } = useGetStockLevelQuery(
    { productId: productId ?? '', locationId: locationId ?? '' },
    { skip: !productId || !locationId },
  );

  const productQuery = useMemo(
    () => ({ page: 1, pageSize: OPTIONS_PAGE_SIZE, filters: { companyId } }),
    [companyId],
  );
  const locationQuery = useMemo(
    () => ({ page: 1, pageSize: OPTIONS_PAGE_SIZE, filters: { companyId } }),
    [companyId],
  );

  const { data: productsData } = useListInventoryProductsQuery(productQuery, { skip: !companyId });
  const { data: locationsData } = useListInventoryLocationsQuery(locationQuery, { skip: !companyId });

  const productNameById = useMemo(
    () => new Map((productsData?.data ?? []).map((product) => [product.id, product.name] as const)),
    [productsData],
  );
  const locationNameById = useMemo(
    () => new Map((locationsData?.data ?? []).map((location) => [location.id, location.name] as const)),
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

  const productName = productNameById.get(data.productId) ?? data.productId;
  const locationName = locationNameById.get(data.locationId) ?? data.locationId;

  return (
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
            <span className="font-medium">Quantity:</span> {data.quantity}
          </p>
          <p>
            <span className="font-medium">Updated:</span> {data.updatedAt ?? '-'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
