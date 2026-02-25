import { useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFindCustomersByTelephoneQuery } from '@/features/customers/api';
import { useDebouncedValue } from '../hooks/use-debounced-value';

type CustomerPhoneLookupFieldProps = {
  label: string;
  phone: string;
  selectedCustomerId: string;
  fallbackName: string;
  onPhoneChange: (value: string) => void;
  onSelectedCustomerIdChange: (value: string) => void;
  onFallbackNameChange: (value: string) => void;
};

export function CustomerPhoneLookupField({
  label,
  phone,
  selectedCustomerId,
  fallbackName,
  onPhoneChange,
  onSelectedCustomerIdChange,
  onFallbackNameChange,
}: CustomerPhoneLookupFieldProps) {
  const debouncedPhone = useDebouncedValue(phone, 3000);
  const canLookup = debouncedPhone.trim().length >= 10;

  const { data: customers = [], isFetching } = useFindCustomersByTelephoneQuery(
    { telephone: debouncedPhone, limit: 10 },
    { skip: !canLookup },
  );

  useEffect(() => {
    if (!customers.length && selectedCustomerId) {
      onSelectedCustomerIdChange('');
      return;
    }

    const selectedExists = customers.some((customer) => customer.id === selectedCustomerId);
    if (!selectedExists && customers.length) {
      onSelectedCustomerIdChange(customers[0]?.id ?? '');
    }
  }, [customers, onSelectedCustomerIdChange, selectedCustomerId]);

  const shouldShowFallbackName = useMemo(
    () => canLookup && !isFetching && customers.length === 0,
    [canLookup, customers.length, isFetching],
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{label} Telephone</Label>
        <Input
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          placeholder="0240000000"
          inputMode="numeric"
        />
        <p className="text-xs text-muted-foreground">Lookup starts after 3 seconds when 10+ digits are entered.</p>
      </div>

      {canLookup && isFetching ? <p className="text-xs text-muted-foreground">Searching customer records...</p> : null}

      {customers.length ? (
        <div className="space-y-2">
          <Label>{label} Customer</Label>
          <Select value={selectedCustomerId} onValueChange={onSelectedCustomerIdChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label.toLowerCase()} customer`} />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.fullname} {customer.telephone ? `(${customer.telephone})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {shouldShowFallbackName ? (
        <div className="space-y-2">
          <Label>{label} Fullname</Label>
          <Input
            value={fallbackName}
            onChange={(event) => onFallbackNameChange(event.target.value)}
            placeholder={`Enter ${label.toLowerCase()} fullname`}
          />
          <p className="text-xs text-muted-foreground">No existing customer found. A new customer will be created on submit.</p>
        </div>
      ) : null}
    </div>
  );
}
