import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { InventoryMaintenanceStatus } from '@/db/schemas/enums';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { useGetStockMaintenanceRecordQuery } from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useAuthStore } from '@/stores/auth-store';
import { StockMaintenanceResolveForm } from '../../components/stock-maintenance-resolve-form';
import { useResolveStockMaintenanceAction } from '../../hooks/use-stock-actions';
import {
  stockMaintenanceIssueTypeLabelByValue,
  stockMaintenanceStatusLabelByValue,
} from '../../constants/stock-options';

export function StockMaintenanceDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data, isLoading, error } = useGetStockMaintenanceRecordQuery(id, { skip: !id });
  const { onSubmit, isSubmitting } = useResolveStockMaintenanceAction(id);
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: productsData } = useListInventoryProductsQuery(
    { page: 1, pageSize: 500, filters: { companyId } },
    { skip: !companyId },
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((row) => [row.id, row.name] as const)),
    [locations],
  );
  const productNameById = useMemo(
    () => new Map((productsData?.data ?? []).map((row) => [row.id, row.name] as const)),
    [productsData],
  );

  if (isLoading) {
    return (
      <ScrollableWrapper>
        <div className="p-4">
          <Spinner />
        </div>
      </ScrollableWrapper>
    );
  }

  if (!data || error) {
    return (
      <ScrollableWrapper>
        <div className="p-4 space-y-3">
          <p className="text-destructive">Failed to load maintenance record</p>
          <Link className="underline" to="/inventory/stock-maintenance">
            Back to list
          </Link>
        </div>
      </ScrollableWrapper>
    );
  }

  const openQty = Math.max(
    0,
    Number(data.quantity) - Number(data.quantityReturned) - Number(data.quantityDisposed),
  );
  const isOpen = data.status === InventoryMaintenanceStatus.OPEN;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Record Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Product:</span>{' '}
              {productNameById.get(data.productId) ?? data.productId}
            </p>
            <p>
              <span className="font-medium">Location:</span>{' '}
              {locationNameById.get(data.locationId) ?? data.locationId}
            </p>
            <p>
              <span className="font-medium">Issue type:</span>{' '}
              {stockMaintenanceIssueTypeLabelByValue.get(data.issueType) ?? data.issueType}
            </p>
            <p>
              <span className="font-medium">Status:</span>{' '}
              {stockMaintenanceStatusLabelByValue.get(data.status) ?? data.status}
            </p>
            <p>
              <span className="font-medium">Recorded qty:</span> {data.quantity}
            </p>
            <p>
              <span className="font-medium">Returned qty:</span> {data.quantityReturned}
            </p>
            <p>
              <span className="font-medium">Disposed qty:</span> {data.quantityDisposed}
            </p>
            <p>
              <span className="font-medium">Open qty:</span> {openQty}
            </p>
            <p>
              <span className="font-medium">Notes:</span> {data.notes ?? '-'}
            </p>
            <div className="pt-2">
              <Link className="underline" to="/inventory/stock-maintenance">
                Back to list
              </Link>
            </div>
          </CardContent>
        </Card>

        {isOpen ? (
          <StockMaintenanceResolveForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
        ) : null}
      </div>
    </ScrollableWrapper>
  );
}
