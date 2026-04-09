import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { DateRangeFields } from '../../accounting-shared';

export function ReportFiltersCard(props: {
  accountId: string;
  accounts: Array<{ id: string; code: string; name: string }>;
  appliedFilters: unknown;
  branchId: string;
  branchOptions: Array<{ id: string; name: string }>;
  dateFrom: string;
  dateTo: string;
  locationId: string;
  locationOptions: Array<{ id: string; name: string }>;
  reportMode: string;
  setAccountId: (value: string) => void;
  setBranchId: (value: string) => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  setLocationId: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Filters</CardTitle>
        <CardDescription>
          Filter by branch, location, date range, and account where needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!props.appliedFilters ? (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Select filters and click Load report.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="reports-branch">Branch</Label>
            <Select
              value={props.branchId || 'all'}
              onValueChange={(value) => props.setBranchId(value === 'all' ? '' : value)}
            >
              <SelectTrigger id="reports-branch">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {props.branchOptions.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reports-location">Location</Label>
            <Select
              value={props.locationId || 'all'}
              onValueChange={(value) => props.setLocationId(value === 'all' ? '' : value)}
            >
              <SelectTrigger id="reports-location">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {props.locationOptions.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {props.reportMode === 'account-statement' ? (
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="reports-account">Account</Label>
              <Select
                value={props.accountId || 'none'}
                onValueChange={(value) => props.setAccountId(value === 'none' ? '' : value)}
              >
                <SelectTrigger id="reports-account">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No account selected</SelectItem>
                  {props.accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <DateRangeFields
          dateFrom={props.dateFrom}
          dateTo={props.dateTo}
          onDateFromChange={props.setDateFrom}
          onDateToChange={props.setDateTo}
        />
      </CardContent>
    </Card>
  );
}
