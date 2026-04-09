import { useEffect, useRef } from 'react';
import { useFormContext, useWatch, type FieldPathByValue } from 'react-hook-form';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { sanitizeString } from '@/lib/utils';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { CustomerType, useGetCustomerByIdQuery } from '@/features/customers/api';
import type { ParcelBookingFormValues } from './parcel-form.types';
import { ParcelCardChargeSection } from './parcel-card-charge-section';
import { ParcelCardDestinationSection } from './parcel-card-destination-section';
import { ParcelCardInfoSection } from './parcel-card-info-section';
import { ParcelCardRecipientSection } from './parcel-card-recipient-section';

type ParcelCardProps = {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  companyId: string | null;
  branchOptions: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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
    setValue(destinationLocationName, '', { shouldDirty: true, shouldValidate: false });
    clearErrors(destinationLocationName);
  }, [clearErrors, destinationBranchId, destinationLocationName, setValue]);

  useEffect(() => {
    if (
      !destinationBranchId ||
      isLoadingLocations ||
      locationOptions.length !== 1 ||
      destinationLocationId
    ) {
      return;
    }
    const onlyLocationId = locationOptions[0]?.id;
    if (!onlyLocationId) return;
    setValue(destinationLocationName, onlyLocationId, { shouldDirty: true, shouldValidate: true });
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
              <ParcelCardDestinationSection
                control={control}
                destinationBranchName={destinationBranchName}
                destinationLocationName={destinationLocationName}
                branchOptions={branchOptions}
                locationOptions={locationOptions}
                destinationBranchId={destinationBranchId}
                locationPlaceholder={locationPlaceholder}
                isLoadingLocations={isLoadingLocations}
                clearErrors={clearErrors}
              />
              <ParcelCardRecipientSection
                receiverPhoneName={receiverPhoneName}
                receiverSecondaryPhoneName={receiverSecondaryPhoneName}
                receiverCustomerName={receiverCustomerName}
                receiverFullnameName={receiverFullnameName}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ParcelCardInfoSection
                control={control}
                parcelDetailsName={parcelDetailsName}
                parcelContentName={parcelContentName}
                parcelValueName={parcelValueName}
              />
              <ParcelCardChargeSection
                control={control}
                parcelChargeName={parcelChargeName}
                parcelPaymentName={parcelPaymentName}
                parcelSettlementName={parcelSettlementName}
                senderPartialPaymentName={senderPartialPaymentName}
                paymentResponsibility={paymentResponsibility}
                senderIsCreditEligible={senderIsCreditEligible}
                parcelChargeValue={parcelChargeValue}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
