import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { customerTypeLabel } from '@/shared/customers/customer-types';
import type { ParcelBookingFormValues } from '../../../parcel/components/parcel-create/parcel-form.types';
import { useParcelChargeExemption } from '../../hooks';

export function ParcelChargeExemption({
  index,
  source = 'booking',
}: {
  index: number;
  source?: 'booking' | 'self-service';
}) {
  const { control } = useFormContext<ParcelBookingFormValues>();
  const { exemptionType, staff, destinationId } = useParcelChargeExemption(index, source);
  if (exemptionType == null) return null;
  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <p className="text-sm font-medium">{customerTypeLabel(exemptionType)} — Exempt · GHS 0.00</p>
      <p className="text-sm text-muted-foreground">
        Exempt from all charges, including storage and delivery fees.
      </p>
      {exemptionType === 5 ? (
        <FormField
          control={control}
          name={`parcels.${index}.relatedStaffId`}
          rules={{
            validate: (value) =>
              staff.currentData?.some((row) => row.id === value) ||
              'Select the staff member receiving this parcel',
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receiving staff (required)</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  options={(staff.currentData ?? []).map((row) => ({
                    value: row.id,
                    label: `${row.fullname} (${row.employeeNumber})`,
                  }))}
                  placeholder={
                    !destinationId
                      ? 'Select destination branch first'
                      : staff.isFetching
                        ? 'Loading staff...'
                        : 'Select receiving staff'
                  }
                  searchPlaceholder="Search staff..."
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                The receiver can use the office number. Select the actual staff member receiving the
                parcel.
              </p>
              {destinationId &&
              !staff.isFetching &&
              !staff.isError &&
              !staff.currentData?.length ? (
                <p role="status" className="text-sm">
                  No active staff found at this branch.
                </p>
              ) : null}
              {staff.isError ? (
                <div role="alert">
                  Unable to load staff.{' '}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void staff.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </div>
  );
}
