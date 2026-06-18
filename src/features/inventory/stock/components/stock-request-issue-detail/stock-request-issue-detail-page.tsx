import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { StockRequestStatus } from '@/db/schemas/enums';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Spinner } from '@/components/ui/spinner';
import {
  useFulfillStockRequestLineMutation,
  useGetStockRequestQuery,
  useListStockLevelsQuery,
} from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { formatDateTime } from '@/lib/date';
import { useAuthStore } from '@/stores/auth-store';
import {
  stockRequestStatusLabelByValue,
  stockRequestTypeLabelByValue,
} from '../../constants/stock-options';
import { getInventoryStockErrorMessage } from '../../utils/inventory-stock-error';
import { StockLoadError } from '../stock-load-error';
import { StockRequestIssueLinesTable } from './stock-request-issue-lines-table';
import { StockRequestIssueQuantityDialog } from './stock-request-issue-quantity-dialog';

export function StockRequestIssueDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [dialogLineId, setDialogLineId] = useState<string | null>(null);
  const [issueBaseByLineId, setIssueBaseByLineId] = useState<Record<string, number>>({});
  const [fulfillLine, { isLoading: isSubmitting }] = useFulfillStockRequestLineMutation();
  const { data: request, isLoading, error } = useGetStockRequestQuery(id, { skip: !id });

  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: products = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const issuingLocationId = request?.requestedToLocationId ?? null;
  const { data: issuingStockLevels } = useListStockLevelsQuery(
    {
      page: 1,
      pageSize: 100,
      filters: {
        companyId,
        locationId: issuingLocationId,
      },
    },
    { skip: !companyId || !issuingLocationId },
  );

  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
  );
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product] as const)),
    [products],
  );
  const availableBaseByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of issuingStockLevels?.data ?? []) {
      const prev = map.get(row.productId) ?? 0;
      map.set(row.productId, prev + Number(row.quantity ?? 0));
    }
    return map;
  }, [issuingStockLevels?.data]);

  const lines = request?.lines ?? [];
  const plannedByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of lines) {
      const planned = Math.max(0, issueBaseByLineId[line.id] ?? 0);
      const prev = map.get(line.productId) ?? 0;
      map.set(line.productId, prev + planned);
    }
    return map;
  }, [issueBaseByLineId, lines]);

  const getAvailableBaseForLine = (line: { id: string; productId: string }) => {
    const productAvailable = availableBaseByProductId.get(line.productId) ?? 0;
    const reservedForOtherLines =
      (plannedByProductId.get(line.productId) ?? 0) - (issueBaseByLineId[line.id] ?? 0);
    return Math.max(0, productAvailable - Math.max(0, reservedForOtherLines));
  };

  const selectedLine = useMemo(
    () => lines.find((line) => line.id === dialogLineId) ?? null,
    [dialogLineId, lines],
  );
  const selectedProduct = selectedLine ? productById.get(selectedLine.productId) : null;
  const selectedRemainingBase = selectedLine
    ? Math.max(0, Number(selectedLine.requestedQuantity) - Number(selectedLine.fulfilledQuantity))
    : 0;
  const selectedAvailableBase = selectedLine ? getAvailableBaseForLine(selectedLine) : 0;
  const selectedIssueBase = selectedLine ? Math.max(0, issueBaseByLineId[selectedLine.id] ?? 0) : 0;
  const selectedUnitConversions = selectedProduct?.unitConversions?.length
    ? selectedProduct.unitConversions
    : [{ unitOfMeasure: selectedProduct?.unitOfMeasure ?? 0, factorToBase: '1' }];
  const linesToSubmit = lines.filter((line) => Math.max(0, issueBaseByLineId[line.id] ?? 0) > 0);
  const canSubmit = linesToSubmit.length > 0 && Boolean(issuingLocationId);

  const handleSubmitIssue = async () => {
    if (!issuingLocationId) {
      toast.error('Issuing location is missing on this request.');
      return;
    }
    if (linesToSubmit.length === 0) {
      toast.error('Set an issue quantity for at least one line.');
      return;
    }

    try {
      for (const line of linesToSubmit) {
        await fulfillLine({
          requestId: id,
          body: {
            lineId: line.id,
            fromLocationId: issuingLocationId,
            fulfillQuantity: String(Math.max(0, issueBaseByLineId[line.id] ?? 0)),
          },
        }).unwrap();
      }
      setIssueBaseByLineId({});
      toast.success('Stock issue submitted successfully');
    } catch (submitError) {
      toast.error(getInventoryStockErrorMessage(submitError));
    }
  };

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
        <StockLoadError onBack={() => navigate('/inventory/stock-requests/issue')} />
      </ScrollableWrapper>
    );
  }

  const canFulfill =
    request.status === StockRequestStatus.SUBMITTED ||
    request.status === StockRequestStatus.APPROVED ||
    request.status === StockRequestStatus.PARTIALLY_FULFILLED;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Issue stock request</CardTitle>
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
                <Link to="/inventory/stock-requests/issue">Back to issue queue</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <StockRequestIssueLinesTable
          lines={lines}
          productById={productById}
          issueBaseByLineId={issueBaseByLineId}
          getAvailableBaseForLine={getAvailableBaseForLine}
          canFulfill={canFulfill}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onOpenFulfillDialog={setDialogLineId}
          onSubmitIssue={handleSubmitIssue}
        />
      </div>
      <StockRequestIssueQuantityDialog
        open={Boolean(selectedLine)}
        onOpenChange={(open) => {
          if (!open) setDialogLineId(null);
        }}
        productId={selectedLine?.productId ?? ''}
        productName={selectedProduct?.name ?? selectedLine?.productId ?? 'Product'}
        remainingBase={selectedRemainingBase}
        availableBase={selectedAvailableBase}
        unitConversions={selectedUnitConversions}
        initialIssueBase={selectedIssueBase}
        onConfirm={(issueBase) => {
          if (!selectedLine) return;
          setIssueBaseByLineId((prev) => ({
            ...prev,
            [selectedLine.id]: issueBase,
          }));
        }}
      />
    </ScrollableWrapper>
  );
}
