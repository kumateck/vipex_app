import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Camera, CameraOff, QrCode } from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ParcelStatus } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useLazySearchParcelsQuery,
  useSearchParcelsQuery,
  useUpdateParcelStatusMutation,
} from '../api/parcel.api';

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function isBarcodeDetectorAvailable() {
  const maybe = globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor };
  return typeof maybe.BarcodeDetector === 'function';
}

function QrScanner({
  enabled,
  onDetected,
}: {
  enabled: boolean;
  onDetected: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onDetectedRef = useRef(onDetected);
  const lastDetectedRef = useRef<{ value: string; at: number } | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let isActive = true;
    let stream: MediaStream | null = null;
    let timeoutId: number | null = null;

    const maybe = globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor };
    const Detector = maybe.BarcodeDetector;

    if (!enabled) return;
    if (!Detector) {
      setScannerError('QR scanner is not supported on this browser. Use manual search below.');
      return;
    }

    const detector = new Detector({ formats: ['qr_code'] });

    const loop = async () => {
      if (!isActive) return;

      try {
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const barcodes = await detector.detect(video);
          const value = barcodes
            .find((barcode) => typeof barcode.rawValue === 'string')
            ?.rawValue?.trim();

          if (value) {
            const now = Date.now();
            const last = lastDetectedRef.current;
            const isDuplicate = last && last.value === value && now - last.at < 2000;
            if (!isDuplicate) {
              lastDetectedRef.current = { value, at: now };
              onDetectedRef.current(value);
            }
          }
        }
      } catch {
        // Ignore detection frame errors and keep scanning.
      }

      timeoutId = window.setTimeout(loop, 250);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        });

        if (!isActive) return;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        setScannerError(null);
        void loop();
      } catch {
        setScannerError('Unable to access camera. Check permissions or use manual search.');
      }
    })();

    return () => {
      isActive = false;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
    };
  }, [enabled]);

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-md border bg-black">
        <video ref={videoRef} className="h-[260px] w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-primary/60" />
      </div>
      {scannerError ? <p className="text-sm text-destructive">{scannerError}</p> : null}
    </div>
  );
}

export function ParcelReceivePage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const branchName = user?.branch?.name ?? '-';

  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [manualSearchInput, setManualSearchInput] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [scanSuccessFlash, setScanSuccessFlash] = useState(false);
  const manualServerFilters = useMemo(
    () => ({
      companyId,
      destinationId: branchId,
      status: ParcelStatus.IN_TRANSIT,
    }),
    [branchId, companyId],
  );
  const [manualQuery, setManualQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      destinationId?: string | null;
      status?: number | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: manualServerFilters,
  });

  const autoReceiveTimerRef = useRef<number | null>(null);
  const autoReceiveCountdownIntervalRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);

  const [searchParcelsTrigger] = useLazySearchParcelsQuery();
  const [updateParcelStatus, { isLoading: isUpdating }] = useUpdateParcelStatusMutation();

  const playSuccessBeep = useCallback(() => {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
      oscillator.onended = () => {
        void context.close();
      };
    } catch {
      // Ignore audio playback errors.
    }
  }, []);

  const triggerScanSuccessFeedback = useCallback(() => {
    playSuccessBeep();
    setScanSuccessFlash(true);
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = window.setTimeout(() => {
      setScanSuccessFlash(false);
    }, 700);
  }, [playSuccessBeep]);

  useEffect(() => {
    setManualQuery((prev) => ({
      ...prev,
      filters: manualServerFilters,
    }));
  }, [manualServerFilters]);

  const handleManualRequestChange = useCallback(
    (
      nextRequest: ServerListQuery<{
        companyId?: string | null;
        destinationId?: string | null;
        status?: number | null;
      }>,
    ) => {
      setManualQuery((prev) => ({
        ...prev,
        ...nextRequest,
        search: prev.search,
        filters: manualServerFilters,
      }));
    },
    [manualServerFilters],
  );

  const {
    data: manualResults,
    isLoading: isManualLoading,
    refetch: refetchManual,
  } = useSearchParcelsQuery(manualQuery, {
    skip: !companyId || !branchId || !manualQuery.search || manualQuery.search.trim().length === 0,
  });

  useEffect(() => {
    return () => {
      if (autoReceiveTimerRef.current !== null) window.clearTimeout(autoReceiveTimerRef.current);
      if (autoReceiveCountdownIntervalRef.current !== null)
        window.clearInterval(autoReceiveCountdownIntervalRef.current);
      if (flashTimeoutRef.current !== null) window.clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const findIncomingInTransitParcel = useCallback(
    async (searchValue: string): Promise<ParcelSearchRow | null> => {
      if (!companyId || !branchId) return null;

      const response = await searchParcelsTrigger({
        page: 1,
        pageSize: 20,
        search: searchValue,
        filters: {
          companyId,
          destinationId: branchId,
          status: ParcelStatus.IN_TRANSIT,
        },
      }).unwrap();

      if (!response.data.length) return null;

      const exact = response.data.find(
        (row) => row.trackingCode === searchValue || row.bookingCode === searchValue,
      );

      return exact ?? response.data[0] ?? null;
    },
    [branchId, companyId, searchParcelsTrigger],
  );

  const confirmReceive = useCallback(
    async (parcel: ParcelSearchRow, mode: 'scan' | 'manual') => {
      await updateParcelStatus({
        id: parcel.id,
        status: ParcelStatus.ARRIVED_AT_DESTINATION,
      }).unwrap();

      toast.success(
        mode === 'scan'
          ? `Parcel ${parcel.trackingCode} marked as ARRIVED_AT_DESTINATION`
          : `Received ${parcel.trackingCode}`,
      );

      if (manualQuery.search && manualQuery.search.trim().length > 0) {
        await refetchManual();
      }
    },
    [manualQuery.search, refetchManual, updateParcelStatus],
  );

  const handleDetectedByScanner = useCallback(
    async (code: string) => {
      setLastScannedCode(code);

      if (autoReceiveTimerRef.current !== null) window.clearTimeout(autoReceiveTimerRef.current);
      if (autoReceiveCountdownIntervalRef.current !== null)
        window.clearInterval(autoReceiveCountdownIntervalRef.current);

      setCountdown(3);
      autoReceiveCountdownIntervalRef.current = window.setInterval(() => {
        setCountdown((prev) => (prev && prev > 0 ? prev - 1 : null));
      }, 1000);

      autoReceiveTimerRef.current = window.setTimeout(async () => {
        if (autoReceiveCountdownIntervalRef.current !== null) {
          window.clearInterval(autoReceiveCountdownIntervalRef.current);
          autoReceiveCountdownIntervalRef.current = null;
        }
        setCountdown(null);

        try {
          const parcel = await findIncomingInTransitParcel(code);
          if (!parcel) {
            toast.error('No in-transit parcel to your branch matches the scanned code');
            return;
          }
          await confirmReceive(parcel, 'scan');
          triggerScanSuccessFeedback();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to receive scanned parcel');
        }
      }, 3000);
    },
    [confirmReceive, findIncomingInTransitParcel, triggerScanSuccessFeedback],
  );

  const manualRows = manualResults?.data ?? [];

  const manualColumns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      { accessorKey: 'parcelContent', header: 'Parcel Content' },
      {
        id: 'sender',
        header: 'Sender',
        accessorFn: (row) =>
          `${row.senderName ?? '-'}${row.senderPhone ? ` (${row.senderPhone})` : ''}`,
      },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={async () => {
              try {
                await confirmReceive(row.original, 'manual');
                triggerScanSuccessFeedback();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to receive parcel');
              }
            }}
            disabled={isUpdating}
          >
            Confirm Receive
          </Button>
        ),
      },
    ],
    [confirmReceive, isUpdating, triggerScanSuccessFeedback],
  );

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Scan to Receive</CardTitle>
          <CardDescription>
            Scan parcel sticker QR and auto-mark arrival after 3 seconds. If scanner is unavailable,
            use manual search and confirm receive.
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

          <div className="relative">
            {scannerEnabled && isBarcodeDetectorAvailable() ? (
              <QrScanner enabled={scannerEnabled} onDetected={handleDetectedByScanner} />
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Scanner is off or unsupported in this browser. Use manual search below.
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
              {countdown != null ? `Auto-receive in ${countdown}s...` : 'Awaiting scan'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Receive</CardTitle>
          <CardDescription>
            Search by tracking code, booking code, sender/receiver name or telephone, then confirm
            receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const term = manualSearchInput.trim();
              setManualQuery((prev) => ({
                ...prev,
                page: 1,
                search: term.length > 0 ? term : undefined,
                filters: manualServerFilters,
              }));
            }}
          >
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
  );
}
