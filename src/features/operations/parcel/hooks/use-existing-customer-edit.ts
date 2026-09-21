import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useUpdateCustomerMutation, type Customer } from '@/features/customers/api';
import { limitPhoneDigits } from '@/lib/phone';
import {
  validateExistingCustomerEdit,
  type ExistingCustomerEditValues,
} from '../utils/existing-customer-edit';

type UseExistingCustomerEditOptions = {
  customer?: Customer;
  onUpdated: (values: ExistingCustomerEditValues) => void;
};

const EMPTY_VALUES: ExistingCustomerEditValues = {
  fullname: '',
  telephone2: '',
};

export function useExistingCustomerEdit({ customer, onUpdated }: UseExistingCustomerEditOptions) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_VALUES);
  const [updateCustomer, { isLoading }] = useUpdateCustomerMutation();

  const openDialog = useCallback(() => {
    if (!customer) return;
    setValues({
      fullname: customer.fullname,
      telephone2: customer.telephone2 ?? '',
    });
    setOpen(true);
  }, [customer]);

  const updateFullname = useCallback((fullname: string) => {
    setValues((current) => ({ ...current, fullname }));
  }, []);

  const updateTelephone2 = useCallback((telephone2: string) => {
    setValues((current) => ({ ...current, telephone2: limitPhoneDigits(telephone2) }));
  }, []);

  const save = useCallback(async () => {
    if (!customer) return;

    const validationError = validateExistingCustomerEdit(values, customer.telephone ?? '');
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const nextValues = {
      fullname: values.fullname.trim(),
      telephone2: values.telephone2.trim(),
    };

    try {
      await updateCustomer({
        id: customer.id,
        fullname: nextValues.fullname,
        telephone2: nextValues.telephone2 || null,
      }).unwrap();
      onUpdated(nextValues);
      setOpen(false);
      toast.success('Customer information updated');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to update customer');
    }
  }, [customer, onUpdated, updateCustomer, values]);

  return {
    open,
    setOpen,
    values,
    isSaving: isLoading,
    openDialog,
    updateFullname,
    updateTelephone2,
    save,
  };
}
