import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams } from '@mobile/navigation/router-compat';
import { hapticError, hapticSuccess, hapticTap } from '@mobile/lib/haptics';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { useRiderBoardData } from '@mobile/features/rider/hooks/use-rider-board-data';
import { publishRiderAssignmentSignal } from '@mobile/features/rider/assignment-realtime';
import { completeAssignedDelivery, returnAssignedDelivery } from '../services';
import type { ActiveDeliveryAction, AssignedDeliveryAction, DeliveryHandoverInput } from '../types';
import { filterAssignedDeliveries, getTotalExpectedCollectionPsw } from '../utils';
import { useRiderDeliveryChangeRequests } from './use-rider-delivery-change-requests';

export function useAssignedDeliveries() {
  const params = useLocalSearchParams<{ date?: string }>();
  const selectedDate = typeof params.date === 'string' ? params.date.trim() : '';
  const [search, setSearch] = useState('');
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [signatureParcelId, setSignatureParcelId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActiveDeliveryAction>(null);
  const { withAuth } = useAuth();
  const board = useRiderBoardData(selectedDate);
  const changeRequests = useRiderDeliveryChangeRequests(board.load);

  const assignedRows = useMemo(
    () => filterAssignedDeliveries(board.currentRows, search),
    [board.currentRows, search],
  );
  const totalExpectedPsw = useMemo(
    () => getTotalExpectedCollectionPsw(board.currentRows),
    [board.currentRows],
  );

  const refresh = useCallback(() => void board.load(), [board.load]);
  const clearSearch = useCallback(() => setSearch(''), []);
  const toggleParcel = useCallback((parcelId: string) => {
    setSelectedParcelId((current) => (current === parcelId ? null : parcelId));
    void hapticTap();
  }, []);

  const runAction = useCallback(
    async (parcelId: string, type: AssignedDeliveryAction, handover?: DeliveryHandoverInput) => {
      const riderUserId = board.riderUserId;
      if (!riderUserId) return;
      if (type === 'delivered' && !handover?.signatureImage.trim()) {
        notifyError('Signature required', 'Ask the receiver to sign before confirming delivery.');
        return;
      }
      if (type === 'delivered' && changeRequests.pendingChangeParcelIds.has(parcelId)) {
        notifyError(
          'Change request pending',
          'Wait for the address and delivery fee change to be reviewed before confirming.',
        );
        return;
      }
      setActiveAction({ parcelId, type });
      try {
        await withAuth((token) =>
          type === 'delivered'
            ? completeAssignedDelivery(
                token,
                parcelId,
                riderUserId,
                handover as DeliveryHandoverInput,
              )
            : returnAssignedDelivery(token, parcelId, riderUserId),
        );
        notifySuccess(
          type === 'delivered'
            ? 'Parcel marked as handed to customer.'
            : 'Parcel marked as returned to office.',
        );
        void hapticSuccess();
        await board.load();
        publishRiderAssignmentSignal({
          source: 'mutation',
          riderUserId,
          parcelIds: [parcelId],
          assignedAt: new Date().toISOString(),
        });
        if (type === 'delivered') setSignatureParcelId(null);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update this delivery.';
        const needsSession = message.toLowerCase().includes('active cashier session');
        notifyError(
          needsSession ? 'Cashier session required' : 'Update failed',
          needsSession
            ? 'Open a cashier session, or confirm again with “No payment” selected.'
            : message,
        );
        void hapticError();
        return false;
      } finally {
        setActiveAction(null);
      }
    },
    [board.load, board.riderUserId, changeRequests.pendingChangeParcelIds, withAuth],
  );

  const openSignature = useCallback((parcelId: string) => setSignatureParcelId(parcelId), []);
  const closeSignature = useCallback(() => {
    if (!activeAction) setSignatureParcelId(null);
  }, [activeAction]);
  const confirmHandover = useCallback(
    (input: DeliveryHandoverInput) => {
      if (!signatureParcelId) return Promise.resolve(false);
      return runAction(signatureParcelId, 'delivered', input);
    },
    [runAction, signatureParcelId],
  );

  return {
    ...board,
    ...changeRequests,
    search,
    setSearch,
    clearSearch,
    assignedRows,
    selectedParcelId,
    signatureParcelId,
    totalExpectedPsw,
    activeAction,
    refresh,
    toggleParcel,
    openSignature,
    closeSignature,
    confirmHandover,
    runAction,
  };
}
