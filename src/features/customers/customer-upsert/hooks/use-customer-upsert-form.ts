import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PHONE_DIGITS, isOptionalTenDigitPhone, normalizePhoneDigits } from '@/lib/phone';
import {
  CustomerType,
  type Customer,
  useCreateCustomerCrmMutation,
  useUpdateCustomerCrmMutation,
} from '@/features/customers/api';
type Mode = 'create' | 'edit';

type FormState = {
  fullname: string;
  telephone: string;
  telephone2: string;
  address: string;
  email: string;
  customerType: CustomerType;
  creditEligible: boolean;
  creditLimitCedis: string;
  paymentTermsDays: string;
};

const EMPTY_FORM: FormState = {
  fullname: '',
  telephone: '',
  telephone2: '',
  address: '',
  email: '',
  customerType: CustomerType.Individual,
  creditEligible: false,
  creditLimitCedis: '0',
  paymentTermsDays: '0',
};

function toNumber(value: string, fallback = 0) {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return n;
}

export interface CustomerUpsertFormProps {
  mode: Mode;
  customerId?: string;
  initialData?: Customer | null;
}

export function useCustomerUpsertForm({ mode, customerId, initialData }: CustomerUpsertFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerCrmMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerCrmMutation();

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setForm({
        fullname: initialData.fullname ?? '',
        telephone: initialData.telephone ?? '',
        telephone2: initialData.telephone2 ?? '',
        address: initialData.address ?? '',
        email: initialData.email ?? '',
        customerType: initialData.customerType,
        creditEligible: initialData.creditEligible,
        creditLimitCedis: String((initialData.creditLimitPsw ?? 0) / 100),
        paymentTermsDays: String(initialData.paymentTermsDays ?? 0),
      });
      return;
    }
    setForm(EMPTY_FORM);
  }, [initialData, mode]);

  const isBusy = isCreating || isUpdating;

  const submit = async () => {
    if (!form.fullname.trim()) {
      toast.error('Customer name is required');
      return;
    }

    const primaryPhone = normalizePhoneDigits(form.telephone);
    const secondaryPhone = normalizePhoneDigits(form.telephone2);

    if (!isOptionalTenDigitPhone(form.telephone)) {
      toast.error(`Telephone must be exactly ${PHONE_DIGITS} digits`);
      return;
    }

    if (!isOptionalTenDigitPhone(form.telephone2)) {
      toast.error(`Telephone 2 must be exactly ${PHONE_DIGITS} digits`);
      return;
    }

    if (primaryPhone && secondaryPhone && primaryPhone === secondaryPhone) {
      toast.error('Primary and secondary telephone cannot be the same');
      return;
    }

    const payload = {
      fullname: form.fullname.trim(),
      telephone: primaryPhone || null,
      telephone2: secondaryPhone || null,
      address: form.address.trim() || null,
      email: form.email.trim() || null,
      customerType: form.customerType,
      creditEligible: form.creditEligible,
      creditLimitPsw: Math.max(Math.round(toNumber(form.creditLimitCedis) * 100), 0),
      paymentTermsDays: Math.max(Math.trunc(toNumber(form.paymentTermsDays)), 0),
    };

    try {
      if (mode === 'edit') {
        if (!customerId) {
          toast.error('Missing customer id');
          return;
        }
        await updateCustomer({ id: customerId, ...payload }).unwrap();
        toast.success('Customer updated');
        navigate(`/customers/${customerId}`);
        return;
      }

      const created = await createCustomer(payload).unwrap();
      toast.success('Customer created');
      navigate(`/customers/${created.id}`);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save customer');
    }
  };

  return { form, setForm, submit, isBusy, navigate };
}
