import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParcelInternalTransferDetails } from '../../api/parcel.api';
import { printParcelInternalTransferSlip } from '../../utils/internal-transfer-print';
import { holderTypeLabel } from './parcel-internal-transfer-utils';

type ParcelInternalTransferDetailsCardProps = {
  details: ParcelInternalTransferDetails | undefined;
  selectedTransferId: string;
  isFetchingDetails: boolean;
  canAcknowledge: boolean | undefined;
  isAcknowledging: boolean;
  onAcknowledge: () => void;
};

export function ParcelInternalTransferDetailsCard({
  details,
  selectedTransferId,
  isFetchingDetails,
  canAcknowledge,
  isAcknowledging,
  onAcknowledge,
}: ParcelInternalTransferDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Details</CardTitle>
        <CardDescription>Review the parcel list before acknowledging receipt.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedTransferId ? (
          <p className="text-sm text-muted-foreground">Select a pending transfer to inspect it.</p>
        ) : isFetchingDetails ? (
          <p className="text-sm text-muted-foreground">Loading transfer details...</p>
        ) : !details ? (
          <p className="text-sm text-muted-foreground">Transfer details are unavailable.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {details.items.length} parcel{details.items.length === 1 ? '' : 's'}
              </Badge>
              <Badge variant="secondary">Pending acknowledgement</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Reference:</strong> {details.transfer.referenceNo ?? '-'}
              </p>
              <p>
                <strong>From:</strong>{' '}
                {details.transfer.sourceLocationName ??
                  details.transfer.sourceWarehouseName ??
                  holderTypeLabel(details.transfer.sourceHolderType)}
              </p>
              <p>
                <strong>To:</strong>{' '}
                {details.transfer.destinationLocationName ??
                  details.transfer.destinationWarehouseName ??
                  holderTypeLabel(details.transfer.destinationHolderType)}
              </p>
              <p>
                <strong>Transferred By:</strong> {details.transfer.transferredByName ?? '-'}
              </p>
              <p>
                <strong>Notes:</strong> {details.transfer.notes || '-'}
              </p>
            </div>
            <div className="space-y-3">
              {details.items.map((item) => (
                <div key={item.parcelId} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{item.trackingCode}</p>
                  <p className="text-muted-foreground">
                    {item.bookingCode} • {item.receiverName || '-'} • {item.parcelDetails}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void printParcelInternalTransferSlip(details)}
              >
                Print Transfer Slip
              </Button>
              {canAcknowledge ? (
                <Button onClick={onAcknowledge} disabled={isAcknowledging}>
                  {isAcknowledging ? 'Acknowledging...' : 'Acknowledge Receipt'}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
