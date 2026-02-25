import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CashierSessionType } from '../../types/cashier.types';

interface CashierOpenSessionCardProps {
  sessionTypeId: string;
  onSessionTypeChange: (value: string) => void;
  openingBalance: string;
  onOpeningBalanceChange: (value: string) => void;
  sessionTypes: CashierSessionType[];
  loadingSessionTypes: boolean;
  submitting: boolean;
  onSubmit: () => void;
}

export function CashierOpenSessionCard({
  sessionTypeId,
  onSessionTypeChange,
  openingBalance,
  onOpeningBalanceChange,
  sessionTypes,
  loadingSessionTypes,
  submitting,
  onSubmit,
}: CashierOpenSessionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Open cashier session</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel>Session type</FieldLabel>
            <Select value={sessionTypeId} onValueChange={onSessionTypeChange}>
              <SelectTrigger disabled={loadingSessionTypes}>
                <SelectValue placeholder={loadingSessionTypes ? 'Loading...' : 'Select type'} />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((sessionType) => (
                  <SelectItem key={sessionType.id} value={sessionType.id}>
                    {sessionType.sessionType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Opening balance (cedis)</FieldLabel>
            <Input value={openingBalance} onChange={(event) => onOpeningBalanceChange(event.target.value)} placeholder="0.00" />
          </Field>
          <Field className="justify-end">
            <Button onClick={onSubmit} disabled={submitting}>
              Open session
            </Button>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
