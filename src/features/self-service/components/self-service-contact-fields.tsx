import { useEffect, useState } from 'react';
import { useFormContext, useWatch, type Control } from 'react-hook-form';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { limitPhoneDigits, normalizePhoneDigits, PHONE_DIGITS } from '@/lib/phone';
import { sanitizeString } from '@/lib/utils';
import { useDebouncedValue } from '@/features/operations/parcel/hooks/use-debounced-value';
import { useLookupSelfServiceCustomerQuery } from '../api/self-service-public.api';
import type { SelfServiceBookingFormValues } from '../types/self-service-form.types';
import { SELF_SERVICE_INPUT_CLASS, SELF_SERVICE_LABEL_CLASS } from '../utils';

const PHONE_LOOKUP_DELAY_MS = 600;

type SelfServiceContactFieldsProps = {
  control: Control<SelfServiceBookingFormValues>;
  branchId: string;
  sessionToken: string;
  namePrefix: 'sender' | 'receiver';
  phoneLabel: string;
  fullnameLabel: string;
  fullnamePlaceholder: string;
  phoneRequiredMessage: string;
  newCustomerIntro: string;
};

export function SelfServiceContactFields({
  control,
  branchId,
  sessionToken,
  namePrefix,
  phoneLabel,
  fullnameLabel,
  fullnamePlaceholder,
  phoneRequiredMessage,
  newCustomerIntro,
}: SelfServiceContactFieldsProps) {
  const { setValue } = useFormContext<SelfServiceBookingFormValues>();
  const [showBackupPhone, setShowBackupPhone] = useState(false);
  const phone = sanitizeString(useWatch({ control, name: `${namePrefix}.phone` }));
  const phone2 = sanitizeString(useWatch({ control, name: `${namePrefix}.phone2` }));

  const normalizedPhone = normalizePhoneDigits(phone);
  const debouncedPhone = useDebouncedValue(normalizedPhone, PHONE_LOOKUP_DELAY_MS);
  // Only search once exactly 10 digits are entered - never fire on partial input.
  const canLookup = debouncedPhone.length === PHONE_DIGITS;

  const {
    data: match,
    isFetching,
    isError,
    refetch,
  } = useLookupSelfServiceCustomerQuery(
    { branchId, phone: debouncedPhone, sessionToken },
    { skip: !canLookup || !branchId },
  );

  useEffect(() => {
    if (phone2 && !showBackupPhone) setShowBackupPhone(true);
  }, [phone2, showBackupPhone]);

  useEffect(() => {
    if (!canLookup || !match) {
      setValue(`${namePrefix}.customerId`, '', { shouldDirty: true });
      return;
    }
    setValue(`${namePrefix}.fullname`, match.fullname, { shouldDirty: true, shouldValidate: true });
    setValue(`${namePrefix}.customerId`, match.customerId, { shouldDirty: true });
    if (!phone2 && match.telephone2) {
      setValue(`${namePrefix}.phone2`, limitPhoneDigits(match.telephone2), { shouldDirty: true });
      setShowBackupPhone(true);
    }
  }, [canLookup, match, namePrefix, phone2, setValue]);

  // Not found (lookup succeeded, no match) is a different state from lookup
  // failed (network/server error) - never tell the customer they're "new"
  // when we simply couldn't check.
  const isChecking = canLookup && isFetching;
  const isExistingCustomer = canLookup && !isChecking && !isError && !!match;
  const isNewCustomer = canLookup && !isChecking && !isError && !match;

  return (
    <div className="space-y-5">
      <FormField
        control={control}
        name={`${namePrefix}.phone`}
        rules={{
          required: phoneRequiredMessage,
          validate: (value) =>
            normalizePhoneDigits(value).length === PHONE_DIGITS ||
            `Enter a valid ${PHONE_DIGITS}-digit phone number`,
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className={SELF_SERVICE_LABEL_CLASS}>{phoneLabel}</FormLabel>
            <FormControl>
              <Input
                value={field.value}
                onChange={(event) => field.onChange(limitPhoneDigits(event.target.value))}
                onBlur={field.onBlur}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="0240000000"
                maxLength={PHONE_DIGITS}
                autoFocus
                className={SELF_SERVICE_INPUT_CLASS}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {isChecking ? (
        <p className="flex items-center gap-1.5 text-xs text-white/45">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking number...
        </p>
      ) : null}

      {isError ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3">
          <p className="text-xs text-red-200">We couldn&apos;t check this number right now.</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-white hover:bg-white/10 hover:text-white"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        </div>
      ) : null}

      {isExistingCustomer && match ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-emerald-200/70">Welcome back</p>
            <p className="truncate text-sm font-semibold text-white">{match.fullname}</p>
          </div>
        </div>
      ) : null}

      {isNewCustomer ? <p className="text-sm leading-6 text-white/45">{newCustomerIntro}</p> : null}

      {isExistingCustomer || isNewCustomer ? (
        <FormField
          control={control}
          name={`${namePrefix}.fullname`}
          rules={{ required: fullnameLabel + ' is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className={SELF_SERVICE_LABEL_CLASS}>{fullnameLabel}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isExistingCustomer}
                  placeholder={fullnamePlaceholder}
                  className={SELF_SERVICE_INPUT_CLASS}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {!showBackupPhone ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-sm font-medium text-[#ff7b82] hover:text-[#ff969b]"
          onClick={() => setShowBackupPhone(true)}
        >
          + Add backup number
        </Button>
      ) : (
        <FormField
          control={control}
          name={`${namePrefix}.phone2`}
          rules={{
            validate: (value) =>
              !value ||
              normalizePhoneDigits(value).length === PHONE_DIGITS ||
              `Backup number must be exactly ${PHONE_DIGITS} digits`,
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className={SELF_SERVICE_LABEL_CLASS}>Backup number (optional)</FormLabel>
              <FormControl>
                <Input
                  value={field.value}
                  onChange={(event) => field.onChange(limitPhoneDigits(event.target.value))}
                  onBlur={field.onBlur}
                  disabled={isExistingCustomer}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="0240000001"
                  maxLength={PHONE_DIGITS}
                  className={SELF_SERVICE_INPUT_CLASS}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
