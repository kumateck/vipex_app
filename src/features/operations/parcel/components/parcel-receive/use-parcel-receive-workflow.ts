import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useLazySearchParcelsQuery,
  useMarkParcelReceivedMutation,
  useSearchParcelsQuery,
} from '../../api/parcel.api';
import { extractScannedCode } from '../../utils/scan-code';

export function useParcelReceiveWorkflow() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const branchName = user?.branch?.name ?? '-';

  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [criticalParcel, setCriticalParcel] = useState<ParcelSearchRow | null>(null);
  const reviewRequired = useRef(false);
  const scanVersion = useRef(0);
  const activeScanCode = useRef<string | null>(null);
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
  const [markParcelReceived, { isLoading: isUpdating }] = useMarkParcelReceivedMutation();

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
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    return () => {
      scanVersion.current++;
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
      if (!user?.id) {
        toast.error('Your user account could not be identified');
        return;
      }
      await markParcelReceived({
        id: parcel.id,
        receivedBy: user.id,
        status: ParcelStatus.ARRIVED_AT_DESTINATION,
      }).unwrap();

      toast.success(
        mode === 'scan'
          ? `Parcel ${parcel.bookingCode} marked as ARRIVED_AT_DESTINATION`
          : `Received ${parcel.bookingCode}`,
      );

      if (manualQuery.search && manualQuery.search.trim().length > 0) {
        await refetchManual();
      }
    },
    [manualQuery.search, markParcelReceived, refetchManual, user?.id],
  );

  const handleDetectedByScanner = useCallback(
    async (rawCode: string) => {
      const code = extractScannedCode(rawCode);
      if (reviewRequired.current || activeScanCode.current === code) return;
      const version = ++scanVersion.current;
      activeScanCode.current = code;
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

        if (version !== scanVersion.current || reviewRequired.current) return;
        try {
          const parcel = await findIncomingInTransitParcel(code);
          if (version !== scanVersion.current || reviewRequired.current) return;
          if (!parcel) {
            toast.error('No in-transit parcel to your branch matches the scanned code');
            return;
          }
          if (parcel.handoverNoteCritical) {
            reviewRequired.current = true;
            setCriticalParcel(parcel);
            return;
          }
          await confirmReceive(parcel, 'scan');
          triggerScanSuccessFeedback();
        } catch (error) {
          if (version === scanVersion.current)
            toast.error(
              getApplicationErrorMessage(error, '') || 'Failed to receive scanned parcel',
            );
        } finally {
          if (version === scanVersion.current) activeScanCode.current = null;
        }
      }, 3000);
    },
    [confirmReceive, findIncomingInTransitParcel, triggerScanSuccessFeedback],
  );

  const manualRows = manualResults?.data ?? [];

  const dismissCriticalParcel = () => {
    reviewRequired.current = false;
    setCriticalParcel(null);
  };
  const confirmCriticalParcel = async () => {
    if (!criticalParcel || isUpdating) return;
    try {
      await confirmReceive(criticalParcel, 'scan');
      triggerScanSuccessFeedback();
      dismissCriticalParcel();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to receive scanned parcel');
    }
  };
  const submitManualSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = manualSearchInput.trim();
    if (companyId && branchId && term && term === manualQuery.search && manualQuery.page === 1) {
      void refetchManual();
      return;
    }
    setManualQuery((prev) => ({
      ...prev,
      page: 1,
      search: term || undefined,
      filters: manualServerFilters,
    }));
  };
  return {
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
    confirmReceive,
    triggerScanSuccessFeedback,
    criticalParcel,
    dismissCriticalParcel,
    confirmCriticalParcel,
  };
}
