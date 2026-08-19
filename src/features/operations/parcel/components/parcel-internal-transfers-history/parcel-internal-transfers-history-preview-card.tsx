import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParcelInternalTransferDetails } from '../../api/parcel.api';
import { printParcelInternalTransferSlip } from '../../utils/internal-transfer-print';
import { holderSummary, transferStatusLabel } from './parcel-internal-transfers-history-utils';

type ParcelInternalTransfersHistoryPreviewCardProps = {
  selectedTransferId: string;
  details: ParcelInternalTransferDetails | undefined;
  isFetchingDetails: boolean;
  onClosePreview: () => void;
};

export function ParcelInternalTransfersHistoryPreviewCard({
  selectedTransferId,
  details,
  isFetchingDetails,
  onClosePreview,
}: ParcelInternalTransfersHistoryPreviewCardProps) {
  if (!selectedTransferId) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Slip Preview</CardTitle>
        <CardDescription>
          Review the transfer note and print a handover slip for parcel movement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFetchingDetails ? (
          <p className="text-sm text-muted-foreground">Loading transfer details...</p>
        ) : !details ? (
          <p className="text-sm text-muted-foreground">Transfer details are unavailable.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{transferStatusLabel(details.transfer.status)}</Badge>
              <Badge variant="secondary">
                {details.items.length} parcel{details.items.length === 1 ? '' : 's'}
              </Badge>
            </div>

            <div className="grid gap-2 text-sm md:grid-cols-2">
              <p>
                <strong>Reference:</strong> {details.transfer.referenceNo ?? '-'}
              </p>
              <p>
                <strong>Transferred At:</strong> {details.transfer.transferredAt ?? '-'}
              </p>
              <p>
                <strong>From:</strong> {holderSummary(details.transfer, 'source')}
              </p>
              <p>
                <strong>To:</strong> {holderSummary(details.transfer, 'destination')}
              </p>
              <p>
                <strong>Transferred By:</strong> {details.transfer.transferredByName ?? '-'}
              </p>
              <p>
                <strong>Notes:</strong> {details.transfer.notes ?? '-'}
              </p>
            </div>

            <div className="space-y-3">
              {details.items.map((item) => (
                <div key={item.parcelId} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{item.bookingCode}</p>
                  <p className="text-muted-foreground">
                    {item.receiverName ?? '-'} • {item.parcelDetails}
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
              <Button variant="ghost" onClick={onClosePreview}>
                Close Preview
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
