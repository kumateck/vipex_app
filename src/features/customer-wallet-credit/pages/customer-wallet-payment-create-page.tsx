import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateCustomerWalletPaymentMutation,
  useListCustomerWalletAccountsQuery,
} from '../api/customer-wallet-credit.api';

export function CustomerWalletPaymentCreatePage() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('__none__');
  const [customerSearch, setCustomerSearch] = useState('');
  const [amountCedis, setAmountCedis] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');

  const customerQuery = useMemo(
    () => ({ page: 1, pageSize: 100, search: customerSearch.trim() || undefined }),
    [customerSearch],
  );

  const { data: customerData } = useListCustomerWalletAccountsQuery(customerQuery);
  const customers = customerData?.data ?? [];
  const [createPayment, { isLoading }] = useCreateCustomerWalletPaymentMutation();

  const onSubmit = async () => {
    if (customerId === '__none__') {
      toast.error('Select a customer');
      return;
    }

    const parsedAmount = Number(amountCedis);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      await createPayment({
        customerId,
        amountCedis: parsedAmount,
        referenceId: referenceId.trim() || null,
        notes: notes.trim() || null,
      }).unwrap();
      toast.success('Payment posted');
      navigate('/customer-wallet-credit/accounts');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post payment');
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Record Wallet/Credit Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel>Find customer</FieldLabel>
              <Input
                placeholder="Search by name, phone, email"
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>Customer</FieldLabel>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.customerId} value={customer.customerId}>
                      {customer.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Amount (Cedis)</FieldLabel>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amountCedis}
                onChange={(event) => setAmountCedis(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Reference</FieldLabel>
              <Input value={referenceId} onChange={(event) => setReferenceId(event.target.value)} />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>Notes</FieldLabel>
              <Textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
          </FieldGroup>

          <div className="flex gap-2">
            <Button onClick={onSubmit} disabled={isLoading}>
              Save payment
            </Button>
            <Button variant="outline" onClick={() => navigate('/customer-wallet-credit/accounts')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
