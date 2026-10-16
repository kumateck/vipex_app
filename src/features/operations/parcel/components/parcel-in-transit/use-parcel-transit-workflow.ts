import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useIncomingParcelBatchArrival } from '../../hooks';
import { useWaitingPickUpEdit } from '../parcel-waiting-pickup/use-waiting-pickup-edit';
import {
  type ParcelSearchRow,
  useLogParcelDiscrepancyMutation,
  useMarkParcelReceivedMutation,
  useSearchParcelsQuery,
} from '../../api/parcel.api';
import { useOutgoingParcelPrint } from './use-outgoing-parcel-print';
import { EMPTY_META, EMPTY_ROWS } from './parcel-transit.utils';
import type { IncomingTransitFilterValues } from './incoming-transit-filters';

export type InTransitView = 'outgoing' | 'incoming';
export function useParcelTransitWorkflow(view: InTransitView) {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const [searchInput, setSearchInput] = useState('');
  const [incomingFilters, setIncomingFilters] = useState<IncomingTransitFilterValues>({});

  const serverFilters = useMemo(
    () => ({
      companyId: companyId ?? undefined,
      sourceId: view === 'outgoing' ? (branchId ?? undefined) : incomingFilters.sourceId,
      destinationId: view === 'incoming' ? (branchId ?? undefined) : undefined,
      status: ParcelStatus.IN_TRANSIT,
      sentDate: view === 'incoming' ? incomingFilters.sentDate : undefined,
      consignmentNumber: view === 'incoming' ? incomingFilters.consignmentNumber : undefined,
    }),
    [branchId, companyId, incomingFilters, view],
  );

  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string;
      sourceId?: string;
      destinationId?: string;
      status?: number;
      sentDate?: string;
      consignmentNumber?: string;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const outgoingPrint = useOutgoingParcelPrint();
  const printOutgoing = outgoingPrint.print;
  const [stickerCopies, setStickerCopies] = useState(1);
  const [arrivalConfirmationParcel, setArrivalConfirmationParcel] =
    useState<ParcelSearchRow | null>(null);
  const [discrepancyDialogOpen, setDiscrepancyDialogOpen] = useState(false);
  const [discrepancyParcel, setDiscrepancyParcel] = useState<ParcelSearchRow | null>(null);
  const [missingTrackingCode, setMissingTrackingCode] = useState('');
  const [missingBookingCode, setMissingBookingCode] = useState('');
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const edit = useWaitingPickUpEdit();
  const [markParcelReceived, { isLoading: isUpdatingStatus }] = useMarkParcelReceivedMutation();
  const [logDiscrepancy, { isLoading: isLoggingDiscrepancy }] = useLogParcelDiscrepancyMutation();

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: serverFilters,
    }));
  }, [serverFilters]);

  const handleMarkAsArrived = useCallback(
    async (parcel: ParcelSearchRow) => {
      if (!user?.id) {
        toast.error('Your user account could not be identified');
        return;
      }
      await markParcelReceived({
        id: parcel.id,
        receivedBy: user.id,
        status: ParcelStatus.ARRIVED_AT_DESTINATION,
      }).unwrap();
      toast.success(`Received ${parcel.bookingCode}`);
    },
    [markParcelReceived, user?.id],
  );

  const { data, isLoading, refetch } = useSearchParcelsQuery(query, {
    skip: !companyId || !branchId,
  });
  const rows = data?.data ?? EMPTY_ROWS;
  const batchArrival = useIncomingParcelBatchArrival({ rows, onArrived: refetch });

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const term = searchInput.trim();
      batchArrival.clearSelection();
      setQuery((prev) => ({
        ...prev,
        page: 1,
        search: term.length > 0 ? term : undefined,
        filters: serverFilters,
      }));
    },
    [batchArrival, searchInput, serverFilters],
  );

  const handleRequestChange = useCallback(
    (
      nextRequest: ServerListQuery<{
        companyId?: string;
        sourceId?: string;
        destinationId?: string;
        status?: number;
        sentDate?: string;
        consignmentNumber?: string;
      }>,
    ) => {
      setQuery((prev) => ({
        ...prev,
        ...nextRequest,
        search: prev.search,
        filters: serverFilters,
      }));
    },
    [serverFilters],
  );
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const handleConfirmMarkAsArrived = useCallback(async () => {
    if (!arrivalConfirmationParcel) return;
    try {
      await handleMarkAsArrived(arrivalConfirmationParcel);
      batchArrival.removeSelection(arrivalConfirmationParcel.id);
      await refetch();
      setArrivalConfirmationParcel(null);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to update parcel status');
    }
  }, [arrivalConfirmationParcel, batchArrival, handleMarkAsArrived, refetch]);
  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );
  const rowNumberOffset =
    ((data?.meta.page ?? query.page ?? 1) - 1) *
    (data?.meta.pageSize ?? query.pageSize ?? EMPTY_META.pageSize);

  const title =
    view === 'outgoing' ? 'In Transit (Sending Branch)' : 'In Transit (Receiving Branch)';
  const description =
    view === 'outgoing'
      ? 'Parcels in transit sent from your branch to destination branches.'
      : 'Parcels in transit coming to your branch from source branches.';

  const handleLogDiscrepancy = useCallback(async () => {
    if (!companyId || !branchId || !user?.id) {
      toast.error('Missing company, branch, or user context');
      return;
    }

    const notes = discrepancyNotes.trim();

    if (discrepancyParcel) {
      await logDiscrepancy({
        companyId,
        actorUserId: user.id,
        branchId,
        parcelId: discrepancyParcel.id,
        trackingCode: discrepancyParcel.trackingCode,
        bookingCode: discrepancyParcel.bookingCode,
        discrepancyType: 'record_not_physical',
        notes: notes.length > 0 ? notes : null,
      }).unwrap();
      toast.success(`Logged discrepancy for ${discrepancyParcel.bookingCode}`);
    } else {
      const trackingCode = missingTrackingCode.trim();
      const bookingCode = missingBookingCode.trim();

      if (trackingCode.length === 0 && bookingCode.length === 0) {
        toast.error('Enter tracking code or booking code');
        return;
      }

      await logDiscrepancy({
        companyId,
        actorUserId: user.id,
        branchId,
        trackingCode: trackingCode.length > 0 ? trackingCode : null,
        bookingCode: bookingCode.length > 0 ? bookingCode : null,
        discrepancyType: 'physical_missing_in_system',
        notes: notes.length > 0 ? notes : null,
      }).unwrap();
      toast.success('Logged missing physical parcel discrepancy');
    }

    setDiscrepancyParcel(null);
    setDiscrepancyDialogOpen(false);
    setMissingTrackingCode('');
    setMissingBookingCode('');
    setDiscrepancyNotes('');
  }, [
    branchId,
    companyId,
    discrepancyNotes,
    discrepancyParcel,
    logDiscrepancy,
    missingBookingCode,
    missingTrackingCode,
    user?.id,
  ]);

  return {
    view,
    companyId,
    branchId,
    searchInput,
    setSearchInput,
    setIncomingFilters,
    serverFilters,
    query,
    setQuery,
    selectedParcelId,
    setSelectedParcelId,
    outgoingPrint,
    printOutgoing,
    stickerCopies,
    setStickerCopies,
    arrivalConfirmationParcel,
    setArrivalConfirmationParcel,
    discrepancyDialogOpen,
    setDiscrepancyDialogOpen,
    discrepancyParcel,
    setDiscrepancyParcel,
    missingTrackingCode,
    setMissingTrackingCode,
    missingBookingCode,
    setMissingBookingCode,
    discrepancyNotes,
    setDiscrepancyNotes,
    isUpdatingStatus,
    isLoggingDiscrepancy,
    data,
    isLoading,
    refetch,
    rows,
    batchArrival,
    handleSearchSubmit,
    handleRequestChange,
    branchOptions,
    handleConfirmMarkAsArrived,
    branchNameById,
    rowNumberOffset,
    title,
    description,
    handleLogDiscrepancy,
    edit,
  };
}
