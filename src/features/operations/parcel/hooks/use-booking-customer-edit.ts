import { useCallback } from 'react';
import { useFormContext, useWatch, type FieldPathByValue } from 'react-hook-form';
import { useHasPermission } from '@/components/permissions/permission-guard';
import { normalizePhoneDigits } from '@/lib/phone';
import { sanitizeString } from '@/lib/utils';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useLookupBookingCustomersQuery } from '../services';
import { useExistingCustomerEdit } from './use-existing-customer-edit';
import type { ParcelBookingFormValues } from '../components/parcel-create/parcel-form.types';

export type BookingCustomerEditFields = {
  label: string;
  phoneName: FieldPathByValue<ParcelBookingFormValues, string>;
  customerIdName: FieldPathByValue<ParcelBookingFormValues, string>;
  fullnameName: FieldPathByValue<ParcelBookingFormValues, string>;
  secondaryPhoneName: FieldPathByValue<ParcelBookingFormValues, string>;
};

export function useBookingCustomerEdit(fields: BookingCustomerEditFields) {
  const { control, setValue } = useFormContext<ParcelBookingFormValues>();
  const phone = normalizePhoneDigits(sanitizeString(useWatch({ control, name: fields.phoneName })));
  const customerId = sanitizeString(useWatch({ control, name: fields.customerIdName }));
  const canUpdate = useHasPermission(PermissionKeys.CanUpdateCustomers);
  const query = useLookupBookingCustomersQuery(
    { telephone: phone },
    { skip: !canUpdate || !customerId || phone.length !== 10 },
  );
  const customer = query.currentData?.find((row) => row.id === customerId);
  const handleUpdated = useCallback(
    (values: { fullname: string; telephone2: string }) => {
      setValue(fields.fullnameName, values.fullname, { shouldDirty: true, shouldValidate: true });
      setValue(fields.secondaryPhoneName, values.telephone2, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [fields.fullnameName, fields.secondaryPhoneName, setValue],
  );
  const edit = useExistingCustomerEdit({ customer, onUpdated: handleUpdated });
  return { customer, edit, isFetching: query.isFetching, visible: canUpdate && Boolean(customer) };
}
