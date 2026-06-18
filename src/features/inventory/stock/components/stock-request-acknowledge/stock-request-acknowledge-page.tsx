import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { useGetStockRequestQuery } from '@/features/inventory/api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { useAuthStore } from '@/stores/auth-store';
import { StockLoadError } from '../stock-load-error';
import { useAcknowledgeStockRequestLineAction } from '../../hooks/use-stock-actions';
import { StockRequestAcknowledgeForm } from './stock-request-acknowledge-form';

export function StockRequestAcknowledgePage() {
  const navigate = useNavigate();
  const { requestId = '', lineId = '' } = useParams<{ requestId: string; lineId: string }>();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const {
    data: request,
    isLoading,
    error,
  } = useGetStockRequestQuery(requestId, { skip: !requestId });
  const { data: productsData = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { onSubmit, isSubmitting } = useAcknowledgeStockRequestLineAction(requestId);

  const line = request?.lines?.find((row) => row.id === lineId);
  const product = productsData.find((row) => row.id === line?.productId);
  const pendingAckBase = Math.max(0, Number(line?.pendingAcknowledgementQuantity ?? 0));
  const conversionRows = useMemo(
    () =>
      (product?.unitConversions ?? []).map((item) => ({
        unitOfMeasure: item.unitOfMeasure,
        factorToBase: Number.parseInt(item.factorToBase, 10),
      })),
    [product?.unitConversions],
  );
  const baseUnitOfMeasure = product?.unitOfMeasure ?? 0;

  if (isLoading) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <Spinner />
        </div>
      </ScrollableWrapper>
    );
  }

  if (error || !request || !line) {
    return (
      <ScrollableWrapper>
        <StockLoadError
          message="Failed to load stock request acknowledgement details"
          onBack={() => navigate(`/inventory/stock-requests/receive/${requestId}`)}
        />
      </ScrollableWrapper>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acknowledge request line receipt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Product:</span> {product?.name ?? line.productId}
              </p>
              <p>
                <span className="font-medium">Fulfilled:</span>{' '}
                {formatBaseQuantityWithBestUnits(line.fulfilledQuantity, conversionRows)}
              </p>
              <p>
                <span className="font-medium">Already acknowledged:</span>{' '}
                {formatBaseQuantityWithBestUnits(line.acknowledgedQuantity ?? '0', conversionRows)}
              </p>
              <p>
                <span className="font-medium">Pending acknowledgement:</span>{' '}
                {formatBaseQuantityWithBestUnits(String(pendingAckBase), conversionRows)}
              </p>
            </CardContent>
          </Card>

          <StockRequestAcknowledgeForm
            requestId={requestId}
            lineId={lineId}
            pendingAckBase={pendingAckBase}
            conversionRows={conversionRows}
            baseUnitOfMeasure={baseUnitOfMeasure}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </ScrollableWrapper>
  );
}
