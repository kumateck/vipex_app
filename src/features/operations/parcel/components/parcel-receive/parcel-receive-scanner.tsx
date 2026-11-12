import { Camera, CameraOff, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ParcelHandoverNoteAction } from '@/features/operations/parcel-handover-note';
import { ReceivingOfficeField } from '@/features/operations/parcel-receiving-office';
import { isBarcodeDetectorAvailable, QrScanner } from './qr-scanner';
import type { useParcelReceiveWorkflow } from './use-parcel-receive-workflow';

export function ParcelReceiveScanner({
  workflow,
}: {
  workflow: ReturnType<typeof useParcelReceiveWorkflow>;
}) {
  const {
    branchName,
    scannerEnabled,
    setScannerEnabled,
    lastScannedCode,
    countdown,
    scanSuccessFlash,
    isUpdating,
    handleDetectedByScanner,
    criticalParcel,
    dismissCriticalParcel,
    confirmCriticalParcel,
  } = workflow;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan to Receive</CardTitle>
        <CardDescription>
          Scan the parcel sticker to mark arrival. Parcels with a critical note pause for review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Destination Branch: {branchName}</Badge>
          <Button
            variant="outline"
            onClick={() => setScannerEnabled((prev) => !prev)}
            className="gap-2"
          >
            {scannerEnabled ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {scannerEnabled ? 'Stop Scanner' : 'Start Scanner'}
          </Button>
        </div>

        <ReceivingOfficeField
          {...workflow.office}
          allowAutomatic
          disabled={isUpdating || countdown !== null}
        />

        <div className="relative">
          {scannerEnabled && !criticalParcel && isBarcodeDetectorAvailable() ? (
            <QrScanner enabled={scannerEnabled} onDetected={handleDetectedByScanner} />
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {criticalParcel
                ? 'Review the scanned parcel before continuing.'
                : 'Scanner is off or unsupported in this browser. Use manual search below.'}
            </div>
          )}
          {scanSuccessFlash ? (
            <div className="pointer-events-none absolute inset-0 rounded-md border-2 border-emerald-500 bg-emerald-500/15" />
          ) : null}
        </div>

        <div className="rounded-md border p-3 text-sm space-y-1">
          <p className="font-medium flex items-center gap-2">
            <QrCode className="h-4 w-4" /> Last Scan
          </p>
          <p className="text-muted-foreground">Code: {lastScannedCode ?? '-'}</p>
          <p className="text-muted-foreground">
            {criticalParcel
              ? 'Arrival confirmation required'
              : countdown != null
                ? `Checking scan in ${countdown}s…`
                : 'Awaiting scan'}
          </p>
        </div>
        {criticalParcel ? (
          <section
            className="space-y-3 rounded-md border border-destructive/40 p-3"
            aria-label="Scanned parcel with a critical note"
          >
            <p className="text-sm font-medium">{criticalParcel.bookingCode}</p>
            <ParcelHandoverNoteAction
              parcelId={criticalParcel.id}
              hasHandoverNote={criticalParcel.hasHandoverNote}
              handoverNoteCritical={criticalParcel.handoverNoteCritical}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void confirmCriticalParcel()} disabled={isUpdating}>
                Mark arrived
              </Button>
              <Button variant="outline" onClick={dismissCriticalParcel} disabled={isUpdating}>
                Dismiss scan
              </Button>
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
