import { useEffect, useRef } from 'react';
import { useFormContext, useWatch, type FieldPathByValue } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { CustomerLookupSection } from './customer-lookup-section';
import type { ParcelBookingFormValues } from './parcel-form.types';

type ParcelCardProps = {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  companyId: string | null;
  branchOptions: Array<{ id: string; name: string }>;
};

export function ParcelCard({
  index,
  canRemove,
  onRemove,
  companyId,
  branchOptions,
}: ParcelCardProps) {
  const { control, setValue } = useFormContext<ParcelBookingFormValues>();
  const parcelFieldName = (
    field:
      | 'destinationBranchId'
      | 'destinationLocationId'
      | 'parcelDetails'
      | 'parcelContent'
      | 'parcelValue'
      | 'charge'
      | 'paymentResponsibility'
      | 'receiver.telephone'
      | 'receiver.customerId'
      | 'receiver.fullname',
  ) => `parcels.${index}.${field}` as FieldPathByValue<ParcelBookingFormValues, string>;
  const destinationBranchName = parcelFieldName('destinationBranchId');
  const destinationLocationName = parcelFieldName('destinationLocationId');
  const parcelDetailsName = parcelFieldName('parcelDetails');
  const parcelContentName = parcelFieldName('parcelContent');
  const parcelValueName = parcelFieldName('parcelValue');
  const parcelChargeName = parcelFieldName('charge');
  const parcelPaymentName = parcelFieldName('paymentResponsibility');
  const receiverPhoneName = parcelFieldName('receiver.telephone');
  const receiverCustomerName = parcelFieldName('receiver.customerId');
  const receiverFullnameName = parcelFieldName('receiver.fullname');

  const destinationBranchId = String(useWatch({ control, name: destinationBranchName }) ?? '');
  const previousBranchId = useRef(destinationBranchId);

  const { data: locationOptions = [], isLoading: isLoadingLocations } = useListLocationOptionsQuery(
    destinationBranchId && companyId ? { companyId, branchId: destinationBranchId } : undefined,
    { skip: !destinationBranchId || !companyId },
  );

  useEffect(() => {
    if (previousBranchId.current === destinationBranchId) return;
    previousBranchId.current = destinationBranchId;
    setValue(destinationLocationName, '', {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [destinationBranchId, destinationLocationName, setValue]);

  const locationPlaceholder = !destinationBranchId
    ? 'Select destination branch first'
    : isLoadingLocations
      ? 'Loading locations...'
      : locationOptions.length
        ? 'Select location'
        : 'No locations available';

  return (
    <Card size="sm" className="border-muted/60 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Parcel {index + 1}</Badge>
              <span className="text-xs text-muted-foreground">
                Recipient, destination, and parcel details.
              </span>
            </div>
          </div>
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
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
                    <Select value={String(field.value ?? '')} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branchOptions.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select
                      value={String(field.value ?? '')}
                      onValueChange={field.onChange}
                      disabled={!destinationBranchId || isLoadingLocations}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={locationPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationOptions.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card size="sm" className="border-muted/50 bg-muted/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recipient</CardTitle>
              <CardDescription className="text-xs">
                Search by phone or create a new recipient.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerLookupSection
                label="Recipient"
                phoneName={receiverPhoneName}
                customerIdName={receiverCustomerName}
                fullnameName={receiverFullnameName}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
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
                    String(value ?? '').trim().length ? true : 'Parcel details are required',
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
                        value={String(field.value ?? '')}
                        placeholder="e.g. fragile electronics"
                      />
                    </FormControl>
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
                    String(value ?? '').trim().length ? true : 'Parcel content is required',
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
                        value={String(field.value ?? '')}
                        placeholder="e.g. phone, charger"
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
                    const normalized = String(value ?? '')
                      .replace(/,/g, '')
                      .trim();
                    if (!normalized) return 'Parcel value is required';
                    return Number.isNaN(Number(normalized)) ? 'Enter a valid parcel value' : true;
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
                        value={String(field.value ?? '')}
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

          <Card size="sm" className="border-muted/50 bg-muted/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Charge</CardTitle>
              <CardDescription className="text-xs">
                Set how much is paid and by whom.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormField
                control={control}
                name={parcelChargeName}
                rules={{
                  required: 'Charge is required',
                  validate: (value) => {
                    const normalized = String(value ?? '')
                      .replace(/,/g, '')
                      .trim();
                    if (!normalized) return 'Charge is required';
                    return Number.isNaN(Number(normalized)) ? 'Enter a valid charge' : true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge (GHS)</FormLabel>
                    <FormControl>
                      <Input
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        value={String(field.value ?? '')}
                        inputMode="decimal"
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormDescription>Charge amount for this parcel.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={parcelPaymentName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Responsibility</FormLabel>
                    <Select value={String(field.value ?? 'SENDER')} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SENDER">Sender pays now</SelectItem>
                        <SelectItem value="RECEIVER">Receiver pays on pickup</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
