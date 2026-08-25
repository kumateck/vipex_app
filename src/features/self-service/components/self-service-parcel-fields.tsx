import type { Control } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <FormField
        control={control}
        name="callSender"
        render={({ field }) => (
          <label
            htmlFor="self-service-call-sender"
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/12 bg-white/[0.05] p-4 transition-colors hover:bg-white/[0.08]"
          >
            <Checkbox
              id="self-service-call-sender"
              checked={field.value}
              onCheckedChange={(value) => field.onChange(value === true)}
              className="mt-0.5 size-5 border-white/30 data-checked:border-[#ef3340] data-checked:bg-[#ef3340]"
            />
            <span className="text-sm text-white">
              <Label htmlFor="self-service-call-sender" className="font-semibold text-white">
                Call me before delivery
              </Label>
              <span className="mt-1 block leading-5 text-white/45">
                We&apos;ll call you before this parcel is given to the receiver.
              </span>
            </span>
          </label>
        )}
      />
    </div>
  );
}
