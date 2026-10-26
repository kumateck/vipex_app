import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useListSettlementParcelsQuery, useSettleCreditParcelsMutation } from '../services';
import { formatCreditMoney, parsePositiveCedis } from '../utils';
import type { SettlementProps } from '../types';

export function useCreditSettlement(props: SettlementProps) {
  const {
    currentData: parcels = [],
    isFetching,
    isError,
    refetch,
  } = useListSettlementParcelsQuery(props, { refetchOnMountOrArgChange: true });
  const [settle, { isLoading }] = useSettleCreditParcelsMutation();
  const [selection, setSelectedIds] = useState<string[]>([]);
  const selectedIds = useMemo(() => {
    const available = new Set(parcels.map((parcel) => parcel.parcelId));
    return selection.filter((id) => available.has(id));
  }, [selection, parcels]);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const submitting = useRef(false);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selected = useMemo(
    () => parcels.filter((parcel) => selectedIdSet.has(parcel.parcelId)),
    [parcels, selectedIdSet],
  );
  const totalPsw = selected.reduce((sum, parcel) => sum + parcel.outstandingAmountPsw, 0);
  const exactAmount = totalPsw > 0 && parsePositiveCedis(amount) === totalPsw;
  const selectionValid =
    selected.length > 0 && selected.length === selectedIds.length && selected.length <= 200;
  const canSubmit = exactAmount && selectionValid && !isLoading && !isFetching && !isError;
  const toggleParcel = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  const submit = async () => {
    if (!canSubmit || submitting.current) return;
    submitting.current = true;
    try {
      await settle({
        ...props,
        parcelIds: selectedIds,
        amountCedis: amount,
        referenceId: reference.trim() || null,
        notes: notes.trim() || null,
      }).unwrap();
      toast.success(`${selected.length} parcel(s) settled: ${formatCreditMoney(totalPsw)}`);
      setSelectedIds([]);
      setAmount('');
      setReference('');
      setNotes('');
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Payment was not recorded. Refresh and try again.');
      void refetch();
    } finally {
      submitting.current = false;
    }
  };
  return {
    parcels,
    isFetching,
    isError,
    refetch,
    selectedIds,
    selectedIdSet,
    toggleParcel,
    totalPsw,
    amount,
    setAmount,
    reference,
    setReference,
    notes,
    setNotes,
    isLoading,
    canSubmit,
    exactAmount,
    submit,
  };
}
