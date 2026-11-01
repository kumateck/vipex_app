import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useParcelExemptionType } from './use-parcel-exemption-type';
import type { ParcelBookingFormValues } from '../../parcel/components/parcel-create/parcel-form.types';
import { useListParcelReceivingStaffQuery } from '../services';

export function useParcelChargeExemption(
  index: number,
  source: 'booking' | 'self-service' = 'booking',
) {
  const { control, setValue, clearErrors } = useFormContext<ParcelBookingFormValues>();
  const destinationId = useWatch({ control, name: `parcels.${index}.destinationBranchId` });
  const relatedStaffId = useWatch({ control, name: `parcels.${index}.relatedStaffId` });
  const exemptionType = useParcelExemptionType(index);
  const staff = useListParcelReceivingStaffQuery(
    { destinationId, source },
    {
      skip: exemptionType !== 5 || !destinationId,
    },
  );
  useEffect(() => {
    if (exemptionType == null) return;
    setValue(`parcels.${index}.charge`, '0');
    setValue(`parcels.${index}.senderPartialPayment`, '0');
    setValue(`parcels.${index}.paymentResponsibility`, 'SENDER');
    setValue(`parcels.${index}.senderSettlementMode`, 'PAY_NOW');
    clearErrors([`parcels.${index}.charge`, `parcels.${index}.senderPartialPayment`]);
  }, [clearErrors, exemptionType, index, setValue]);
  useEffect(() => {
    if (
      exemptionType !== 5 ||
      (staff.currentData && !staff.currentData.some((row) => row.id === relatedStaffId))
    ) {
      setValue(`parcels.${index}.relatedStaffId`, '');
    }
  }, [exemptionType, index, relatedStaffId, setValue, staff.currentData, destinationId]);
  return { exemptionType, staff, destinationId };
}
