import { useEffect, useRef } from 'react';
import { useFormContext, useWatch, type FieldPathByValue } from 'react-hook-form';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeNumber, sanitizeString } from '@/lib/utils';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { CustomerType, useGetCustomerByIdQuery } from '@/features/customers/api';
import { CustomerLookupSection } from './customer-lookup-section';
import type { ParcelBookingFormValues } from './parcel-form.types';

type ParcelCardProps = {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  companyId: string | null;
  branchOptions: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const parseCurrency = (value: string | number | null | undefined) => {
  const normalized = sanitizeString(value).replace(/,/g, '').trim();
  if (!normalized) return 0;
  const parsed = sanitizeNumber(normalized);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

export function ParcelCard({
  index,
  canRemove,
  onRemove,
  companyId,
  branchOptions,
  isOpen,
  onOpenChange,
}: ParcelCardProps) {
  const { control, clearErrors, setValue } = useFormContext<ParcelBookingFormValues>();
  const parcelFieldName = (
    field:
      | 'destinationBranchId'
      | 'destinationLocationId'
      | 'parcelDetails'
      | 'parcelContent'
      | 'parcelValue'
      | 'charge'
      | 'paymentResponsibility'
      | 'senderSettlementMode'
      | 'senderPartialPayment'
      | 'receiver.telephone'
      | 'receiver.telephone2'
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
  const parcelSettlementName = parcelFieldName('senderSettlementMode');
  const senderPartialPaymentName = parcelFieldName('senderPartialPayment');
  const receiverPhoneName = parcelFieldName('receiver.telephone');
  const receiverSecondaryPhoneName = parcelFieldName('receiver.telephone2');
  const receiverCustomerName = parcelFieldName('receiver.customerId');
  const receiverFullnameName = parcelFieldName('receiver.fullname');
  const senderCustomerIdName = 'sender.customerId' as const;

  const destinationBranchId = sanitizeString(useWatch({ control, name: destinationBranchName }));
  const destinationLocationId = sanitizeString(
    useWatch({ control, name: destinationLocationName }),
  );
  const parcelChargeValue = sanitizeString(useWatch({ control, name: parcelChargeName }));
  const paymentResponsibility = sanitizeString(
    useWatch({ control, name: parcelPaymentName }) ?? 'SENDER',
  );
  const senderSettlementMode = sanitizeString(
    useWatch({ control, name: parcelSettlementName }) ?? 'PAY_NOW',
  );
  const senderCustomerId = sanitizeString(useWatch({ control, name: senderCustomerIdName }));
  const previousBranchId = useRef(destinationBranchId);

  const { data: locationOptions = [], isLoading: isLoadingLocations } = useListLocationOptionsQuery(
    destinationBranchId && companyId ? { companyId, branchId: destinationBranchId } : undefined,
    { skip: !destinationBranchId || !companyId },
  );

  const { data: senderCustomer } = useGetCustomerByIdQuery(senderCustomerId, {
    skip: !senderCustomerId,
  });
  const senderIsCreditEligible =
    !!senderCustomer &&
    senderCustomer.customerType === CustomerType.Business &&
    senderCustomer.creditEligible;

  useEffect(() => {
    const senderPays = paymentResponsibility === 'SENDER';
    if ((!senderPays || !senderIsCreditEligible) && senderSettlementMode === 'CREDIT') {
      setValue(parcelSettlementName, 'PAY_NOW', {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    parcelSettlementName,
    paymentResponsibility,
    senderIsCreditEligible,
    senderSettlementMode,
    setValue,
  ]);

  useEffect(() => {
    if (previousBranchId.current === destinationBranchId) return;
    previousBranchId.current = destinationBranchId;
    setValue(destinationLocationName, '', {
      shouldDirty: true,
      shouldValidate: false,
    });
    clearErrors(destinationLocationName);
  }, [clearErrors, destinationBranchId, destinationLocationName, setValue]);

  useEffect(() => {
    if (!destinationBranchId || isLoadingLocations) return;
    if (locationOptions.length !== 1) return;
    if (destinationLocationId) return;

    const onlyLocationId = locationOptions[0]?.id;
    if (!onlyLocationId) return;

    setValue(destinationLocationName, onlyLocationId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearErrors(destinationLocationName);
  }, [
    clearErrors,
    destinationBranchId,
    destinationLocationId,
    destinationLocationName,
    isLoadingLocations,
    locationOptions,
    setValue,
  ]);

  const locationPlaceholder = !destinationBranchId
    ? 'Select destination branch first'
    : isLoadingLocations
      ? 'Loading locations...'
      : locationOptions.length
        ? 'Select location'
        : 'No locations available';

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card size="sm" className="border-muted/60 shadow-none">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Parcel {index + 1}</Badge>
                <span className="text-xs text-muted-foreground">
                  Recipient, destination, and parcel details.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isOpen ? 'Collapse' : 'Expand'}
                </Button>
              </CollapsibleTrigger>
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
          </div>
        </CardHeader>
        <CollapsibleContent forceMount className={isOpen ? 'block' : 'hidden'}>
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
                        {/*
                    <Select
                      value={sanitizeString(field.value)}
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
                    */}
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
                    secondaryPhoneName={receiverSecondaryPhoneName}
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
                        return Number.isNaN(sanitizeNumber(normalized))
                          ? 'Enter a valid parcel value'
                          : true;
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
                        <FormDescription>
                          Declared value for insurance and reporting.
                        </FormDescription>
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
                        const normalized = sanitizeString(value).replace(/,/g, '').trim();
                        if (!normalized) return 'Charge is required';
                        return Number.isNaN(sanitizeNumber(normalized))
                          ? 'Enter a valid charge'
                          : true;
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
                            value={sanitizeString(field.value)}
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
                            <SelectItem value="SPLIT">
                              Partial payment (sender + receiver)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {paymentResponsibility === 'SPLIT' ? (
                    <FormField
                      control={control}
                      name={senderPartialPaymentName}
                      rules={{
                        required: 'Sender partial payment is required',
                        validate: (value) => {
                          const amount = parseCurrency(sanitizeString(value));
                          const charge = parseCurrency(parcelChargeValue);
                          if (amount <= 0) return 'Sender partial payment is required';
                          if (amount >= charge)
                            return 'Partial payment must be less than total charge';
                          return true;
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender Partial Payment (GHS)</FormLabel>
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
                          <FormDescription>
                            Sender pays this amount now; receiver pays the remainder at pickup.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
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
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
