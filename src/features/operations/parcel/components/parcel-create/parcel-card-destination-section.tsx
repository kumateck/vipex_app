import type { Control, FieldPathByValue, UseFormClearErrors } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { sanitizeString } from '@/lib/utils';
import type { ParcelBookingFormValues } from './parcel-form.types';

type ParcelCardDestinationSectionProps = {
  control: Control<ParcelBookingFormValues>;
  destinationBranchName: FieldPathByValue<ParcelBookingFormValues, string>;
  destinationLocationName: FieldPathByValue<ParcelBookingFormValues, string>;
  branchOptions: Array<{ id: string; name: string }>;
  locationOptions: Array<{ id: string; name: string }>;
  destinationBranchId: string;
  locationPlaceholder: string;
  isLoadingLocations: boolean;
  clearErrors: UseFormClearErrors<ParcelBookingFormValues>;
};

export function ParcelCardDestinationSection({
  control,
  destinationBranchName,
  destinationLocationName,
  branchOptions,
  locationOptions,
  destinationBranchId,
  locationPlaceholder,
  isLoadingLocations,
  clearErrors,
}: ParcelCardDestinationSectionProps) {
  return (
    <Card size="sm" className="border-muted/50 bg-muted/20 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Destination & Location</CardTitle>
        <CardDescription className="text-xs">
          Select the destination branch and pickup location.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <FormField
          control={control}
          name={destinationBranchName}
          rules={{ required: 'Destination branch is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination Branch</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={sanitizeString(field.value)}
                  onValueChange={field.onChange}
                  placeholder="Select destination"
                  searchPlaceholder="Search branch..."
                  options={branchOptions.map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={destinationLocationName}
          rules={{ required: 'Pickup location is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Location</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={sanitizeString(field.value)}
                  onValueChange={(value) => {
                    field.onChange(value);
                    clearErrors(destinationLocationName);
                  }}
                  isLoading={isLoadingLocations}
                  placeholder={locationPlaceholder}
                  searchPlaceholder="Search location..."
                  options={locationOptions.map((location) => ({
                    value: location.id,
                    label: location.name,
                  }))}
                  disabled={!destinationBranchId || isLoadingLocations}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
