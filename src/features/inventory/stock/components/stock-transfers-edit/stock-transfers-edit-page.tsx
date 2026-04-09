import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useGetStockTransferQuery } from '@/features/inventory/api';
import { StockTransferStatusForm } from '../../components/stock-transfer-status-form';
import { StockLoadError } from '../../components/stock-load-error';
import { useUpdateStockTransferAction } from '../../hooks/use-stock-actions';
import { getInventoryStockErrorMessage } from '../../utils/inventory-stock-error';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

const OPTIONS_PAGE_SIZE = 100;

export function StockTransfersEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleBack = () => navigate('/inventory/stock-transfers');
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);

  const {
    data: transfer,
    isLoading,
    isError,
    error,
  } = useGetStockTransferQuery(id ?? '', {
    skip: !id,
  });
  const { onSubmit, isSubmitting } = useUpdateStockTransferAction(id ?? '');

  const productQuery = useMemo(
    () => ({ page: 1, pageSize: OPTIONS_PAGE_SIZE, filters: { companyId } }),
    [companyId],
  );
  const locationQuery = useMemo(
    () => ({ page: 1, pageSize: OPTIONS_PAGE_SIZE, filters: { companyId } }),
    [companyId],
  );

  const { data: productsData } = useListInventoryProductsQuery(productQuery, { skip: !companyId });
  const { data: locationsData } = useListInventoryLocationsQuery(locationQuery, {
    skip: !companyId,
  });

  const productNameById = useMemo(
    () => new Map((productsData?.data ?? []).map((product) => [product.id, product.name] as const)),
    [productsData],
  );
  const productConversionsById = useMemo(
    () =>
      new Map(
        (productsData?.data ?? []).map(
          (product) => [product.id, product.unitConversions ?? []] as const,
        ),
      ),
    [productsData],
  );
  const locationNameById = useMemo(
    () =>
      new Map((locationsData?.data ?? []).map((location) => [location.id, location.name] as const)),
    [locationsData],
  );

  if (!id) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <StockLoadError message="Invalid stock transfer id" onBack={handleBack} />
        </div>
      </ScrollableWrapper>
    );
  }

  if (isError) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <StockLoadError
            message={getInventoryStockErrorMessage(error, 'Failed to load stock transfer')}
            onBack={handleBack}
          />
        </div>
      </ScrollableWrapper>
    );
  }

  if (isLoading || !transfer) {
    return (
      <ScrollableWrapper>
        <div className="w-full max-w-lg mx-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock transfer</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Loading stock transfer...
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <div className="mb-3 flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link to={`/inventory/stock-transfers/receive/${transfer.id}`}>
              Receive / Acknowledge
            </Link>
          </Button>
        </div>
        <StockTransferStatusForm
          transfer={transfer}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          title="Update stock transfer"
          submitButtonText="Save changes"
          productNameById={productNameById}
          productConversionsById={productConversionsById}
          locationNameById={locationNameById}
        />
      </div>
    </ScrollableWrapper>
  );
}
