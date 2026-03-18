import { useEffect } from 'react';
import { useFormContext, useWatch, type FieldPath } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFindCustomersByTelephoneQuery } from '@/features/customers/api';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import type { ParcelBookingFormValues } from './parcel-form.types';

type CustomerLookupSectionProps = {
  label: string;
  phoneName: FieldPath<ParcelBookingFormValues>;
  customerIdName: FieldPath<ParcelBookingFormValues>;
  fullnameName: FieldPath<ParcelBookingFormValues>;
  helperText?: string;
  layout?: 'stacked' | 'split';
};

const PHONE_LOOKUP_DELAY_MS = 3000;

export function CustomerLookupSection({
  label,
  phoneName,
  customerIdName,
  fullnameName,
  helperText,
  layout = 'stacked',
}: CustomerLookupSectionProps) {
  const { control, setValue } = useFormContext<ParcelBookingFormValues>();
  const phone = useWatch({ control, name: phoneName }) ?? '';
  const selectedCustomerId = useWatch({ control, name: customerIdName }) ?? '';

  const debouncedPhone = useDebouncedValue(phone, PHONE_LOOKUP_DELAY_MS);
  const canLookup = debouncedPhone.trim().length >= 10;

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
      }
      return;
    }

    if (!customers.length) {
      if (selectedCustomerId) {
        setValue(customerIdName, '', { shouldDirty: true, shouldValidate: true });
        setValue(fullnameName, '', { shouldDirty: true, shouldValidate: true });
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
  }, [
    canLookup,
    customerIdName,
    customers,
    fullnameName,
    selectedCustomer,
    selectedCustomerId,
    setValue,
  ]);

  const nameDescription = isExistingCustomer
    ? 'Using existing customer record.'
    : shouldEnableName
      ? 'No match found. A new customer will be created on save.'
      : 'Enter 10+ digits to enable name entry.';

  const nameDisabled = isExistingCustomer || !shouldEnableName;

  const fieldLayoutClass =
    layout === 'split' ? 'grid gap-4 md:grid-cols-2' : 'flex flex-col gap-4';

  return (
    <div className="space-y-4">
      <div className={fieldLayoutClass}>
        <FormField
          control={control}
          name={phoneName}
          rules={{
            required: `${label} telephone is required`,
            validate: (value) =>
              String(value ?? '').trim().length >= 10 ||
              `${label} telephone must be at least 10 digits`,
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label} Telephone</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="0240000000"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </FormControl>
              <FormDescription>
                {helperText ?? 'Lookup starts after 3 seconds when 10+ digits are entered.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={fullnameName}
          rules={{
            validate: (value) => {
              if (!shouldEnableName && !isExistingCustomer) return true;
              return String(value ?? '').trim().length
                ? true
                : `${label} fullname is required`;
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label} Fullname</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={nameDisabled}
                  placeholder={`Enter ${label.toLowerCase()} fullname`}
                />
              </FormControl>
              <FormDescription>{nameDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {canLookup && isFetching ? (
        <p className="text-xs text-muted-foreground">Searching customer records...</p>
      ) : null}

      {customers.length ? (
        <FormField
          control={control}
          name={customerIdName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label} Customer</FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={(value) => {
                  field.onChange(value);
                  const matched = customers.find((customer) => customer.id === value);
                  if (matched?.fullname) {
                    setValue(fullnameName, matched.fullname, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${label.toLowerCase()} customer`} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.fullname} {customer.telephone ? `(${customer.telephone})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      ) : null}
    </div>
  );
}
