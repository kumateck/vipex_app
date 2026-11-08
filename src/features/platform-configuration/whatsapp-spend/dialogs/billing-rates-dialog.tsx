import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PriceHistoryList } from '../components/whatsapp-spend-page/price-history-list';
import { useBillingRatesForm, useDeleteBillingRate } from '../hooks';
import type { WhatsAppPrices } from '../types';
import { DeletePriceDialog } from './delete-price-dialog';

const RATE_FIELDS = [
  { key: 'authentication', label: 'Pickup code (authentication)' },
  { key: 'utility', label: 'Receipt (utility)' },
  { key: 'marketing', label: 'Marketing (not used today)' },
] as const;

export function BillingRatesDialog({
  prices,
  onClose,
}: {
  prices: WhatsAppPrices;
  onClose: () => void;
}) {
  const form = useBillingRatesForm(prices, onClose);
  const deletion = useDeleteBillingRate();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Client billing prices</DialogTitle>
          <DialogDescription>
            Each message is billed at the price in force on the day it was sent. Add a new price
            with a start date to change it; earlier periods keep their old price.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Price history</h3>
          <PriceHistoryList
            history={prices.history}
            currency={prices.currency}
            onDelete={deletion.request}
            disabled={deletion.isDeleting}
          />
        </section>

        <section className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium">New price</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Starts from</Label>
              <DatePicker date={form.startDate} onDateChange={form.setStartDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spend-currency">Currency</Label>
              <Input
                id="spend-currency"
                maxLength={3}
                placeholder="USD"
                value={form.values.currency}
                disabled={form.isCurrencyLocked}
                onChange={(event) => form.setField('currency', event.target.value)}
              />
            </div>
            {RATE_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`spend-rate-${field.key}`}>{field.label}</Label>
                <Input
                  id={`spend-rate-${field.key}`}
                  type="number"
                  min={0}
                  step="0.0001"
                  value={form.values[field.key]}
                  onChange={(event) => form.setField(field.key, event.target.value)}
                />
              </div>
            ))}
          </div>
          {form.replaces ? (
            <p className="text-sm text-amber-600">
              This replaces the price that starts on {form.replaces.effectiveFrom}.
            </p>
          ) : null}
          {form.isBackdated ? (
            <p className="text-sm text-amber-600">
              The start date is in the past: reports from that day onward will use this price.
            </p>
          ) : null}
        </section>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={form.isSaving}>
            Close
          </Button>
          <Button onClick={form.submit} disabled={form.isSaving || !form.isValid}>
            {form.isSaving ? 'Saving...' : 'Save price'}
          </Button>
        </DialogFooter>
      </DialogContent>
      <DeletePriceDialog
        period={deletion.pending}
        onCancel={deletion.cancel}
        onConfirm={deletion.confirm}
      />
    </Dialog>
  );
}
