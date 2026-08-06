import { CashierType } from '@/db/schemas/enums';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { CashierSalesOption } from './daily-cashier-sales-types';
import { parseDateInputValue, toDateInputValue } from './daily-cashier-sales-utils';

type Option = {
  id: string;
  name: string;
};

type DailyCashierSalesFiltersProps = {
  date: string;
  setDate: (value: string) => void;
  branchId: string;
  setBranchId: (value: string) => void;
  locationId: string;
  setLocationId: (value: string) => void;
  cashierType: string;
  setCashierType: (value: string) => void;
  cashierUserId: string;
  setCashierUserId: (value: string) => void;
  canSelectCashier: boolean;
  isHeadOffice: boolean;
  effectiveBranchId: string | null;
  branchName: string;
  locationName: string;
  userFullname: string;
  branchOptions: Option[];
  locationOptions: Option[];
  cashierOptions: CashierSalesOption[];
  isCashierOptionsFetching: boolean;
};

export function DailyCashierSalesFilters({
  date,
  setDate,
  branchId,
  setBranchId,
  locationId,
  setLocationId,
  cashierType,
  setCashierType,
  cashierUserId,
  setCashierUserId,
  canSelectCashier,
  isHeadOffice,
  effectiveBranchId,
  branchName,
  locationName,
  userFullname,
  branchOptions,
  locationOptions,
  cashierOptions,
  isCashierOptionsFetching,
}: DailyCashierSalesFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Head office can select a branch or view consolidated results. Branch users are locked to
          their branch.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-5">
        <div className="space-y-2">
          <Label>Session Open Date</Label>
          <DatePicker
            date={parseDateInputValue(date)}
            onDateChange={(value) => setDate(toDateInputValue(value))}
            placeholder="Select date"
          />
        </div>
        <div className="space-y-2">
          <Label>Branch</Label>
          {isHeadOffice ? (
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All branches (consolidated)</SelectItem>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={branchName} disabled />
          )}
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          {canSelectCashier ? (
            <Select value={locationId} onValueChange={setLocationId} disabled={!effectiveBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All locations</SelectItem>
                {locationOptions.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={locationName} disabled />
          )}
        </div>
        <div className="space-y-2">
          <Label>Cashier Type</Label>
          {canSelectCashier ? (
            <Select value={cashierType} onValueChange={setCashierType}>
              <SelectTrigger>
                <SelectValue placeholder="All cashier types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All cashier types</SelectItem>
                <SelectItem value={String(CashierType.SENDING)}>Sender cashier</SelectItem>
                <SelectItem value={String(CashierType.TOBEPAID)}>Receiver cashier</SelectItem>
                <SelectItem value={String(CashierType.DELIVERY)}>Delivery cashier</SelectItem>
                <SelectItem value={String(CashierType.FULL)}>Full cashier</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input value={getCashierTypeLabel(cashierType)} disabled />
          )}
        </div>
        {canSelectCashier ? (
          <CashierSelect
            cashierUserId={cashierUserId}
            setCashierUserId={setCashierUserId}
            cashierOptions={cashierOptions}
            isFetching={isCashierOptionsFetching}
          />
        ) : (
          <div className="space-y-2">
            <Label>Cashier</Label>
            <Input value={userFullname} disabled />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getCashierTypeLabel(value: string) {
  switch (value) {
    case String(CashierType.SENDING):
      return 'Sender cashier';
    case String(CashierType.TOBEPAID):
      return 'Receiver cashier';
    case String(CashierType.DELIVERY):
      return 'Delivery cashier';
    case String(CashierType.FULL):
      return 'Full cashier';
    default:
      return 'Cashier';
  }
}

function CashierSelect({
  cashierUserId,
  setCashierUserId,
  cashierOptions,
  isFetching,
}: {
  cashierUserId: string;
  setCashierUserId: (value: string) => void;
  cashierOptions: CashierSalesOption[];
  isFetching: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>Cashier</Label>
      <Select value={cashierUserId} onValueChange={setCashierUserId}>
        <SelectTrigger>
          <div className="flex min-w-0 items-center gap-2">
            {isFetching ? <Spinner className="size-3.5" /> : null}
            <SelectValue placeholder="All cashiers" />
          </div>
        </SelectTrigger>
        <SelectContent isLoading={isFetching} loadingText="Loading cashiers...">
          <SelectItem value="__all__">All cashiers</SelectItem>
          {!isFetching && cashierOptions.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              No cashiers found
            </SelectItem>
          ) : null}
          {cashierOptions.map((cashier) => (
            <SelectItem key={cashier.id} value={cashier.id}>
              {cashier.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
