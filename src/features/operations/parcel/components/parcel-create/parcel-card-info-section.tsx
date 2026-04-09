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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeNumber, sanitizeString } from '@/lib/utils';
import type { ParcelBookingFormValues } from './parcel-form.types';

type ParcelCardInfoSectionProps = {
  control: Control<ParcelBookingFormValues>;
  parcelDetailsName: FieldPathByValue<ParcelBookingFormValues, string>;
  parcelContentName: FieldPathByValue<ParcelBookingFormValues, string>;
  parcelValueName: FieldPathByValue<ParcelBookingFormValues, string>;
};

export function ParcelCardInfoSection({
  control,
  parcelDetailsName,
  parcelContentName,
  parcelValueName,
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
        <FormField
          control={control}
          name={parcelDetailsName}
          rules={{
            required: 'Parcel details are required',
            validate: (value) =>
              sanitizeString(value).trim().length ? true : 'Parcel details are required',
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parcel Details</FormLabel>
              <FormControl>
                <Textarea
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={field.value ?? ''}
                  placeholder="Type parcel details (you can include multiple items)"
                />
              </FormControl>
              <FormDescription>Enter full parcel details as free text.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={parcelContentName}
          rules={{
            required: 'Parcel content is required',
            validate: (value) =>
              sanitizeString(value).trim().length ? true : 'Parcel content is required',
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parcel Content</FormLabel>
              <FormControl>
                <Textarea
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={field.value ?? ''}
                  placeholder="e.g. phones, chargers, documents"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={parcelValueName}
          rules={{
            required: 'Parcel value is required',
            validate: (value) => {
              const normalized = sanitizeString(value).replace(/,/g, '').trim();
              if (!normalized) return 'Parcel value is required';
              return Number.isNaN(sanitizeNumber(normalized)) ? 'Enter a valid parcel value' : true;
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parcel Value (GHS)</FormLabel>
              <FormControl>
                <Input
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={sanitizeString(field.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </FormControl>
              <FormDescription>Declared value for insurance and reporting.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
