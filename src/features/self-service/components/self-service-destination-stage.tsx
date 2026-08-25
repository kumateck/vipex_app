import { useEffect } from 'react';
import { useFormContext, useWatch, type Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { sanitizeString } from '@/lib/utils';
import {
  useListSelfServiceDestinationBranchesQuery,
  useListSelfServiceDestinationLocationsQuery,
} from '../api/self-service-public.api';
import { SelfServiceStageShell } from './self-service-stage-shell';
import type { SelfServiceBookingFormValues } from '../types/self-service-form.types';
import {
  SELF_SERVICE_LABEL_CLASS,
  SELF_SERVICE_SELECT_CONTENT_CLASS,
  SELF_SERVICE_SELECT_TRIGGER_CLASS,
} from '../utils';

type SelfServiceDestinationStageProps = {
  control: Control<SelfServiceBookingFormValues>;
  branchId: string;
  sessionToken: string;
  onBack?: () => void;
  onNext: () => void;
};

export function SelfServiceDestinationStage({
  control,
  branchId,
  sessionToken,
  onBack,
  onNext,
}: SelfServiceDestinationStageProps) {
  const { setValue, clearErrors } = useFormContext<SelfServiceBookingFormValues>();
  const destinationBranchId = sanitizeString(useWatch({ control, name: 'destinationBranchId' }));

  const { data: branchOptions = [], isLoading: isLoadingBranches } =
    useListSelfServiceDestinationBranchesQuery(
      { sourceBranchId: branchId, sessionToken },
      { skip: !branchId || !sessionToken },
    );

  const { data: locationOptions = [], isLoading: isLoadingLocations } =
    useListSelfServiceDestinationLocationsQuery(
      { sourceBranchId: branchId, destinationBranchId, sessionToken },
      { skip: !branchId || !destinationBranchId || !sessionToken },
    );

  useEffect(() => {
    if (!destinationBranchId || isLoadingLocations || locationOptions.length !== 1) return;
    const onlyLocation = locationOptions[0];
    if (!onlyLocation) return;
    setValue('destinationLocationId', onlyLocation.id, { shouldDirty: true });
    clearErrors('destinationLocationId');
  }, [clearErrors, destinationBranchId, isLoadingLocations, locationOptions, setValue]);

  const locationPlaceholder = !destinationBranchId
    ? 'Select destination branch first'
    : isLoadingLocations
      ? 'Loading locations...'
      : locationOptions.length
        ? 'Select location'
        : 'No locations available';

  return (
    <SelfServiceStageShell
      title="Where is this parcel going?"
      description="Choose the destination branch and drop-off location."
      onBack={onBack}
      onNext={onNext}
    >
      <div className="space-y-5">
        <FormField
          control={control}
          name="destinationBranchId"
          rules={{ required: 'Select a destination branch' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className={SELF_SERVICE_LABEL_CLASS}>Destination branch</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={sanitizeString(field.value)}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue('destinationLocationId', '', { shouldDirty: true });
                    clearErrors('destinationLocationId');
                  }}
                  isLoading={isLoadingBranches}
                  placeholder="Select destination"
                  searchPlaceholder="Search branch..."
                  className={SELF_SERVICE_SELECT_CONTENT_CLASS}
                  triggerClassName={SELF_SERVICE_SELECT_TRIGGER_CLASS}
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
          name="destinationLocationId"
          rules={{ required: 'Select a destination location' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className={SELF_SERVICE_LABEL_CLASS}>Destination location</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={sanitizeString(field.value)}
                  onValueChange={field.onChange}
                  isLoading={isLoadingLocations}
                  placeholder={locationPlaceholder}
                  searchPlaceholder="Search location..."
                  disabled={!destinationBranchId || isLoadingLocations}
                  className={SELF_SERVICE_SELECT_CONTENT_CLASS}
                  triggerClassName={SELF_SERVICE_SELECT_TRIGGER_CLASS}
                  options={locationOptions.map((location) => ({
                    value: location.id,
                    label: location.name,
                  }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </SelfServiceStageShell>
  );
}
