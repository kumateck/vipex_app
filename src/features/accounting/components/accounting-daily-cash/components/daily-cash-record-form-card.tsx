import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { QuickAmountInput, formatMoney } from '../../accounting-shared';
import type { AccountingDailyCashViewData } from '../types/accounting-daily-cash-view-data';
import { toDateInputValue } from '../utils/date-utils';

export function DailyCashRecordFormCard({
  branchId,
  branchOptions,
  canRecordConfirmation,
  cashierOptions,
  cashierUserId,
  confirmationDate,
  countedAirtelCedis,
  countedCashCedis,
  countedMtnCedis,
  countedTelecelCedis,
  expectedAirtelCedis,
  expectedCashInputValue,
  expectedMtnCedis,
  expectedScopeKey,
  expectedSummary,
  expectedTelecelCedis,
  isFetchingExpected,
  isHeadOffice,
  locationId,
  locationOptionsWithFallback,
  notes,
  setBranchId,
  setCashierUserId,
  setConfirmationDate,
  setCountedAirtelCedis,
  setCountedCashCedis,
  setCountedMtnCedis,
  setCountedTelecelCedis,
  setExpectedCashCedis,
  setExpectedCashOverrideScope,
  setLocationId,
  setNotes,
  user,
  handleCreate,
  applyExpectedCashFromOperations,
}: Pick<
  AccountingDailyCashViewData,
  | 'branchId'
  | 'branchOptions'
  | 'canRecordConfirmation'
  | 'cashierOptions'
  | 'cashierUserId'
  | 'confirmationDate'
  | 'countedAirtelCedis'
  | 'countedCashCedis'
  | 'countedMtnCedis'
  | 'countedTelecelCedis'
  | 'expectedAirtelCedis'
  | 'expectedCashInputValue'
  | 'expectedMtnCedis'
  | 'expectedScopeKey'
  | 'expectedSummary'
  | 'expectedTelecelCedis'
  | 'isFetchingExpected'
  | 'isHeadOffice'
  | 'locationId'
  | 'locationOptionsWithFallback'
  | 'notes'
  | 'setBranchId'
  | 'setCashierUserId'
  | 'setConfirmationDate'
  | 'setCountedAirtelCedis'
  | 'setCountedCashCedis'
  | 'setCountedMtnCedis'
  | 'setCountedTelecelCedis'
  | 'setExpectedCashCedis'
  | 'setExpectedCashOverrideScope'
  | 'setLocationId'
  | 'setNotes'
  | 'user'
  | 'handleCreate'
  | 'applyExpectedCashFromOperations'
>) {
  const confirmationDateValue = confirmationDate
    ? new Date(`${confirmationDate}T00:00:00`)
    : undefined;
  const isConfirmationDateValid = Boolean(
    confirmationDateValue && !Number.isNaN(confirmationDateValue.getTime()),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Daily Confirmation</CardTitle>
        <CardDescription>
          Use this when the branch accountant physically counts cash at a location or cashier point.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="daily-cash-branch">Branch</Label>
            {isHeadOffice ? (
              <Select
                value={branchId}
                onValueChange={(value) => {
                  setBranchId(value);
                  setLocationId('');
                  setCashierUserId('');
                }}
              >
                <SelectTrigger id="daily-cash-branch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={user.branch?.name ?? 'My branch'} disabled />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-cash-location">Location</Label>
            <Select
              value={locationId || 'all'}
              onValueChange={(value) => {
                setLocationId(value === 'all' ? '' : value);
                setCashierUserId('');
              }}
            >
              <SelectTrigger id="daily-cash-location">
                <SelectValue placeholder="All branch locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Branch Level</SelectItem>
                {locationOptionsWithFallback.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-cash-cashier">Cashier / Officer</Label>
            <Select
              value={cashierUserId || 'all'}
              onValueChange={(value) => setCashierUserId(value === 'all' ? '' : value)}
            >
              <SelectTrigger id="daily-cash-cashier">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Branch Rollup</SelectItem>
                {cashierOptions.map((cashier) => (
                  <SelectItem key={cashier.id} value={cashier.id}>
                    {cashier.fullname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-cash-date">Confirmation Date</Label>
            <DatePicker
              date={isConfirmationDateValid ? confirmationDateValue : undefined}
              onDateChange={(value) => setConfirmationDate(toDateInputValue(value))}
              placeholder="Select date"
            />
          </div>

          <QuickAmountInput
            id="daily-cash-expected"
            label="Expected Cash (GHS)"
            value={expectedCashInputValue}
            onChange={(value) => {
              setExpectedCashOverrideScope(expectedScopeKey);
              setExpectedCashCedis(value);
            }}
          />
          <QuickAmountInput
            id="daily-cash-counted"
            label="Counted Cash (GHS)"
            value={countedCashCedis}
            onChange={setCountedCashCedis}
          />
          <QuickAmountInput
            id="daily-cash-counted-mtn"
            label={`Counted MTN (GHS) • Expected ${expectedMtnCedis}`}
            value={countedMtnCedis}
            onChange={setCountedMtnCedis}
            onBlur={() => {
              if (countedMtnCedis.trim() === '') setCountedMtnCedis('0.00');
            }}
          />
          <QuickAmountInput
            id="daily-cash-counted-telecel"
            label={`Counted Telecel (GHS) • Expected ${expectedTelecelCedis}`}
            value={countedTelecelCedis}
            onChange={setCountedTelecelCedis}
            onBlur={() => {
              if (countedTelecelCedis.trim() === '') setCountedTelecelCedis('0.00');
            }}
          />
          <QuickAmountInput
            id="daily-cash-counted-airtel"
            label={`Counted Airtel (GHS) • Expected ${expectedAirtelCedis}`}
            value={countedAirtelCedis}
            onChange={setCountedAirtelCedis}
            onBlur={() => {
              if (countedAirtelCedis.trim() === '') setCountedAirtelCedis('0.00');
            }}
          />
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="daily-cash-notes">Notes</Label>
            <Input
              id="daily-cash-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes about count, shortage, or overage"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-3 text-sm">
          <div className="flex-1 text-muted-foreground">
            Use recorded cash collections for this branch, location, cashier, and date to prefill
            the expected physical cash.
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={applyExpectedCashFromOperations}
            disabled={isFetchingExpected}
          >
            Use Expected Cash
          </Button>
          {expectedSummary?.session?.closingBalancePsw != null ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setCountedCashCedis(
                  ((expectedSummary.session?.closingBalancePsw ?? 0) / 100).toFixed(2),
                )
              }
            >
              Use Session Closing
            </Button>
          ) : null}
          {expectedSummary?.session?.expectedClosingBalancePsw != null ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setCountedCashCedis(
                  ((expectedSummary.session?.expectedClosingBalancePsw ?? 0) / 100).toFixed(2),
                )
              }
            >
              Use Expected Closing
            </Button>
          ) : null}
          <div className="text-xs text-muted-foreground">
            Sender {formatMoney(expectedSummary?.senderSalesPsw ?? 0)} • Receiver{' '}
            {formatMoney(expectedSummary?.receiverSalesPsw ?? 0)} • Delivery{' '}
            {formatMoney(expectedSummary?.deliverySalesPsw ?? 0)}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Record Confirmation is enabled only when selected cashier session status is COMPLETED.
        </p>

        <div className="flex justify-end">
          <Button onClick={() => void handleCreate()} disabled={!canRecordConfirmation}>
            Record Confirmation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
