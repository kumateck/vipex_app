import { Camera, CameraOff, QrCode } from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { ParcelHandoverNoteAction } from '@/features/operations/parcel-handover-note';
import { isBarcodeDetectorAvailable, QrScanner } from './qr-scanner';
import { useParcelReceiveWorkflow } from './use-parcel-receive-workflow';
import { useParcelReceiveColumns } from './use-parcel-receive-columns';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function ParcelReceivePage() {
  const workflow = useParcelReceiveWorkflow();
  const {
    branchName,
    scannerEnabled,
    setScannerEnabled,
    lastScannedCode,
    countdown,
    scanSuccessFlash,
    manualSearchInput,
    setManualSearchInput,
    manualQuery,
    manualResults,
    manualRows,
    manualServerFilters,
    isManualLoading,
    isUpdating,
    handleManualRequestChange,
    handleDetectedByScanner,
    submitManualSearch,
    criticalParcel,
    dismissCriticalParcel,
    confirmCriticalParcel,
  } = workflow;
  const manualColumns = useParcelReceiveColumns(workflow);

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan to Receive</CardTitle>
              <CardDescription>
                Scan the parcel sticker to mark arrival. Parcels with a critical note pause for
                review.
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
                  {scannerEnabled ? (
                    <CameraOff className="h-4 w-4" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {scannerEnabled ? 'Stop Scanner' : 'Start Scanner'}
                </Button>
              </div>

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

          <Card>
            <CardHeader>
              <CardTitle>Manual Receive</CardTitle>
              <CardDescription>
                Search by tracking code, booking code, sender/receiver name or telephone, then
                confirm receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="flex items-center gap-2" onSubmit={submitManualSearch}>
                <Input
                  value={manualSearchInput}
                  onChange={(event) => setManualSearchInput(event.target.value)}
                  placeholder="Enter tracking, booking, sender/receiver name or phone"
                  className="h-11 text-base"
                />
                <Button
                  type="submit"
                  className="h-11 px-6"
                  disabled={manualSearchInput.trim().length === 0}
                >
                  Search
                </Button>
              </form>

              {manualQuery.search && manualQuery.search.trim().length > 0 ? (
                <DataTable
                  mode="server"
                  data={manualRows}
                  columns={manualColumns}
                  meta={manualResults?.meta ?? EMPTY_META}
                  loading={isManualLoading}
                  showSearch={false}
                  serverFilters={manualServerFilters}
                  onRequestChange={handleManualRequestChange}
                  enableVirtualization={false}
                />
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
                  Run a search to render matching incoming in-transit parcels.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>
    </div>
  );
}
