import { useEffect, useMemo } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { CashierType } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import type { ParcelBookingFormValues } from './parcel-form.types';

type UseParcelCreatePrintPreferenceArgs = {
  form: UseFormReturn<ParcelBookingFormValues>;
  shouldPrintOnSubmit: boolean;
  setShouldPrintOnSubmit: (value: boolean) => void;
};

export function useParcelCreatePrintPreference({
  form,
  shouldPrintOnSubmit,
  setShouldPrintOnSubmit,
}: UseParcelCreatePrintPreferenceArgs) {
  const user = useAuthStore((state) => state.user);
  const parcels = useWatch({ control: form.control, name: 'parcels' });

  const canCollectSenderPayments = useMemo(() => {
    const cashierType = user?.cashierType;
    const canCollect = (user?.permissions ?? []).includes(PermissionKeys.CanCreateSenderPayments);
    return canCollect && (cashierType === CashierType.SENDING || cashierType === CashierType.FULL);
  }, [user?.cashierType, user?.permissions]);

  const hasSenderPayParcel = useMemo(
    () =>
      (parcels ?? []).some(
        (parcel) =>
          (parcel.paymentResponsibility === 'SENDER' &&
            parcel.senderSettlementMode === 'PAY_NOW') ||
          (parcel.paymentResponsibility === 'SPLIT' && Number(parcel.senderPartialPayment) > 0),
      ),
    [parcels],
  );

  const canPrintAfterSubmit = canCollectSenderPayments && hasSenderPayParcel;

  useEffect(() => {
    if (canPrintAfterSubmit) {
      setShouldPrintOnSubmit(true);
      return;
    }
    if (shouldPrintOnSubmit) {
      setShouldPrintOnSubmit(false);
    }
  }, [canPrintAfterSubmit, setShouldPrintOnSubmit, shouldPrintOnSubmit]);

  return { canCollectSenderPayments, hasSenderPayParcel, canPrintAfterSubmit };
}
