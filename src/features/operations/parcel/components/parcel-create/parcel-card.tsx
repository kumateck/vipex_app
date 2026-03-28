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
import { CreatableCombobox } from '@/components/ui/creatable-combobox';
import { Textarea } from '@/components/ui/textarea';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { CustomerType, useGetCustomerByIdQuery } from '@/features/customers/api';
import {
  useCreateParcelDetailOptionMutation,
  useListParcelContentOptionsQuery,
  useListParcelDetailOptionsQuery,
} from '@/features/operations/parcel/api/parcel.api';
import { CustomerLookupSection } from './customer-lookup-section';
import type { ParcelBookingFormValues } from './parcel-form.types';

type ParcelCardProps = {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  companyId: string | null;
  branchOptions: Array<{ id: string; name: string }>;
  parcelContentModuleEnabled: boolean;
  parcelPackagingModuleEnabled: boolean;
};

const parseCurrency = (value: string | number | null | undefined) => {
  const normalized = String(value ?? '')
    .replace(/,/g, '')
    .trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

export function ParcelCard({
  index,
  canRemove,
  onRemove,
  companyId,
  branchOptions,
  parcelContentModuleEnabled,
  parcelPackagingModuleEnabled,
}: ParcelCardProps) {
  const { control, setValue } = useFormContext<ParcelBookingFormValues>();
  const parcelFieldName = (
    field:
      | 'destinationBranchId'
      | 'destinationLocationId'
      | 'parcelDetailOptionId'
      | 'parcelContentOptionId'
      | 'parcelDetails'
      | 'parcelContent'
      | 'extraWeightCharge'
      | 'parcelValue'
      | 'charge'
      | 'paymentResponsibility'
      | 'senderSettlementMode'
      | 'receiver.telephone'
      | 'receiver.telephone2'
      | 'receiver.customerId'
      | 'receiver.fullname',
  ) => `parcels.${index}.${field}` as FieldPathByValue<ParcelBookingFormValues, string>;
  const destinationBranchName = parcelFieldName('destinationBranchId');
  const destinationLocationName = parcelFieldName('destinationLocationId');
  const parcelDetailOptionName = parcelFieldName('parcelDetailOptionId');
  const parcelContentOptionName = parcelFieldName('parcelContentOptionId');
  const parcelDetailsName = parcelFieldName('parcelDetails');
  const parcelContentName = parcelFieldName('parcelContent');
  const extraWeightChargeName = parcelFieldName('extraWeightCharge');
  const parcelValueName = parcelFieldName('parcelValue');
  const parcelChargeName = parcelFieldName('charge');
  const parcelPaymentName = parcelFieldName('paymentResponsibility');
  const parcelSettlementName = parcelFieldName('senderSettlementMode');
  const receiverPhoneName = parcelFieldName('receiver.telephone');
  const receiverSecondaryPhoneName = parcelFieldName('receiver.telephone2');
  const receiverCustomerName = parcelFieldName('receiver.customerId');
  const receiverFullnameName = parcelFieldName('receiver.fullname');
  const senderCustomerIdName = 'sender.customerId' as const;

  const destinationBranchId = String(useWatch({ control, name: destinationBranchName }) ?? '');
  const selectedParcelDetailOptionId = String(
    useWatch({ control, name: parcelDetailOptionName }) ?? '',
  );
  const selectedParcelContentOptionId = String(
    useWatch({ control, name: parcelContentOptionName }) ?? '',
  );
  const extraWeightCharge = String(useWatch({ control, name: extraWeightChargeName }) ?? '');
  const paymentResponsibility = String(useWatch({ control, name: parcelPaymentName }) ?? 'SENDER');
  const senderSettlementMode = String(
    useWatch({ control, name: parcelSettlementName }) ?? 'PAY_NOW',
  );
  const senderCustomerId = String(useWatch({ control, name: senderCustomerIdName }) ?? '');
  const previousBranchId = useRef(destinationBranchId);

  const { data: locationOptions = [], isLoading: isLoadingLocations } = useListLocationOptionsQuery(
    destinationBranchId && companyId ? { companyId, branchId: destinationBranchId } : undefined,
    { skip: !destinationBranchId || !companyId },
  );

  const { data: senderCustomer } = useGetCustomerByIdQuery(senderCustomerId, {
    skip: !senderCustomerId,
  });
  const { data: parcelContentOptions = [] } = useListParcelContentOptionsQuery(
    companyId ? { companyId, activeOnly: true } : undefined,
    { skip: !companyId },
  );
  const { data: parcelDetailOptions = [] } = useListParcelDetailOptionsQuery(
    companyId ? { companyId, activeOnly: true } : undefined,
    { skip: !companyId },
  );
  const [createParcelDetailOption] = useCreateParcelDetailOptionMutation();

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
      shouldValidate: true,
    });
  }, [destinationBranchId, destinationLocationName, setValue]);

  useEffect(() => {
    if (!parcelContentModuleEnabled) return;
    const selected = parcelContentOptions.find(
      (option) => option.id === selectedParcelContentOptionId,
    );
    setValue(parcelContentName, selected?.name ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    });

    const baseCharge = Number(selected?.basePricePsw ?? 0) / 100;
    const extraCharge = parseCurrency(extraWeightCharge);
    const totalCharge = (baseCharge + extraCharge).toFixed(2);
    setValue(parcelChargeName, totalCharge, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [
    extraWeightCharge,
    parcelChargeName,
    parcelContentModuleEnabled,
    parcelContentName,
    parcelContentOptions,
    selectedParcelContentOptionId,
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
                render={() => (
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
                render={() => (
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
                    String(value ?? '').trim().length ? true : 'Parcel details are required',
                }}
                render={() => (
                  <FormItem>
                    <FormLabel>Parcel Details</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        value={selectedParcelDetailOptionId}
                        options={parcelDetailOptions}
                        getLabel={(option) => option.name}
                        getValue={(option) => option.id}
                        onChange={(nextValue, option) => {
                          setValue(parcelDetailOptionName, nextValue, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue(parcelDetailsName, option?.name ?? '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        onCreate={async (input) => {
                          const trimmed = input.trim();
                          const existing = parcelDetailOptions.find(
                            (option) => option.name.toLowerCase() === trimmed.toLowerCase(),
                          );
                          if (existing) return existing;
                          const created = await createParcelDetailOption({
                            companyId: companyId ?? undefined,
                            name: trimmed,
                            active: true,
                            sortOrder: 0,
                          }).unwrap();
                          return {
                            id: created.id ?? `new-${trimmed.toLowerCase().replace(/\s+/g, '-')}`,
                            name: trimmed,
                            description: null,
                            active: true,
                            sortOrder: 0,
                          };
                        }}
                        placeholder="Select or create packaging style"
                        searchPlaceholder="Search packaging style..."
                        emptyMessage="No packaging style found."
                        allowCreate={parcelPackagingModuleEnabled}
                      />
                    </FormControl>
                    <FormDescription>
                      Standard packaging style. New entries are saved on booking creation.
                    </FormDescription>
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
                    {parcelContentModuleEnabled ? (
                      <>
                        <FormField
                          control={control}
                          name={parcelContentOptionName}
                          render={({ field: optionField }) => (
                            <FormItem>
                              <Select
                                value={String(optionField.value ?? '')}
                                onValueChange={optionField.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select parcel content" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {parcelContentOptions.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                      {option.name} - GHS {(option.basePricePsw / 100).toFixed(2)} (
                                      {option.taxInclusive ? 'tax inclusive' : 'tax exclusive'})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormDescription>
                          Base charge comes from selected content. Add extra weight charge below.
                        </FormDescription>
                      </>
                    ) : (
                      <FormControl>
                        <Textarea
                          name={field.name}
                          ref={field.ref}
                          onBlur={(event) => {
                            field.onBlur();
                            const typed = event.target.value.trim().toLowerCase();
                            if (!typed.length) return;
                            const matched = parcelContentOptions.find(
                              (option) => option.name.trim().toLowerCase() === typed,
                            );
                            if (!matched) return;
                            setValue(parcelChargeName, (matched.basePricePsw / 100).toFixed(2), {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          onChange={field.onChange}
                          value={String(field.value ?? '')}
                          placeholder="e.g. phone, charger"
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {parcelContentModuleEnabled ? (
                <FormField
                  control={control}
                  name={extraWeightChargeName}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extra Weight Charge (GHS)</FormLabel>
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
                      <FormDescription>
                        Applied only when parcel content pricing module is enabled.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

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

              <FormField
                control={control}
                name={parcelSettlementName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Settlement</FormLabel>
                    <Select
                      value={String(field.value ?? 'PAY_NOW')}
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
    </Card>
  );
}
