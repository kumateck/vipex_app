import { CUSTOMER_TYPE_OPTIONS } from '@/shared/customers/customer-types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PHONE_DIGITS, limitPhoneDigits } from '@/lib/phone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerType } from '@/features/customers/api';

import { useCustomerUpsertForm, type CustomerUpsertFormProps } from '../../hooks';

export function CustomerUpsertForm(props: CustomerUpsertFormProps) {
  const { mode } = props;
  const { form, setForm, submit, isBusy, navigate } = useCustomerUpsertForm(props);
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
                  setForm((prev) => ({ ...prev, telephone: limitPhoneDigits(event.target.value) }))
                }
                inputMode="numeric"
                maxLength={PHONE_DIGITS}
                placeholder="0240000000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telephone 2</Label>
              <Input
                value={form.telephone2}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, telephone2: limitPhoneDigits(event.target.value) }))
                }
                inputMode="numeric"
                maxLength={PHONE_DIGITS}
                placeholder="0240000001"
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
                  {CUSTOMER_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
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
