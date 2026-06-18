import { useEffect, useMemo } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { CashierType, UserType } from '@/db/schemas/enums';
import { useGetCurrentActiveSessionQuery } from '@/features/cashiers/api/cashiers.api';
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
  const isCashierUser =
    user?.userType === UserType.CASHIER ||
    (user?.cashierType !== null && user?.cashierType !== undefined);
  const { data: activeSession } = useGetCurrentActiveSessionQuery(undefined, {
    skip: !isCashierUser,
  });

  const canCollectSenderPayments = useMemo(() => {
    const cashierType = user?.cashierType;
    const canCollect = (user?.permissions ?? []).includes(PermissionKeys.CanCreateSenderPayments);
    return canCollect && (cashierType === CashierType.SENDING || cashierType === CashierType.FULL);
  }, [user?.cashierType, user?.permissions]);

  const hasPrintableParcel = useMemo(() => (parcels ?? []).length > 0, [parcels]);

  const canPrintAfterSubmit = canCollectSenderPayments && hasPrintableParcel && !!activeSession;

  useEffect(() => {
    if (canPrintAfterSubmit) {
      setShouldPrintOnSubmit(true);
      return;
    }
    if (shouldPrintOnSubmit) {
      setShouldPrintOnSubmit(false);
    }
  }, [canPrintAfterSubmit, setShouldPrintOnSubmit, shouldPrintOnSubmit]);

  return { canCollectSenderPayments, hasPrintableParcel, canPrintAfterSubmit };
}
