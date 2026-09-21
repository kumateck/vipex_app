import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MAX_BULK_ARRIVAL_PARCELS } from '@/shared/shipments/bulk-arrival';
import { type ParcelSearchRow, useMarkParcelsReceivedMutation } from '../api/parcel.api';

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    typeof (error as { data?: { message?: unknown } }).data?.message === 'string'
  ) {
    return (error as { data: { message: string } }).data.message;
  }
  return getApplicationErrorMessage(error, '') || 'Failed to mark selected parcels as arrived';
}

export function useIncomingParcelBatchArrival(input: {
  rows: ParcelSearchRow[];
  onArrived: () => Promise<unknown>;
}) {
  const { rows, onArrived } = input;
  const [selectedById, setSelectedById] = useState<Map<string, ParcelSearchRow>>(() => new Map());
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [markParcelsReceived, { isLoading }] = useMarkParcelsReceivedMutation();

  const selectedParcels = useMemo(() => [...selectedById.values()], [selectedById]);
  const selectedIds = useMemo(() => [...selectedById.keys()], [selectedById]);
  const selectedOnPage = rows.filter((parcel) => selectedById.has(parcel.id)).length;
  const allOnPageSelected = rows.length > 0 && selectedOnPage === rows.length;
  const someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected;

  const toggleParcel = useCallback(
    (parcel: ParcelSearchRow, checked: boolean) => {
      if (
        checked &&
        !selectedById.has(parcel.id) &&
        selectedById.size >= MAX_BULK_ARRIVAL_PARCELS
      ) {
        toast.error(`Select no more than ${MAX_BULK_ARRIVAL_PARCELS} parcels at a time`);
        return;
      }
      const next = new Map(selectedById);
      if (checked) next.set(parcel.id, parcel);
      else next.delete(parcel.id);
      setSelectedById(next);
    },
    [selectedById],
  );

  const toggleCurrentPage = useCallback(
    (checked: boolean) => {
      const next = new Map(selectedById);
      if (!checked) {
        for (const parcel of rows) next.delete(parcel.id);
        setSelectedById(next);
        return;
      }
      const additions = rows.filter((parcel) => !next.has(parcel.id));
      if (next.size + additions.length > MAX_BULK_ARRIVAL_PARCELS) {
        toast.error(`Select no more than ${MAX_BULK_ARRIVAL_PARCELS} parcels at a time`);
        return;
      }
      for (const parcel of additions) next.set(parcel.id, parcel);
      setSelectedById(next);
    },
    [rows, selectedById],
  );

  const clearSelection = useCallback(() => setSelectedById(new Map()), []);
  const removeSelection = useCallback((parcelId: string) => {
    setSelectedById((current) => {
      if (!current.has(parcelId)) return current;
      const next = new Map(current);
      next.delete(parcelId);
      return next;
    });
  }, []);
  const isSelected = useCallback((parcelId: string) => selectedById.has(parcelId), [selectedById]);

  const confirmArrival = useCallback(async () => {
    if (selectedIds.length === 0) return;
    try {
      const result = await markParcelsReceived({ parcelIds: selectedIds }).unwrap();
      setSelectedById(new Map());
      setIsConfirmationOpen(false);
      toast.success(
        `${result.updatedCount} ${result.updatedCount === 1 ? 'parcel' : 'parcels'} marked as arrived`,
      );
      await onArrived();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [markParcelsReceived, onArrived, selectedIds]);

  return {
    allOnPageSelected,
    clearSelection,
    confirmArrival,
    isConfirmationOpen,
    isSelected,
    isLoading,
    removeSelection,
    selectedCount: selectedIds.length,
    selectedParcels,
    setIsConfirmationOpen,
    someOnPageSelected,
    toggleCurrentPage,
    toggleParcel,
  };
}
