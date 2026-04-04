import { useEffect } from 'react';
import { useFormContext, useWatch, type FieldPathByValue } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { sanitizeString } from '@/lib/utils';
import { useFindCustomersByTelephoneQuery } from '@/features/customers/api';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import type { ParcelBookingFormValues } from './parcel-form.types';

type CustomerLookupSectionProps = {
  label: string;
  phoneName: FieldPathByValue<ParcelBookingFormValues, string>;
  secondaryPhoneName: FieldPathByValue<ParcelBookingFormValues, string>;
  customerIdName: FieldPathByValue<ParcelBookingFormValues, string>;
  fullnameName: FieldPathByValue<ParcelBookingFormValues, string>;
  helperText?: string;
  layout?: 'stacked' | 'split';
};

const PHONE_LOOKUP_DELAY_MS = 1000;
const PHONE_DIGITS = 10;

const normalizePhoneDigits = (value: string) => value.replace(/\D/g, '');

export function CustomerLookupSection({
  label,
  phoneName,
  secondaryPhoneName,
  customerIdName,
  fullnameName,
  helperText,
  layout = 'stacked',
}: CustomerLookupSectionProps) {
  const { control, setValue } = useFormContext<ParcelBookingFormValues>();
  const phone = sanitizeString(useWatch({ control, name: phoneName }));
  const selectedCustomerId = sanitizeString(useWatch({ control, name: customerIdName }));

  const normalizedPhone = normalizePhoneDigits(phone);
  const debouncedPhone = useDebouncedValue(normalizedPhone, PHONE_LOOKUP_DELAY_MS);
  const canLookup = debouncedPhone.length === PHONE_DIGITS;

  const { data: customers = [], isFetching } = useFindCustomersByTelephoneQuery(
    { telephone: debouncedPhone, limit: 10 },
    { skip: !canLookup },
  );

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const shouldEnableName = canLookup && !isFetching && customers.length === 0;
  const isExistingCustomer = Boolean(selectedCustomer);

  useEffect(() => {
    if (!canLookup) {
      if (selectedCustomerId) {
        setValue(customerIdName, '', { shouldDirty: true, shouldValidate: true });
        setValue(fullnameName, '', { shouldDirty: true, shouldValidate: true });
        setValue(secondaryPhoneName, '', { shouldDirty: true, shouldValidate: true });
      }
      return;
    }

    if (!customers.length) {
      if (selectedCustomerId) {
        setValue(customerIdName, '', { shouldDirty: true, shouldValidate: true });
        setValue(fullnameName, '', { shouldDirty: true, shouldValidate: true });
        setValue(secondaryPhoneName, '', { shouldDirty: true, shouldValidate: true });
      }
      return;
    }

    const nextCustomer = selectedCustomer ?? customers[0];
    if (nextCustomer && nextCustomer.id !== selectedCustomerId) {
      setValue(customerIdName, nextCustomer.id, { shouldDirty: true, shouldValidate: true });
    }
    if (nextCustomer?.fullname) {
      setValue(fullnameName, nextCustomer.fullname, { shouldDirty: true, shouldValidate: true });
    }
    setValue(secondaryPhoneName, nextCustomer?.telephone2 ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [
    canLookup,
    customerIdName,
    customers,
    fullnameName,
    secondaryPhoneName,
    selectedCustomer,
    selectedCustomerId,
    setValue,
  ]);

  const showExistingUserSelect = customers.length > 0;
  const showFullnameInput = !showExistingUserSelect;
  const nameDescription = shouldEnableName
    ? 'No match found. A new customer will be created on save.'
    : 'Enter exactly 10 digits to enable name entry.';

  const fieldLayoutClass = layout === 'split' ? 'grid gap-4 md:grid-cols-2' : 'flex flex-col gap-4';

  return (
    <div className="space-y-4">
      <div className={fieldLayoutClass}>
        <FormField
          control={control}
          name={phoneName}
          rules={{
            required: `${label} telephone is required`,
            validate: (value) =>
              normalizePhoneDigits(sanitizeString(value)).length === PHONE_DIGITS ||
              `${label} telephone must be exactly ${PHONE_DIGITS} digits`,
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label} Telephone</FormLabel>
              <FormControl>
                <Input
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={sanitizeString(field.value)}
                  placeholder="0240000000"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </FormControl>
              <FormDescription>
                {helperText ??
                  `Lookup starts after 1 second when exactly ${PHONE_DIGITS} digits are entered.`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={secondaryPhoneName}
          rules={{
            validate: (value) => {
              const digits = normalizePhoneDigits(sanitizeString(value));
              const primaryDigits = normalizePhoneDigits(phone);
              if (!digits.length) return true;
              if (digits.length !== PHONE_DIGITS) {
                return `${label} secondary telephone must be exactly ${PHONE_DIGITS} digits`;
              }
              if (digits === primaryDigits) {
                return 'Primary and secondary telephone cannot be the same';
              }
              return true;
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label} Telephone 2 (Optional)</FormLabel>
              <FormControl>
                <Input
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={sanitizeString(field.value)}
                  disabled={isExistingCustomer}
                  placeholder="0240000001"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </FormControl>
              <FormDescription>
                {isExistingCustomer
                  ? 'Secondary telephone is managed from the selected customer record.'
                  : 'Optional secondary telephone for new customer creation.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {showFullnameInput ? (
          <FormField
            control={control}
            name={fullnameName}
            rules={{
              validate: (value) => {
                if (!shouldEnableName && !isExistingCustomer) return true;
                return sanitizeString(value).trim().length ? true : `${label} fullname is required`;
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label} Fullname</FormLabel>
                <FormControl>
                  <Input
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    value={field.value ?? ''}
                    disabled={!shouldEnableName}
                    placeholder={`Enter ${label.toLowerCase()} fullname`}
                  />
                </FormControl>
                <FormDescription>{nameDescription}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
      </div>

      {canLookup && isFetching ? (
        <p className="text-xs text-muted-foreground">Searching customer records...</p>
      ) : null}

      {showExistingUserSelect ? (
        <FormField
          control={control}
          name={customerIdName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label} Fullname</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={sanitizeString(field.value)}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const matched = customers.find((customer) => customer.id === value);
                    if (matched?.fullname) {
                      setValue(fullnameName, matched.fullname, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                    setValue(secondaryPhoneName, matched?.telephone2 ?? '', {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  placeholder={`Select ${label.toLowerCase()} fullname`}
                  searchPlaceholder={`Search ${label.toLowerCase()}...`}
                  options={customers.map((customer) => ({
                    value: customer.id,
                    label: `${customer.fullname}${customer.telephone ? ` (${customer.telephone})` : ''}`,
                  }))}
                />
              </FormControl>
            </FormItem>
          )}
        />
      ) : null}
    </div>
  );
}
