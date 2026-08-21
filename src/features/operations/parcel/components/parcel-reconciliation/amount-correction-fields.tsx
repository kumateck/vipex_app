import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { ParcelCorrectionSession, ParcelSearchRow } from '../../api/parcel.api';
import { formatMoneyPsw, formatReconciliationDate } from './utils';

type AmountCorrectionFieldsProps = {
  selectedParcel: ParcelSearchRow | null;
  sessions: ParcelCorrectionSession[];
  selectedSessionId: string;
  onSelectedSessionIdChange: (value: string) => void;
  correctedChargeCedis: string;
  onCorrectedChargeCedisChange: (value: string) => void;
  correctedPlannedToBePaidCedis: string;
  onCorrectedPlannedToBePaidCedisChange: (value: string) => void;
  isLoadingSessions: boolean;
};

export function AmountCorrectionFields({
  selectedParcel,
  sessions,
  selectedSessionId,
  onSelectedSessionIdChange,
  correctedChargeCedis,
  onCorrectedChargeCedisChange,
  correctedPlannedToBePaidCedis,
  onCorrectedPlannedToBePaidCedisChange,
  isLoadingSessions,
}: AmountCorrectionFieldsProps) {
  return (
    <div className="space-y-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
      <div>
        <p className="text-sm font-medium">Original shift correction</p>
        <p className="text-xs text-muted-foreground">
          The approved correction will affect the parcel&apos;s original sales shift, while the
          request and execution dates remain in the audit trail.
        </p>
      </div>

      {selectedParcel ? (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            Current charge: <strong>{formatMoneyPsw(selectedParcel.chargePsw)}</strong>
          </p>
          <p>
            Current receiver to-be-paid:{' '}
            <strong>{formatMoneyPsw(selectedParcel.plannedToBePaidPsw)}</strong>
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="create-case-cashier-session">Original Cashier Session</Label>
        <Select value={selectedSessionId} onValueChange={onSelectedSessionIdChange}>
          <SelectTrigger id="create-case-cashier-session">
            <SelectValue
              placeholder={isLoadingSessions ? 'Loading matching sessions...' : 'Select session'}
            />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.cashierName ?? 'Cashier'} ·{' '}
                {formatReconciliationDate(session.actualStartTime ?? session.scheduledStartTime)} ·{' '}
                {session.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isLoadingSessions && selectedParcel && sessions.length === 0 ? (
          <p className="text-xs text-destructive">
            No matching session was found for this parcel&apos;s cashier, branch, and creation time.
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="create-case-corrected-charge">Correct Total Charge (GHS)</Label>
          <Input
            id="create-case-corrected-charge"
            inputMode="decimal"
            value={correctedChargeCedis}
            onChange={(event) => onCorrectedChargeCedisChange(event.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-case-corrected-to-be-paid">
            Correct Receiver To-Be-Paid (GHS)
          </Label>
          <Input
            id="create-case-corrected-to-be-paid"
            inputMode="decimal"
            value={correctedPlannedToBePaidCedis}
            onChange={(event) => onCorrectedPlannedToBePaidCedisChange(event.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
}
