import type { Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SelfServiceTermsDialog } from '../../dialogs';
import type { SelfServiceBookingFormValues } from '../../types/self-service-form.types';

type SelfServiceTermsConsentProps = {
  control: Control<SelfServiceBookingFormValues>;
};

export function SelfServiceTermsConsent({ control }: SelfServiceTermsConsentProps) {
  return (
    <FormField
      control={control}
      name="acceptedTerms"
      rules={{ validate: (accepted) => accepted || 'You must accept the terms before continuing.' }}
      render={({ field }) => (
        <FormItem className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
          <div className="flex items-start gap-3">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-0.5 size-5 border-white/30 data-checked:border-[#ef3340] data-checked:bg-[#ef3340]"
              />
            </FormControl>
            <div className="min-w-0 text-sm leading-5">
              <FormLabel className="inline cursor-pointer font-medium text-white">
                I have read, understood, and agree to the
              </FormLabel>{' '}
              <SelfServiceTermsDialog
                trigger={
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 align-baseline font-semibold text-[#ff8087] underline underline-offset-4 hover:text-[#ff9ca1]"
                  >
                    Terms & Conditions
                  </Button>
                }
              />
              <FormMessage className="mt-2 text-[#ff9ca1]" />
            </div>
          </div>
        </FormItem>
      )}
    />
  );
}
