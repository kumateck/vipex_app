import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { parsePositiveCedis } from '@/shared/customers/credit-settlement';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import { useUpdateCreditChargeMutation } from '../services';
import type { CreditChargeProps } from '../types';

export function useCreditCharge(props: CreditChargeProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [expectedChargePsw, setExpectedChargePsw] = useState(props.chargePsw);
  const [update, { isLoading }] = useUpdateCreditChargeMutation();
  const pending = useRef(false);
  const parsed = parsePositiveCedis(amount);
  const valid =
    parsed !== null &&
    parsed !== expectedChargePsw &&
    reason.trim().length >= 3 &&
    !getParcelChargeValidationError({ chargeCedis: parsed / 100, plannedToBePaidCedis: 0 });
  const onOpenChange = (value: boolean) => {
    if (pending.current) return;
    if (value) {
      setAmount((props.chargePsw / 100).toFixed(2));
      setReason('');
      setExpectedChargePsw(props.chargePsw);
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
        expectedChargePsw,
        reason: reason.trim(),
      }).unwrap();
      toast.success('Credit charge updated');
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Could not update credit charge');
    } finally {
      pending.current = false;
    }
  };
  return { open, onOpenChange, amount, setAmount, reason, setReason, valid, isLoading, submit };
}
