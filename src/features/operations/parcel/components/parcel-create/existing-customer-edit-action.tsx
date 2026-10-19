import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardAction } from '@/components/ui/card';
import { ExistingCustomerEditDialog } from '../../dialogs/existing-customer-edit-dialog';
import { useBookingCustomerEdit, type BookingCustomerEditFields } from '../../hooks';

export function ExistingCustomerEditAction(fields: BookingCustomerEditFields) {
  const { customer, edit, isFetching, visible } = useBookingCustomerEdit(fields);
  if (!visible || !customer) return null;
  return (
    <CardAction>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Edit existing ${fields.label.toLowerCase()} customer`}
        title={`Edit existing ${fields.label.toLowerCase()} customer`}
        onClick={edit.openDialog}
        disabled={isFetching}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <ExistingCustomerEditDialog
        open={edit.open}
        onOpenChange={edit.setOpen}
        customerLabel={fields.label}
        fullname={edit.values.fullname}
        primaryTelephone={customer.telephone ?? ''}
        secondaryTelephone={edit.values.telephone2}
        isSaving={edit.isSaving}
        onFullnameChange={edit.updateFullname}
        onSecondaryTelephoneChange={edit.updateTelephone2}
        onSave={edit.save}
      />
    </CardAction>
  );
}
