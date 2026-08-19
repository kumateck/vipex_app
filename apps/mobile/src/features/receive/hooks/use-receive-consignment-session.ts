import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from '@mobile/navigation/router-compat';
import {
  ApiRequestError,
  closeConsignment,
  getConsignmentDetail,
  listConsignmentItems,
  receiveConsignmentItem,
  type ConsignmentDetail,
  type ConsignmentItem,
} from '@mobile/lib/api';
import { hapticError, hapticSuccess, hapticWarning } from '@mobile/lib/haptics';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { canMarkParcelArrived } from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import { formatConsignmentDate } from '../utils/format-consignment-date';

const OPEN_CONSIGNMENT_STATUS = 0;

export function useReceiveConsignmentSession() {
  const { session, withAuth } = useAuth();
  const canReceive = canMarkParcelArrived(session.user?.permissions ?? []);
  const router = useRouter();
  const { consignmentId } = useLocalSearchParams<{ consignmentId: string }>();
  const [consignment, setConsignment] = useState<ConsignmentDetail | null>(null);
  const [items, setItems] = useState<ConsignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [scanBusy, setScanBusy] = useState(false);
  const [closeBusy, setCloseBusy] = useState(false);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [missingCount, setMissingCount] = useState(0);
  const [exceptionReason, setExceptionReason] = useState('');

  const load = useCallback(async () => {
    if (!consignmentId) return;
    setLoading(true);
    try {
      const [detail, itemRows] = await withAuth((token) =>
        Promise.all([
          getConsignmentDetail(token, consignmentId),
          listConsignmentItems(token, consignmentId),
        ]),
      );
      setConsignment(detail);
      setItems(itemRows);
    } catch (error) {
      notifyError(
        'Load failed',
        error instanceof Error ? error.message : 'Unable to load consignment',
      );
    } finally {
      setLoading(false);
    }
  }, [consignmentId, withAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  const receiveByCode = useCallback(
    async (code: string) => {
      if (!consignmentId || consignment?.status !== OPEN_CONSIGNMENT_STATUS) return;
      if (!canReceive) {
        notifyError('Permission denied', 'You do not have permission to receive parcels.');
        void hapticWarning();
        return;
      }
      setScanBusy(true);
      try {
        const result = await withAuth((token) =>
          receiveConsignmentItem(token, consignmentId, code),
        );
        if (result.outcome === 'RECEIVED') {
          notifySuccess(`Received ${result.trackingCode} (${result.arrived} of ${result.total})`);
          void hapticSuccess();
        } else if (result.outcome === 'ALREADY_RECEIVED') {
          notifyError(
            'Already received',
            `${result.trackingCode} was already received at ${formatConsignmentDate(result.arrivedAt)}${result.arrivedByName ? ` by ${result.arrivedByName}` : ''}`,
          );
          void hapticWarning();
        } else if (result.outcome === 'NOT_DISPATCHED') {
          notifyError(
            'Not dispatched yet',
            `${result.trackingCode} hasn't been dispatched yet — it's still at ${result.sourceBranchName ?? 'the sending branch'} and hasn't been loaded onto a consignment.`,
          );
          void hapticWarning();
        } else {
          notifyError(
            'Wrong consignment',
            `${result.trackingCode} belongs to ${result.belongsToConsignmentCode ?? 'another consignment'}, not this one.`,
          );
          void hapticWarning();
        }
        await load();
      } catch (error) {
        notifyError(
          'Receive failed',
          error instanceof Error ? error.message : 'Unable to receive parcel',
        );
        void hapticError();
      } finally {
        setScanBusy(false);
      }
    },
    [canReceive, consignment?.status, consignmentId, load, withAuth],
  );

  const closeConsignmentSession = useCallback(async () => {
    if (!consignmentId) return;
    setCloseBusy(true);
    try {
      const result = await withAuth((token) => closeConsignment(token, consignmentId));
      notifySuccess(
        result.status === 1 ? 'Consignment closed — all parcels received' : 'Consignment closed',
      );
      void hapticSuccess();
      router.back();
    } catch (error) {
      const missingParcelIds =
        error instanceof ApiRequestError
          ? (error.details?.missingParcelIds as string[] | undefined)
          : undefined;
      if (missingParcelIds) {
        setMissingCount(missingParcelIds.length);
        setReasonModalOpen(true);
        return;
      }
      notifyError(
        'Close failed',
        error instanceof Error ? error.message : 'Unable to close consignment',
      );
      void hapticError();
    } finally {
      setCloseBusy(false);
    }
  }, [consignmentId, router, withAuth]);

  const confirmCloseWithExceptions = useCallback(async () => {
    if (!consignmentId) return;
    const reason = exceptionReason.trim();
    if (!reason) {
      notifyError('Reason required', 'Enter a reason before closing with missing parcels.');
      void hapticWarning();
      return;
    }
    setCloseBusy(true);
    try {
      const result = await withAuth((token) =>
        closeConsignment(token, consignmentId, {
          forceWithExceptions: true,
          exceptionReason: reason,
        }),
      );
      notifySuccess(
        `Consignment closed with ${result.missingParcelIds.length} missing parcel(s) flagged as discrepancies`,
      );
      void hapticSuccess();
      setReasonModalOpen(false);
      setExceptionReason('');
      router.back();
    } catch (error) {
      notifyError(
        'Close failed',
        error instanceof Error ? error.message : 'Unable to close consignment',
      );
      void hapticError();
    } finally {
      setCloseBusy(false);
    }
  }, [consignmentId, exceptionReason, router, withAuth]);

  return {
    canReceive,
    closeBusy,
    closeConsignmentSession,
    confirmCloseWithExceptions,
    consignment,
    exceptionReason,
    items,
    loading,
    manualCode,
    missingCount,
    reasonModalOpen,
    receiveByCode,
    scanBusy,
    setExceptionReason,
    setManualCode,
    setReasonModalOpen,
  };
}
