import { useController, useFormContext, useWatch } from 'react-hook-form';
import { limitPhoneDigits, PHONE_DIGITS } from '@/lib/phone';
import { customerTypeLabel, isNonIndividualCustomerType } from '@/shared/customers/customer-types';
import type { ParcelBookingFormValues } from '../components/parcel-create/parcel-form.types';
import { useLookupBookingCustomersQuery, type BookingCustomer } from '../services';
import { useDebouncedValue } from './use-debounced-value';

export function useNonIndividualSender() {
  const { control, setValue } = useFormContext<ParcelBookingFormValues>();
  const { field } = useController({ control, name: 'sender.telephone' });
  const selectedId = useWatch({ control, name: 'sender.customerId' });
  const phone = limitPhoneDigits(field.value);
  const debounced = useDebouncedValue(phone, 1000);
  const canSearch = phone.length === PHONE_DIGITS && phone === debounced;
  const lookup = useLookupBookingCustomersQuery(
    { telephone: debounced, nonIndividualOnly: true },
    { skip: !canSearch },
  );
  const matches = canSearch
    ? lookup.currentData?.filter((row) => isNonIndividualCustomerType(row.customerType))
    : undefined;

  function changeTelephone(value: string) {
    const telephone = limitPhoneDigits(value);
    if (telephone === phone) return;
    setValue(
      'sender',
      { customerId: '', customerType: undefined, fullname: '', telephone, telephone2: '' },
      { shouldDirty: true },
    );
  }

  function selectSender(id: string) {
    const sender = matches?.find((match) => match.id === id);
    if (!sender) return;
    const primary = limitPhoneDigits(sender.telephone ?? '');
    const telephone = primary.length === PHONE_DIGITS ? primary : phone;
    setValue(
      'sender',
      {
        customerId: sender.id,
        customerType: sender.customerType,
        fullname: sender.fullname,
        telephone,
        telephone2: sender.telephone2 !== telephone ? (sender.telephone2 ?? '') : '',
      },
      { shouldDirty: true },
    );
  }

  function matchLabel(customer: BookingCustomer) {
    return `${customer.fullname} · ${customerTypeLabel(customer.customerType ?? -1)}`;
  }

  return {
    field,
    phone,
    changeTelephone,
    selectedId,
    selectSender,
    matchLabel,
    matches,
    isSearching: canSearch && lookup.isFetching,
    lookupFailed: canSearch && lookup.isError,
    retryLookup: lookup.refetch,
  };
}
