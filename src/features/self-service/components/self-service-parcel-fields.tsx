import type { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeNumber, sanitizeString } from '@/lib/utils';
import type { SelfServiceBookingFormValues } from '../types/self-service-form.types';
import {
  SELF_SERVICE_INPUT_CLASS,
  SELF_SERVICE_LABEL_CLASS,
  SELF_SERVICE_TEXTAREA_CLASS,
} from '../utils';

export function SelfServiceParcelFields({
  control,
}: {
  control: Control<SelfServiceBookingFormValues>;
}) {
  return (
    <div className="space-y-5">
      <FormField
        control={control}
        name="parcelContent"
        rules={{
          required: 'Parcel content is required',
          validate: (value) =>
            sanitizeString(value).trim().length ? true : 'Parcel content is required',
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className={SELF_SERVICE_LABEL_CLASS}>
              What&apos;s inside the parcel?
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                autoFocus
                placeholder="e.g. 2 shirts and one pair of shoes"
                className={SELF_SERVICE_TEXTAREA_CLASS}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="parcelValue"
        rules={{
          required: 'Parcel value is required',
          validate: (value) => {
            const normalized = sanitizeString(value).replace(/,/g, '').trim();
            if (!normalized) return 'Parcel value is required';
            const amount = sanitizeNumber(normalized);
            return Number.isNaN(amount) || amount < 0 ? 'Enter a valid parcel value' : true;
          },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className={SELF_SERVICE_LABEL_CLASS}>
              How much is the parcel worth?
            </FormLabel>
            <FormControl>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-white/45">
                  GH₵
                </span>
                <Input
                  {...field}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`${SELF_SERVICE_INPUT_CLASS} pl-14`}
                />
              </div>
            </FormControl>
            <p className="text-xs leading-5 text-white/40">
              This is the declared value of the items inside the parcel.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
