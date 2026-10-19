import { useRef, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { updateCustomer } from '@mobile/lib/api';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { UseCustomerLookupResult } from '../use-customer-lookup';

export function useBookingCustomerNameEdit(lookup: UseCustomerLookupResult) {
  const { session, withAuth } = useAuth();
  const canEdit = (session.user?.permissions ?? []).includes('CanUpdateCustomers');
  const [open, setOpen] = useState(false);
  const [fullname, setFullname] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const selected = lookup.matches.find((row) => row.id === lookup.customerId);
  const begin = () => {
    if (canEdit && selected) {
      setFullname(selected.fullname);
      setOpen(true);
    }
  };
  const save = async () => {
    if (!canEdit || !selected || pending.current) return;
    const name = fullname.trim();
    if (!name || name.length > 255)
      return notifyError('Enter a name between 1 and 255 characters.', 'Check customer name');
    pending.current = true;
    setSaving(true);
    try {
      await withAuth((token) => updateCustomer(token, { id: selected.id, fullname: name }));
      lookup.applyUpdatedCustomer({ id: selected.id, fullname: name });
      setOpen(false);
      notifySuccess('The selected customer name has been saved.', 'Customer updated');
    } catch (error) {
      notifyError(getMobileErrorMessage(error, 'Could not update customer name.'), 'Update failed');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };
  return {
    visible: canEdit && Boolean(selected),
    open,
    begin,
    close: () => {
      if (!pending.current) setOpen(false);
    },
    fullname,
    setFullname,
    telephone: selected?.telephone ?? lookup.telephone,
    telephone2: selected?.telephone2,
    saving,
    save,
  };
}
