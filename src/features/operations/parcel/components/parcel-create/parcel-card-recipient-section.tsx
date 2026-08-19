import type { FieldPathByValue } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerLookupSection } from './customer-lookup-section';
import { ExistingCustomerEditAction } from './existing-customer-edit-action';
import type { ParcelBookingFormValues } from './parcel-form.types';

type ParcelCardRecipientSectionProps = {
  receiverPhoneName: FieldPathByValue<ParcelBookingFormValues, string>;
  receiverSecondaryPhoneName: FieldPathByValue<ParcelBookingFormValues, string>;
  receiverCustomerName: FieldPathByValue<ParcelBookingFormValues, string>;
  receiverFullnameName: FieldPathByValue<ParcelBookingFormValues, string>;
};

export function ParcelCardRecipientSection({
  receiverPhoneName,
  receiverSecondaryPhoneName,
  receiverCustomerName,
  receiverFullnameName,
}: ParcelCardRecipientSectionProps) {
  return (
    <Card size="sm" className="border-muted/50 bg-muted/20 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Recipient</CardTitle>
        <CardDescription className="text-xs">
          Search by phone or create a new recipient.
        </CardDescription>
        <ExistingCustomerEditAction
          label="Recipient"
          phoneName={receiverPhoneName}
          customerIdName={receiverCustomerName}
          fullnameName={receiverFullnameName}
          secondaryPhoneName={receiverSecondaryPhoneName}
        />
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
  );
}
