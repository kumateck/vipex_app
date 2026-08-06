import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Spinner } from '@/components/ui/spinner';
import { useGetStockTransferQuery } from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { useAuthStore } from '@/stores/auth-store';
import { StockLoadError } from '../stock-load-error';
import { useAcknowledgeStockTransferReceiptAction } from '../../hooks/use-stock-actions';
import { StockTransferReceiveForm } from './stock-transfer-receive-form';

export function StockTransferReceivePage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);

  const { data: transfer, isLoading, error } = useGetStockTransferQuery(id, { skip: !id });
  const { data: productsData = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { onSubmit, isSubmitting } = useAcknowledgeStockTransferReceiptAction(id);

  const product = productsData.find((row) => row.id === transfer?.productId);
  const conversionRows = useMemo(
    () =>
      (product?.unitConversions ?? []).map((item) => ({
        unitOfMeasure: item.unitOfMeasure,
        factorToBase: Number.parseInt(item.factorToBase, 10),
      })),
    [product?.unitConversions],
  );
  const baseUnitOfMeasure = product?.unitOfMeasure ?? 0;
  const pendingAckBase = Number(
    transfer?.acceptance?.pendingToAcknowledge ?? transfer?.fulfilledQuantity ?? 0,
  );
  const remainingToFulfillBase = Math.max(
    0,
    Number(transfer?.quantity ?? 0) - Number(transfer?.fulfilledQuantity ?? 0),
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
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

  if (error || !transfer) {
    return (
      <ScrollableWrapper>
        <StockLoadError
          message="Failed to load stock transfer receiving details"
          onBack={() => navigate('/inventory/stock-transfers')}
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
              <CardTitle>Receive stock transfer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Product:</span> {product?.name ?? transfer.productId}
              </p>
              <p>
                <span className="font-medium">From:</span>{' '}
                {locationNameById.get(transfer.fromLocationId) ?? transfer.fromLocationId}
              </p>
              <p>
                <span className="font-medium">To:</span>{' '}
                {locationNameById.get(transfer.toLocationId) ?? transfer.toLocationId}
              </p>
              <p>
                <span className="font-medium">Requested:</span>{' '}
                {formatBaseQuantityWithBestUnits(transfer.quantity, conversionRows)}
              </p>
              <p>
                <span className="font-medium">Fulfilled:</span>{' '}
                {formatBaseQuantityWithBestUnits(transfer.fulfilledQuantity, conversionRows)}
              </p>
              <p>
                <span className="font-medium">Pending receipt acknowledgement:</span>{' '}
                {formatBaseQuantityWithBestUnits(String(pendingAckBase), conversionRows)}
              </p>
            </CardContent>
          </Card>

          <StockTransferReceiveForm
            transfer={transfer}
            conversionRows={conversionRows}
            baseUnitOfMeasure={baseUnitOfMeasure}
            pendingAckBase={pendingAckBase}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
          {pendingAckBase <= 0 && remainingToFulfillBase > 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm">
                <p className="mb-3 text-muted-foreground">
                  Nothing is ready to acknowledge yet. First dispatch/fulfill quantity from source
                  location, then return here to acknowledge receipt.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/inventory/stock-transfers/edit/${transfer.id}`}>
                    Open dispatch / fulfill
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </ScrollableWrapper>
  );
}
