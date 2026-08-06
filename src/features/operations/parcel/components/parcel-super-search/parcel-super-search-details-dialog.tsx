import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useListAuditLogsQuery } from '@/features/audit/api';
import { type ParcelSearchRow, useGetParcelDetailsQuery } from '../../api/parcel.api';
import { ParcelInternalHolderBadge } from '../parcel-internal-holder-badge';
import { ParcelSuperSearchDispositionCard } from './parcel-super-search-disposition-card';
import { PARCEL_STATUS_LABELS } from './constants';
import { formatCurrency, formatParcelDate, paymentMethodLabel } from './utils';

type ParcelSuperSearchDetailsDialogProps = {
  parcelId: string | null;
  companyId: string | null;
  branchNameById: Map<string, string>;
  selectedParcelRow?: ParcelSearchRow;
  onClose: () => void;
};

function detailRow(label: string, value: string | number | null | undefined) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm" key={label}>
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">
        {value == null || value === '' ? '-' : String(value)}
      </span>
    </div>
  );
}

function branchLocationLabel(branchName?: string | null, locationName?: string | null) {
  const branch = branchName?.trim() || '-';
  const location = locationName?.trim() || '-';
  return `${branch} (${location})`;
}

export function ParcelSuperSearchDetailsDialog({
  parcelId,
  companyId,
  branchNameById,
  selectedParcelRow,
  onClose,
}: ParcelSuperSearchDetailsDialogProps) {
  const { data: parcelDetails, isFetching: isDetailsLoading } = useGetParcelDetailsQuery(
    parcelId ?? '',
    {
      skip: !parcelId,
    },
  );

  const { data: deletedAuditLogs } = useListAuditLogsQuery(
    {
      page: 1,
      pageSize: 1,
      sort: [{ field: 'createdAt', direction: 'desc' }],
      filters: {
        entityType: 'parcel',
        entityId: parcelId ?? undefined,
        action: 'PARCEL_SOFT_DELETED',
      },
    },
    { skip: !parcelId || !selectedParcelRow?.isDeleted },
  );

  return (
    <Dialog open={Boolean(parcelId)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Parcel Details</DialogTitle>
        </DialogHeader>

        {!parcelDetails || isDetailsLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading details...</div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parcel Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {parcelDetails.parcel.isDeleted ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    {(() => {
                      const deletedLog = deletedAuditLogs?.data?.[0];
                      const metadata =
                        deletedLog?.metadata && typeof deletedLog.metadata === 'object'
                          ? (deletedLog.metadata as { reason?: unknown })
                          : null;
                      const reason =
                        parcelDetails.parcel.deleteReason &&
                        parcelDetails.parcel.deleteReason.trim().length > 0
                          ? parcelDetails.parcel.deleteReason
                          : typeof metadata?.reason === 'string' &&
                              metadata.reason.trim().length > 0
                            ? metadata.reason
                            : 'No reason provided';
                      const deletedBy =
                        deletedLog?.actorUserName ?? deletedLog?.actorUserId ?? 'Unknown user';
                      return (
                        <span>
                          This parcel was deleted by <strong>{deletedBy}</strong> for reason:{' '}
                          <strong>{reason}</strong>. Please consult the person before proceeding.
                        </span>
                      );
                    })()}
                  </div>
                ) : null}
                {detailRow('Tracking', parcelDetails.parcel.trackingCode)}
                {detailRow('Booking', parcelDetails.parcel.bookingCode)}
                {detailRow(
                  'Status',
                  PARCEL_STATUS_LABELS[parcelDetails.parcel.status] ?? parcelDetails.parcel.status,
                )}
                {detailRow(
                  'Source',
                  branchLocationLabel(
                    selectedParcelRow?.sourceName ??
                      branchNameById.get(parcelDetails.parcel.sourceId),
                    selectedParcelRow?.sourceLocationName,
                  ),
                )}
                {detailRow(
                  'Destination',
                  branchLocationLabel(
                    selectedParcelRow?.destinationName ??
                      branchNameById.get(parcelDetails.parcel.destinationId),
                    selectedParcelRow?.pickupLocationName,
                  ),
                )}
                {detailRow(
                  'Route',
                  `${branchLocationLabel(
                    selectedParcelRow?.sourceName ??
                      branchNameById.get(parcelDetails.parcel.sourceId),
                    selectedParcelRow?.sourceLocationName,
                  )} -> ${branchLocationLabel(
                    selectedParcelRow?.destinationName ??
                      branchNameById.get(parcelDetails.parcel.destinationId),
                    selectedParcelRow?.pickupLocationName,
                  )}`,
                )}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground">Current Holder</span>
                  <div className="col-span-2">
                    <ParcelInternalHolderBadge holder={parcelDetails.internalHolder} />
                  </div>
                </div>
                {detailRow('Parcel Details', parcelDetails.parcel.parcelDetails)}
                {detailRow('Parcel Content', parcelDetails.parcel.parcelContent)}
                {detailRow('Charge', formatCurrency(parcelDetails.parcel.chargePsw))}
                {detailRow(
                  'Planned To Be Paid',
                  formatCurrency(parcelDetails.parcel.plannedToBePaidPsw),
                )}
                {detailRow('Payment Method', paymentMethodLabel(parcelDetails.parcel.method))}
                {detailRow('Created At', formatParcelDate(parcelDetails.parcel.createdAt))}
                {detailRow('Received At', formatParcelDate(parcelDetails.parcel.receivedAt))}
                {detailRow('Confirmed At', formatParcelDate(parcelDetails.parcel.confirmedAt))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Payment Records ({parcelDetails.payments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {parcelDetails.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments recorded.</p>
                ) : (
                  parcelDetails.payments.map((payment) => (
                    <div key={payment.id} className="space-y-1 rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {formatCurrency(payment.grossAmountPsw)}
                        </span>
                        <Badge variant="outline">Receipt: {payment.receiptNo ?? '-'}</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Received: {formatParcelDate(payment.receivedAt)}
                      </p>
                      <p className="text-muted-foreground">
                        Method: {paymentMethodLabel(payment.method)}
                      </p>
                      {payment.notes ? <p>Notes: {payment.notes}</p> : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!parcelDetails.delivery ? (
                  <p className="text-sm text-muted-foreground">No delivery record found.</p>
                ) : (
                  <>
                    {detailRow('Mode', parcelDetails.delivery.mode)}
                    {detailRow('Status', parcelDetails.delivery.status)}
                    {detailRow('Dropoff Address', parcelDetails.delivery.dropoffAddress)}
                    {detailRow('Delivery Charge', formatCurrency(parcelDetails.delivery.chargePsw))}
                    {detailRow('Amount Paid', formatCurrency(parcelDetails.delivery.amountPaidPsw))}
                    {detailRow(
                      'Delivered At',
                      formatParcelDate(parcelDetails.delivery.deliveredAt),
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <ParcelSuperSearchDispositionCard
              parcelId={parcelDetails.parcel.id}
              companyId={companyId}
              destinationBranchId={parcelDetails.parcel.destinationId}
              dispositionActions={parcelDetails.dispositionActions}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Consignment History ({parcelDetails.consignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {parcelDetails.consignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No consignment association found.</p>
                ) : (
                  parcelDetails.consignments.map((consignment) => (
                    <div
                      key={`${consignment.consignmentId}-${consignment.addedAt}`}
                      className="rounded-md border p-3 text-sm"
                    >
                      <p className="font-medium">{consignment.code}</p>
                      <p className="text-muted-foreground">
                        Date: {formatParcelDate(consignment.consignmentDate)}
                      </p>
                      <p className="text-muted-foreground">
                        Route: {branchNameById.get(consignment.sourceId) ?? '-'} to{' '}
                        {branchNameById.get(consignment.destinationId) ?? '-'}
                      </p>
                      <p className="text-muted-foreground">
                        Added: {formatParcelDate(consignment.addedAt)}
                      </p>
                      <p className="text-muted-foreground">
                        Removed: {formatParcelDate(consignment.removedAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
