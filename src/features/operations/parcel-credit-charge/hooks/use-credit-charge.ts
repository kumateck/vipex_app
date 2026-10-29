import { useAuthStore } from '@/stores/auth-store';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { parsePositiveCedis } from '@/shared/customers/credit-settlement';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import { useUpdateCreditChargeMutation, useListChargeCorrectionsQuery } from '../services';
import type { CreditChargeProps } from '../types';

export function useCreditCharge(props: CreditChargeProps) {
  const user = useAuthStore((state) => state.user);
  const cacheScope = `${user?.company?.id ?? ''}:${user?.id ?? ''}`;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [creditConfirmed, setCreditConfirmed] = useState(false);
  const [update, { isLoading }] = useUpdateCreditChargeMutation();
  const history = useListChargeCorrectionsQuery(
    { parcelId: props.parcelId, cacheScope },
    { refetchOnMountOrArgChange: true },
  );
  const pendingRequest = history.currentData?.data.find((row) => row.status === 0);
  const pending = useRef(false);
  const parsed = parsePositiveCedis(amount);
  const valid =
    props.chargePsw === 0 &&
    parsed !== null &&
    reason.trim().length >= 3 &&
    reason.trim().length <= 500 &&
    creditConfirmed &&
    !pendingRequest &&
    !history.isFetching &&
    !history.isError &&
    !getParcelChargeValidationError({ chargeCedis: parsed / 100, plannedToBePaidCedis: 0 });
  const onOpenChange = (value: boolean) => {
    if (pending.current) return;
    if (value) {
      setAmount('');
      setReason('');
      setCreditConfirmed(false);
    }
    setOpen(value);
  };
  const submit = async () => {
    if (!valid || pending.current) return;
    pending.current = true;
    try {
      await update({
        parcelId: props.parcelId,
        chargeCedis: amount,
        expectedChargePsw: 0,
        method: 4,
        reason: reason.trim(),
      }).unwrap();
      toast.success('Charge correction submitted for approval. The parcel is unchanged.');
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Could not request charge correction');
    } finally {
      pending.current = false;
    }
  };
  return {
    open,
    onOpenChange,
    amount,
    setAmount,
    reason,
    setReason,
    creditConfirmed,
    setCreditConfirmed,
    valid,
    isLoading,
    submit,
    history,
    pendingRequest,
  };
}
