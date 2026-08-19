import { Controller, type Control, type FieldPathByValue } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { sanitizeNumber, sanitizeString } from '@/lib/utils';
import { BufferedParcelField } from './buffered-parcel-field';
import type { ParcelBookingFormValues } from './parcel-form.types';

type ParcelCardInfoSectionProps = {
  control: Control<ParcelBookingFormValues>;
  parcelDetailsName: FieldPathByValue<ParcelBookingFormValues, string>;
  parcelContentName: FieldPathByValue<ParcelBookingFormValues, string>;
  parcelValueName: FieldPathByValue<ParcelBookingFormValues, string>;
  callSenderName: FieldPathByValue<ParcelBookingFormValues, boolean>;
};

export function ParcelCardInfoSection({
  control,
  parcelDetailsName,
  parcelContentName,
  parcelValueName,
  callSenderName,
}: ParcelCardInfoSectionProps) {
  return (
    <Card size="sm" className="border-muted/50 bg-muted/20 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Parcel Info</CardTitle>
        <CardDescription className="text-xs">
          Describe the parcel and its declared value.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <BufferedParcelField
          control={control}
          name={parcelDetailsName}
          label="Parcel Details"
          placeholder="Type parcel details (you can include multiple items)"
          description="Enter full parcel details as free text."
          multiline
          rules={{
            required: 'Parcel details are required',
            validate: (value) =>
              sanitizeString(value).trim().length ? true : 'Parcel details are required',
          }}
        />

        <BufferedParcelField
          control={control}
          name={parcelContentName}
          label="Parcel Content"
          placeholder="e.g. phones, chargers, documents"
          multiline
          rules={{
            required: 'Parcel content is required',
            validate: (value) =>
              sanitizeString(value).trim().length ? true : 'Parcel content is required',
          }}
        />

        <BufferedParcelField
          control={control}
          name={parcelValueName}
          label="Parcel Value (GHS)"
          placeholder="0.00"
          description="Declared value for insurance and reporting."
          inputMode="decimal"
          rules={{
            required: 'Parcel value is required',
            validate: (value) => {
              const normalized = sanitizeString(value).replace(/,/g, '').trim();
              if (!normalized) return 'Parcel value is required';
              return Number.isNaN(sanitizeNumber(normalized)) ? 'Enter a valid parcel value' : true;
            },
          }}
        />

        <label
          htmlFor={`${callSenderName}-checkbox`}
          className="flex items-start gap-3 rounded-md border p-3"
        >
          <Controller
            control={control}
            name={callSenderName}
            render={({ field }) => (
              <Checkbox
                id={`${callSenderName}-checkbox`}
                checked={field.value}
                onCheckedChange={(value) => field.onChange(value === true)}
              />
            )}
          />
          <span className="text-sm">
            <span className="block font-medium">Call sender before delivery</span>
            <span className="text-muted-foreground">
              Require staff to call the sender first before this parcel is given to the receiver.
            </span>
          </span>
        </label>
      </CardContent>
    </Card>
  );
}
