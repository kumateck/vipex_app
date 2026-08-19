import { useCallback } from 'react';
import { Pencil } from 'lucide-react';
import { useFormContext, useWatch, type FieldPathByValue } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { CardAction } from '@/components/ui/card';
import { useHasPermission } from '@/components/permissions/permission-guard';
import { useGetCustomerByIdQuery } from '@/features/customers/api';
import { normalizePhoneDigits } from '@/lib/phone';
import { sanitizeString } from '@/lib/utils';
import { PermissionKeys } from '@/shared/permissions/constants';
import { ExistingCustomerEditDialog } from '../../dialogs/existing-customer-edit-dialog';
import { useExistingCustomerEdit } from '../../hooks/use-existing-customer-edit';
import type { ParcelBookingFormValues } from './parcel-form.types';

type ExistingCustomerEditActionProps = {
  label: string;
  phoneName: FieldPathByValue<ParcelBookingFormValues, string>;
  customerIdName: FieldPathByValue<ParcelBookingFormValues, string>;
  fullnameName: FieldPathByValue<ParcelBookingFormValues, string>;
  secondaryPhoneName: FieldPathByValue<ParcelBookingFormValues, string>;
};

export function ExistingCustomerEditAction({
  label,
  phoneName,
  customerIdName,
  fullnameName,
  secondaryPhoneName,
}: ExistingCustomerEditActionProps) {
  const { control, setValue } = useFormContext<ParcelBookingFormValues>();
  const phone = sanitizeString(useWatch({ control, name: phoneName }));
  const customerId = sanitizeString(useWatch({ control, name: customerIdName }));
  const canUpdateCustomers = useHasPermission(PermissionKeys.CanUpdateCustomers);
  const { data: customer, isFetching } = useGetCustomerByIdQuery(customerId, {
    skip: !customerId || !canUpdateCustomers,
  });

  const handleUpdated = useCallback(
    (values: { fullname: string; telephone2: string }) => {
      setValue(fullnameName, values.fullname, { shouldDirty: true, shouldValidate: true });
      setValue(secondaryPhoneName, values.telephone2, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [fullnameName, secondaryPhoneName, setValue],
  );

  const edit = useExistingCustomerEdit({ customer, onUpdated: handleUpdated });
  const matchesLookupPhone =
    Boolean(customer) && normalizePhoneDigits(phone) === normalizePhoneDigits(customer?.telephone);

  if (!customerId || !canUpdateCustomers || !matchesLookupPhone) return null;

  return (
    <CardAction>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Edit existing ${label.toLowerCase()} customer`}
        title={`Edit existing ${label.toLowerCase()} customer`}
        onClick={edit.openDialog}
        disabled={isFetching || !customer}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      {customer ? (
        <ExistingCustomerEditDialog
          open={edit.open}
          onOpenChange={edit.setOpen}
          customerLabel={label}
          fullname={edit.values.fullname}
          primaryTelephone={customer.telephone ?? ''}
          secondaryTelephone={edit.values.telephone2}
          isSaving={edit.isSaving}
          onFullnameChange={edit.updateFullname}
          onSecondaryTelephoneChange={edit.updateTelephone2}
          onSave={edit.save}
        />
      ) : null}
    </CardAction>
  );
}
