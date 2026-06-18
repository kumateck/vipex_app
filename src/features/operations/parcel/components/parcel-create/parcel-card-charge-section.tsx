import type { Control, FieldPathByValue } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sanitizeNumber, sanitizeString } from '@/lib/utils';
import { BufferedParcelField } from './buffered-parcel-field';
import type { ParcelBookingFormValues } from './parcel-form.types';

type ParcelCardChargeSectionProps = {
  control: Control<ParcelBookingFormValues>;
  parcelChargeName: FieldPathByValue<ParcelBookingFormValues, string>;
  parcelPaymentName: FieldPathByValue<ParcelBookingFormValues, string>;
  parcelSettlementName: FieldPathByValue<ParcelBookingFormValues, string>;
  senderPartialPaymentName: FieldPathByValue<ParcelBookingFormValues, string>;
  paymentResponsibility: string;
  senderIsCreditEligible: boolean;
  parcelChargeValue: string;
};

const parseCurrency = (value: string | number | null | undefined) => {
  const normalized = sanitizeString(value).replace(/,/g, '').trim();
  if (!normalized) return 0;
  const parsed = sanitizeNumber(normalized);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

export function ParcelCardChargeSection({
  control,
  parcelChargeName,
  parcelPaymentName,
  parcelSettlementName,
  senderPartialPaymentName,
  paymentResponsibility,
  senderIsCreditEligible,
  parcelChargeValue,
}: ParcelCardChargeSectionProps) {
  return (
    <Card size="sm" className="border-muted/50 bg-muted/20 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Charge</CardTitle>
        <CardDescription className="text-xs">Set how much is paid and by whom.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <BufferedParcelField
          control={control}
          name={parcelChargeName}
          label="Charge (GHS)"
          placeholder="0.00"
          description="Charge amount for this parcel."
          inputMode="decimal"
          rules={{
            required: 'Charge is required',
            validate: (value) => {
              const normalized = sanitizeString(value).replace(/,/g, '').trim();
              if (!normalized) return 'Charge is required';
              return Number.isNaN(sanitizeNumber(normalized)) ? 'Enter a valid charge' : true;
            },
          }}
        />

        <FormField
          control={control}
          name={parcelPaymentName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Responsibility</FormLabel>
              <Select
                value={sanitizeString(field.value ?? 'SENDER')}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SENDER">Sender pays now</SelectItem>
                  <SelectItem value="RECEIVER">Receiver pays on pickup</SelectItem>
                  <SelectItem value="SPLIT">Partial payment (sender + receiver)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {paymentResponsibility === 'SPLIT' ? (
          <BufferedParcelField
            control={control}
            name={senderPartialPaymentName}
            label="Sender Partial Payment (GHS)"
            placeholder="0.00"
            description="Sender pays this amount now; receiver pays the remainder at pickup."
            inputMode="decimal"
            rules={{
              required: 'Sender partial payment is required',
              validate: (value) => {
                const amount = parseCurrency(sanitizeString(value));
                const charge = parseCurrency(parcelChargeValue);
                if (amount <= 0) return 'Sender partial payment is required';
                if (amount >= charge) return 'Partial payment must be less than total charge';
                return true;
              },
            }}
          />
        ) : null}

        <FormField
          control={control}
          name={parcelSettlementName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sender Settlement</FormLabel>
              <Select
                value={sanitizeString(field.value ?? 'PAY_NOW')}
                onValueChange={field.onChange}
                disabled={paymentResponsibility !== 'SENDER'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sender settlement" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PAY_NOW">Pay now</SelectItem>
                  {senderIsCreditEligible ? (
                    <SelectItem value="CREDIT">On credit</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
              {!senderIsCreditEligible && paymentResponsibility === 'SENDER' ? (
                <FormDescription>
                  Credit is available only for eligible business senders in CRM.
                </FormDescription>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
