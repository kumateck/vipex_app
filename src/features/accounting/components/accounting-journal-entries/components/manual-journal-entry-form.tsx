import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '../../accounting-shared';
import { useManualJournalEntryForm } from '../hooks/use-manual-journal-entry-form';

export function ManualJournalEntryForm(props: {
  canApprove: boolean;
  canCreate: boolean;
  user: Parameters<typeof useManualJournalEntryForm>[0]['user'];
}) {
  const form = useManualJournalEntryForm({
    user: props.user,
    canCreate: props.canCreate,
    canApprove: props.canApprove,
  });

  return (
    <ScrollableWrapper>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manual Journal Entries</CardTitle>
            <CardDescription>
              Entries below threshold auto-authorize. Entries above threshold require an approver.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={form.branchId || undefined} onValueChange={form.setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={form.locationId || undefined} onValueChange={form.setLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entry Date</Label>
                <DatePicker
                  date={form.entryDate ? new Date(`${form.entryDate}T00:00:00`) : undefined}
                  onDateChange={(date) => form.setEntryDate(date ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="Select entry date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Memo</Label>
              <Textarea
                value={form.memo}
                onChange={(event) => form.setMemo(event.target.value)}
                placeholder="Manual correction for branch settlement..."
              />
            </div>

            <div className="space-y-3">
              {form.lines.map((line, index) => (
                <div key={index} className="grid gap-3 rounded-md border p-3 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <Label className="mb-2 block">Account</Label>
                    <Select
                      value={line.accountId || undefined}
                      onValueChange={(value) => form.updateLine(index, { accountId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {form.postableAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Type</Label>
                    <Select
                      value={line.entryType}
                      onValueChange={(value) =>
                        form.updateLine(index, { entryType: value as 'debit' | 'credit' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debit">Debit</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Amount (GH₵)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.amountCedis}
                      onChange={(event) =>
                        form.updateLine(index, { amountCedis: event.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label className="mb-2 block">Description</Label>
                    <Input
                      value={line.description}
                      onChange={(event) =>
                        form.updateLine(index, { description: event.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => form.removeLine(index)}
                      disabled={form.lines.length <= 2}
                    >
                      -
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={form.addLine}>
                Add Line
              </Button>
              <span className="text-sm text-muted-foreground">
                Debit: {formatMoney(form.totals.debitPsw)} | Credit:{' '}
                {formatMoney(form.totals.creditPsw)} |{' '}
                {form.totals.balanced ? 'Balanced' : 'Unbalanced'}
              </span>
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>
                Threshold:{' '}
                {form.policy ? formatMoney(form.policy.amountLimitPsw) : 'Not configured'}{' '}
                {form.policy?.configured
                  ? `(${form.policy.policyCode})`
                  : '(no manual entry policy configured)'}
              </p>
              <p className="text-muted-foreground">
                Auto authorize below threshold:{' '}
                <strong>
                  {form.policy?.autoAuthorizeBelowThreshold ? 'Enabled' : 'Disabled (queue all)'}
                </strong>
              </p>
              <p className="text-muted-foreground">
                Above threshold always goes for approval:{' '}
                <strong>
                  {props.canApprove ? 'You can approve from queue' : 'Approver required'}
                </strong>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => void form.handleSubmit()}
                disabled={form.isLoading || !form.totals.balanced}
              >
                {form.isLoading ? 'Posting...' : 'Post Entry'}
              </Button>
              <Button variant="outline" onClick={form.resetForm} disabled={form.isLoading}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
