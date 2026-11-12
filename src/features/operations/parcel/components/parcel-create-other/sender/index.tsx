import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useNonIndividualSender } from '../../../hooks/use-non-individual-sender';

export function NonIndividualSenderField() {
  const sender = useNonIndividualSender();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="other-booking-sender-phone">Sender telephone</FieldLabel>
        <Input
          {...sender.field}
          id="other-booking-sender-phone"
          value={sender.phone}
          onChange={(event) => sender.changeTelephone(event.target.value)}
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          placeholder="0240000000"
        />
        <FieldDescription>
          Enter the 10-digit number on the sender’s customer profile.
        </FieldDescription>
        {sender.isSearching ? (
          <p role="status" className="text-sm">
            Searching customer records…
          </p>
        ) : null}
        {sender.lookupFailed ? (
          <div className="flex items-center gap-2">
            <p role="alert" className="text-sm text-destructive">
              Could not search for the sender.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void sender.retryLookup()}
            >
              Retry
            </Button>
          </div>
        ) : null}
        {!sender.isSearching && !sender.lookupFailed && sender.matches?.length === 0 ? (
          <p role="status" className="text-sm text-muted-foreground">
            No eligible sender found. Check the number or set up the sender in Customer Management.
          </p>
        ) : null}
      </Field>

      {sender.matches?.length ? (
        <Field>
          <FieldLabel htmlFor="other-booking-sender">Matching sender</FieldLabel>
          <Select value={sender.selectedId} onValueChange={sender.selectSender}>
            <SelectTrigger id="other-booking-sender">
              <SelectValue placeholder="Select sender" />
            </SelectTrigger>
            <SelectContent>
              {sender.matches.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {sender.matchLabel(customer)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
    </div>
  );
}
