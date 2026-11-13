import { ParcelPickupOffice } from '@/features/operations/parcel-receiving-office';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReceiptDeliveryPicker } from '@/features/digital-receipts';
import type { ReceiverHandoverWatchKey } from '@/shared/shipments/receiver-cashier-signature';
import { ParcelReceiptActions } from '../../parcel-receipt-actions';
import {
  useConfirmSignedReceiverHandover,
  useReceiverHandoverList,
  useTopazHandoverCapture,
} from '../hooks';
import { useGetReceiverHandoverPreviewQuery } from '../services';

export function ReceiverHandoverDialogContent({
  pending,
  onClose,
}: {
  pending: ReceiverHandoverWatchKey;
  onClose: () => void;
}) {
  const live = useReceiverHandoverList('', undefined, pending);
  const row = live?.page?.rows[0];
  const topaz = useTopazHandoverCapture();
  const isDesktop = typeof window !== 'undefined' && Boolean(window.api?.printHtml);
  const { submit, saving, finished, receipt, delivery } = useConfirmSignedReceiverHandover(
    row,
    onClose,
  );
  const preview = useGetReceiverHandoverPreviewQuery(
    row?.signedAt && isDesktop && !finished
      ? { parcelId: row.id, handoverId: row.handoverId }
      : { parcelId: '', handoverId: '' },
    { skip: !row?.signedAt || !isDesktop || finished },
  );
  const ready = Boolean(row?.signedAt);
  const captureBusy = Boolean(topaz.activeId);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  let status = 'Loading the handover…';
  if (saving) status = 'Confirming receipt…';
  else if (row && ready) {
    status = isDesktop
      ? 'Signature received. Review it and confirm when the customer has the parcel.'
      : 'Signature received. Confirm and print from Vipex Desktop.';
  } else if (row) {
    status = topaz.available
      ? 'Payment recorded. Ask the customer to sign on mobile or on the connected Topaz pad.'
      : 'Payment recorded. Ask the customer to sign in Receiver Signatures on mobile.';
  } else if (live?.failed) status = 'Unable to refresh the handover. Retrying…';
  else if (live?.page)
    status = 'This handover is no longer pending. Check the Receiver Cashier list.';

  return (
    <>
      <DialogHeader>
        <DialogTitle ref={heading} tabIndex={-1}>
          {finished ? 'Parcel delivered' : ready ? 'Confirm parcel received' : 'Receiver signature'}
        </DialogTitle>
        <DialogDescription>
          {row ? `${row.trackingCode} · ${row.collectorName}` : 'Receiver Cashier handover'}
        </DialogDescription>
        {row ? <ParcelPickupOffice parcel={row} className="text-sm text-muted-foreground" /> : null}
      </DialogHeader>
      {finished ? (
        <p role="status">Preparing the receipt…</p>
      ) : (
        <>
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
          {row && !ready && topaz.available ? (
            <Button
              variant="secondary"
              disabled={captureBusy}
              onClick={() => void topaz.capture(row)}
            >
              {captureBusy ? 'Capturing…' : 'Sign on Topaz'}
            </Button>
          ) : null}
          {ready && isDesktop ? (
            <>
              {preview.currentData ? (
                <img
                  className="max-h-36 rounded-md border bg-white object-contain"
                  src={preview.currentData.signatureImage}
                  alt={`Signature from ${row?.collectorName ?? 'customer'}`}
                />
              ) : preview.isError ? (
                <Button variant="secondary" onClick={() => void preview.refetch()}>
                  Retry loading signature
                </Button>
              ) : (
                <p role="status">Loading signature…</p>
              )}
              <ReceiptDeliveryPicker delivery={delivery} disabled={saving} />
            </>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={saving || captureBusy}>
              Close
            </Button>
            {isDesktop ? (
              <Button
                onClick={() => void submit()}
                disabled={!ready || !preview.currentData || saving || captureBusy}
              >
                {saving ? 'Confirming…' : 'Confirm Received'}
              </Button>
            ) : null}
          </DialogFooter>
        </>
      )}
      {receipt.printData ? (
        <ParcelReceiptActions
          data={receipt.printData}
          autoPrint
          autoPrintSelection="invoice"
          mode="receiver-payment"
          onAutoPrintComplete={onClose}
        />
      ) : null}
    </>
  );
}
