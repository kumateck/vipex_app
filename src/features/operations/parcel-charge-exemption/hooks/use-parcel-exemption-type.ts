import { useFormContext, useWatch } from 'react-hook-form';
import { resolveParcelExemptionType } from '@/shared/customers/customer-types';
import type { ParcelBookingFormValues } from '../../parcel/components/parcel-create/parcel-form.types';

export function useParcelExemptionType(index: number) {
  const { control } = useFormContext<ParcelBookingFormValues>();
  const senderType = useWatch({ control, name: 'sender.customerType' });
  const receiverType = useWatch({ control, name: `parcels.${index}.receiver.customerType` });
  return resolveParcelExemptionType(senderType, receiverType);
}
