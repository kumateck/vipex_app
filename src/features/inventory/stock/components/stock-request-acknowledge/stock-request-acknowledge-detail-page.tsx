import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { useGetStockRequestQuery } from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { formatDateTime } from '@/lib/date';
import { useAuthStore } from '@/stores/auth-store';
import {
  stockRequestStatusLabelByValue,
  stockRequestTypeLabelByValue,
} from '../../constants/stock-options';
import { StockLoadError } from '../stock-load-error';
import { StockRequestLinesTable } from '../stock-request-detail/stock-request-lines-table';

export function StockRequestAcknowledgeDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data: request, isLoading, error } = useGetStockRequestQuery(id, { skip: !id });

  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: products = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
  );
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product] as const)),
    [products],
  );

  if (isLoading) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <Spinner />
        </div>
      </ScrollableWrapper>
    );
  }

  if (error || !request) {
    return (
      <ScrollableWrapper>
        <StockLoadError onBack={() => navigate('/inventory/stock-requests/receive')} />
      </ScrollableWrapper>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Acknowledge issued request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Status:</span>{' '}
              {stockRequestStatusLabelByValue.get(request.status) ?? String(request.status)}
            </p>
            <p>
              <span className="font-medium">Request type:</span>{' '}
              {stockRequestTypeLabelByValue.get(request.requestType) ?? String(request.requestType)}
            </p>
            <p>
              <span className="font-medium">Requester location:</span>{' '}
              {locationNameById.get(request.requesterLocationId) ?? request.requesterLocationId}
            </p>
            <p>
              <span className="font-medium">Requested to:</span>{' '}
              {request.requestedToLocationId
                ? (locationNameById.get(request.requestedToLocationId) ??
                  request.requestedToLocationId)
                : '-'}
            </p>
            <p>
              <span className="font-medium">Requested on:</span>{' '}
              {request.createdAt ? formatDateTime(request.createdAt) : '-'}
            </p>
            <p>
              <span className="font-medium">Notes:</span> {request.notes ?? '-'}
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link to="/inventory/stock-requests/receive">Back to acknowledge queue</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <StockRequestLinesTable
          request={request}
          productById={productById}
          canFulfill={false}
          canAcknowledge
          isAutoFulfilling={false}
          onAutoFulfillLine={() => {}}
        />
      </div>
    </ScrollableWrapper>
  );
}
