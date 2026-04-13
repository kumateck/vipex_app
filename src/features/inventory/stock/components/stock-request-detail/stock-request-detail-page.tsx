import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { StockRequestStatus } from '@/db/schemas/enums';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Spinner } from '@/components/ui/spinner';
import {
  useGetStockRequestQuery,
  useSyncStockReservationsForRequestMutation,
} from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { formatDateTime } from '@/lib/date';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useAutoFulfillStockRequestLineAction,
  useApproveStockRequestAction,
  useRejectStockRequestAction,
  useSubmitStockRequestAction,
} from '../../hooks/use-stock-actions';
import { stockRequestStatusLabelByValue } from '../../constants/stock-options';
import { StockLoadError } from '../stock-load-error';
import { StockRequestLinesTable } from './stock-request-lines-table';
import { StockRequestRejectCard } from './stock-request-reject-card';

export function StockRequestDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [rejectionReason, setRejectionReason] = useState('');
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

  const { onSubmit: submitRequest, isSubmitting: isSubmittingRequest } =
    useSubmitStockRequestAction(id);
  const { onSubmit: approveRequest, isSubmitting: isApprovingRequest } =
    useApproveStockRequestAction(id);
  const { onSubmit: rejectRequest, isSubmitting: isRejectingRequest } =
    useRejectStockRequestAction(id);
  const { onSubmit: autoFulfillLine, isSubmitting: isAutoFulfilling } =
    useAutoFulfillStockRequestLineAction(id);
  const [syncReservations, { isLoading: syncingReservations }] =
    useSyncStockReservationsForRequestMutation();

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
        <StockLoadError onBack={() => navigate('/inventory/stock-requests')} />
      </ScrollableWrapper>
    );
  }

  const canSubmit = request.status === StockRequestStatus.DRAFT;
  const canApproveOrReject = request.status === StockRequestStatus.SUBMITTED;
  const canFulfill =
    request.status === StockRequestStatus.APPROVED ||
    request.status === StockRequestStatus.PARTIALLY_FULFILLED;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Stock request details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Status:</span>{' '}
              {stockRequestStatusLabelByValue.get(request.status) ?? String(request.status)}
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
              <span className="font-medium">Approved on:</span>{' '}
              {request.approvedAt ? formatDateTime(request.approvedAt) : '-'}
            </p>
            <p>
              <span className="font-medium">Rejected on:</span>{' '}
              {request.rejectedAt ? formatDateTime(request.rejectedAt) : '-'}
            </p>
            <p>
              <span className="font-medium">Rejection reason:</span>{' '}
              {request.rejectionReason ?? '-'}
            </p>
            <p>
              <span className="font-medium">Notes:</span> {request.notes ?? '-'}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {canSubmit ? (
                <PermissionGuard permissionKey={PermissionKeys.CanSubmitStockRequest}>
                  <Button onClick={submitRequest} disabled={isSubmittingRequest}>
                    {isSubmittingRequest ? <Spinner /> : null}
                    Submit request
                  </Button>
                </PermissionGuard>
              ) : null}
              {canApproveOrReject ? (
                <PermissionGuard permissionKey={PermissionKeys.CanApproveStockRequest}>
                  <Button onClick={approveRequest} disabled={isApprovingRequest}>
                    {isApprovingRequest ? <Spinner /> : null}
                    Approve
                  </Button>
                </PermissionGuard>
              ) : null}
              <PermissionGuard permissionKey={PermissionKeys.CanApproveStockRequest}>
                <Button
                  variant="outline"
                  onClick={() => syncReservations({ requestId: request.id })}
                  disabled={syncingReservations}
                >
                  {syncingReservations ? <Spinner /> : null}
                  Sync reservations
                </Button>
              </PermissionGuard>
              <Button variant="outline" asChild>
                <Link to="/inventory/stock-requests">Back to list</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {canApproveOrReject ? (
          <StockRequestRejectCard
            rejectionReason={rejectionReason}
            onRejectionReasonChange={setRejectionReason}
            onReject={() => rejectRequest({ reason: rejectionReason })}
            isRejectingRequest={isRejectingRequest}
          />
        ) : null}

        <StockRequestLinesTable
          request={request}
          productById={productById}
          canFulfill={canFulfill}
          isAutoFulfilling={isAutoFulfilling}
          onAutoFulfillLine={autoFulfillLine}
        />
      </div>
    </ScrollableWrapper>
  );
}
