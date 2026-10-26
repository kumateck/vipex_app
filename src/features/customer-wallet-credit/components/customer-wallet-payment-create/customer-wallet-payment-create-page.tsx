import { CustomerDebtSettlement } from '@/features/customers/credit-settlement';
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
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useWalletPaymentCustomer } from '../../hooks';

export function CustomerWalletPaymentCreatePage() {
  const { customerId, setCustomerId, customerSearch, setCustomerSearch, customers, cancel } =
    useWalletPaymentCustomer();
  return (
    <ScrollableWrapper>
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
            </FieldGroup>

            {customerId !== '__none__' ? (
              <CustomerDebtSettlement key={customerId} customerId={customerId} channel="finance" />
            ) : null}
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
