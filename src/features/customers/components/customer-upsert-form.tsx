import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface CustomerUpsertFormProps {
  mode: Mode;
  customerId?: string;
  initialData?: Customer | null;
}

export function CustomerUpsertForm({ mode, customerId, initialData }: CustomerUpsertFormProps) {
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
    const payload = {
      fullname: form.fullname.trim(),
      telephone: form.telephone.trim() || null,
      telephone2: form.telephone2.trim() || null,
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
      toast.error(error instanceof Error ? error.message : 'Failed to save customer');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create Customer' : 'Edit Customer'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Fullname / Business name</Label>
            <Input
              value={form.fullname}
              onChange={(event) => setForm((prev) => ({ ...prev, fullname: event.target.value }))}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Telephone</Label>
              <Input
                value={form.telephone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, telephone: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telephone 2</Label>
              <Input
                value={form.telephone2}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, telephone2: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Customer Type</Label>
              <Select
                value={String(form.customerType)}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    customerType: Number(value) as CustomerType,
                    creditEligible:
                      Number(value) === CustomerType.Business ? prev.creditEligible : false,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(CustomerType.Individual)}>Individual</SelectItem>
                  <SelectItem value={String(CustomerType.Business)}>Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Credit Eligible</Label>
              <Select
                value={form.creditEligible ? 'yes' : 'no'}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, creditEligible: value === 'yes' }))
                }
                disabled={form.customerType !== CustomerType.Business}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select eligibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Credit Limit (GHS)</Label>
              <Input
                value={form.creditLimitCedis}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, creditLimitCedis: event.target.value }))
                }
                inputMode="decimal"
                disabled={!form.creditEligible}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Terms (days)</Label>
              <Input
                value={form.paymentTermsDays}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, paymentTermsDays: event.target.value }))
                }
                inputMode="numeric"
                disabled={!form.creditEligible}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={() => void submit()} disabled={isBusy}>
              {mode === 'create' ? 'Create Customer' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/customers')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
