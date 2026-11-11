import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useCallback, useRef, useState } from 'react';
import { Alert, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import { hapticError, hapticSuccess, hapticTap, hapticWarning } from '@mobile/lib/haptics';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import {
  canCreateQueueTicket,
  canSearchParcelsForQueue,
  canViewQueueScreen,
  canViewReceiverQueueBoard,
  canViewSenderQueueBoard,
} from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import type { ParcelSearchRow, PickupQueueCard } from '@mobile/types/parcels';
import { showQueueTicketDialog } from '../dialogs/queue-ticket-dialog';
import { usePickupQueueRefresh } from '@mobile/lib/use-pickup-queue-refresh';
import {
  issueQueueTicket,
  loadQueueBoards,
  loadQueueParcelDetails,
  searchQueueParcels,
} from '../services/queue-management-service';
import {
  buildQueueShareMessages,
  queueCardShareContext,
  isQueueDateToday,
} from '../utils/queue-management-utils';

export function useQueueManagement() {
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const branchId = session.user?.branch?.id ?? session.user?.branchId;
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const branchName = session.user?.branch?.name ?? '-';
  const branchContact =
    session.user?.branch?.telephone?.trim() || session.user?.branch?.phone?.trim() || '';
  const branchLocation =
    session.user?.location?.name?.trim() ||
    session.user?.branch?.location?.trim() ||
    session.user?.branch?.address?.trim() ||
    '';
  const companyName = session.user?.company?.name ?? 'Vipex';

  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ParcelSearchRow[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Awaited<
    ReturnType<typeof loadQueueParcelDetails>
  > | null>(null);
  const [receiverQueueCards, setReceiverQueueCards] = useState<PickupQueueCard[]>([]);
  const [waitingPickupQueueCards, setWaitingPickupQueueCards] = useState<PickupQueueCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [queueingParcelId, setQueueingParcelId] = useState<string | null>(null);
  const boardDay = useRef<string | null>(null);
  const boardRequest = useRef(0);
  const detailsRequest = useRef(0);

  const access = {
    canView: canViewQueueScreen(permissions),
    canIssueTicket: canCreateQueueTicket(permissions),
    canReadParcels: canSearchParcelsForQueue(permissions),
    canReadReceiverBoard: canViewReceiverQueueBoard(permissions),
    canReadSenderBoard: canViewSenderQueueBoard(permissions),
  };
  const canReadReceiverBoard = access.canReadReceiverBoard;
  const canReadSenderBoard = access.canReadSenderBoard;
  const canReadParcels = access.canReadParcels;
  const canIssueTicket = access.canIssueTicket;

  const refreshBoards = useCallback(async () => {
    if (!branchId || (!canReadReceiverBoard && !canReadSenderBoard)) return;
    const today = new Date().toISOString().slice(0, 10);
    const requestId = ++boardRequest.current;
    if (boardDay.current === null) boardDay.current = today;
    if (boardDay.current !== today) {
      boardDay.current = today;
      setReceiverQueueCards([]);
      setWaitingPickupQueueCards([]);
    }
    setLoadingBoards(true);
    try {
      const [receiver, waiting] = await withAuth((token) =>
        loadQueueBoards(token, branchId, {
          receiver: canReadReceiverBoard,
          sender: canReadSenderBoard,
        }),
      );
      if (requestId !== boardRequest.current || today !== new Date().toISOString().slice(0, 10)) {
        return;
      }
      setReceiverQueueCards(receiver);
      setWaitingPickupQueueCards(waiting);
    } catch (error) {
      if (requestId !== boardRequest.current) return;
      notifyError(
        'Queue board failed',
        getMobileErrorMessage(error, '') || 'Unable to load queue boards',
      );
      void hapticError();
    } finally {
      if (requestId === boardRequest.current) setLoadingBoards(false);
    }
  }, [branchId, canReadReceiverBoard, canReadSenderBoard, withAuth]);

  usePickupQueueRefresh(refreshBoards);

  const runSearch = useCallback(async () => {
    const term = search.trim();
    if (!term) return;
    if (!canReadParcels) {
      notifyError('Permission denied', 'You do not have permission to search parcel records.');
      return;
    }
    if (!companyId) {
      Alert.alert('Missing context', 'Your company or branch could not be determined.');
      void hapticWarning();
      return;
    }
    setLoading(true);
    try {
      const data = await withAuth((token) =>
        searchQueueParcels(token, { search: term, companyId, branchId: branchId ?? undefined }),
      );
      setRows(data.data ?? []);
      void hapticTap();
    } catch (error) {
      notifyError('Search failed', getMobileErrorMessage(error, '') || 'Unable to search parcels');
      void hapticError();
    } finally {
      setLoading(false);
    }
  }, [branchId, canReadParcels, companyId, search, withAuth]);

  const selectParcel = useCallback(
    async (parcel: ParcelSearchRow) => {
      if (!canReadParcels) {
        notifyError('Permission denied', 'You do not have permission to view parcel records.');
        return;
      }
      const id = ++detailsRequest.current;
      setSelectedParcel(parcel);
      setSelectedDetails(null);
      try {
        const details = await withAuth((token) => loadQueueParcelDetails(token, parcel.id));
        if (id === detailsRequest.current) setSelectedDetails(details);
      } catch (error) {
        if (id !== detailsRequest.current) return;
        notifyError(
          'Parcel details failed',
          getMobileErrorMessage(error, '') || 'Unable to load parcel details',
        );
        void hapticError();
      }
    },
    [canReadParcels, withAuth],
  );

  const canIssueSelectedQueue =
    selectedParcel?.status === ParcelStatus.AWAITING_PICKUP &&
    !(selectedDetails
      ? isQueueDateToday(
          selectedDetails.pickupQueue?.queueDate,
          selectedDetails.pickupQueue?.queuedAt,
        )
      : isQueueDateToday(selectedParcel.pickupQueueDate, selectedParcel.pickupQueuedAt));

  const issueSelectedTicket = useCallback(async () => {
    if (!selectedParcel) return;
    if (!canIssueTicket) {
      notifyError('Permission denied', 'You do not have permission to issue queue tickets.');
      return;
    }
    const parcelId = selectedParcel.id;
    const detailsId = detailsRequest.current;
    setQueueingParcelId(parcelId);
    try {
      const response = await withAuth((token) => issueQueueTicket(token, parcelId));
      const queueCode = response.queueCode?.trim() ?? '';
      if (queueCode) {
        const messages = buildQueueShareMessages({
          queueCode,
          bookingCode: selectedParcel.bookingCode,
          receiverName: selectedParcel.receiverName,
          receiverPhone: selectedParcel.receiverPhone,
          branchName,
          branchContact,
          branchLocation,
          companyName,
        });
        showQueueTicketDialog({
          queueCode,
          shortMessage: messages.short,
          fullMessage: messages.full,
        });
      } else {
        notifySuccess('Ticket created');
      }
      void hapticSuccess();
      await Promise.all([runSearch(), refreshBoards()]);
      if (detailsId === detailsRequest.current) await selectParcel(selectedParcel);
    } catch (error) {
      notifyError('Queue failed', getMobileErrorMessage(error, '') || 'Unable to queue parcel');
      void hapticError();
    } finally {
      setQueueingParcelId(null);
    }
  }, [
    branchContact,
    branchLocation,
    branchName,
    canIssueTicket,
    companyName,
    refreshBoards,
    runSearch,
    selectParcel,
    selectedParcel,
    withAuth,
  ]);

  const copyQueueCode = useCallback((queueCode: string) => {
    try {
      Clipboard.setString(queueCode);
      notifySuccess('Queue code copied.');
    } catch (error) {
      notifyError('Copy failed', getMobileErrorMessage(error, '') || 'Unable to copy queue code');
      void hapticError();
    }
  }, []);

  const shareQueueCard = useCallback(
    async (card: PickupQueueCard) => {
      const messages = buildQueueShareMessages({
        ...queueCardShareContext(card),
        branchName,
        branchContact,
        branchLocation,
        companyName,
      });
      try {
        await Share.share({ message: messages.short });
      } catch (error) {
        notifyError(
          'Share failed',
          getMobileErrorMessage(error, '') || 'Unable to share queue ticket',
        );
        void hapticError();
      }
    },
    [branchContact, branchLocation, branchName, companyName],
  );

  return {
    access,
    branchName,
    search,
    setSearch,
    rows,
    selectedParcel,
    selectedDetails,
    receiverQueueCards,
    waitingPickupQueueCards,
    loading,
    loadingBoards,
    queueingParcelId,
    canIssueSelectedQueue,
    runSearch,
    refreshBoards,
    selectParcel,
    issueSelectedTicket,
    closeDetails: () => {
      detailsRequest.current += 1;
      setSelectedParcel(null);
      setSelectedDetails(null);
    },
    copyQueueCode,
    shareQueueCard,
  };
}
