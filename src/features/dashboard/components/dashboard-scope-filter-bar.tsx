import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { BranchType } from '@/db/schemas/enums';
import { useAuthStore } from '@/stores/auth-store';

const ALL = '__all__';

export type DashboardScope = {
  dateRange: DateRange | undefined;
  branchId: string | null;
  locationId: string | null;
};

export function DashboardScopeFilterBar({ onApply }: { onApply: (scope: DashboardScope) => void }) {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const userBranchId = user?.branch?.id ?? null;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [branchValue, setBranchValue] = useState<string>(ALL);
  const [locationValue, setLocationValue] = useState<string>(ALL);

  const selectedBranchId = isHeadOffice ? (branchValue !== ALL ? branchValue : null) : userBranchId;

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId || !isHeadOffice },
  );

  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    {
      companyId,
      branchId: selectedBranchId,
    },
    { skip: !companyId || !selectedBranchId },
  );

  const agencyBranches = useMemo(
    () => branchOptions.filter((branch) => branch.type !== BranchType.HEADOFFICE),
    [branchOptions],
  );

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className={`grid gap-3 ${isHeadOffice ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <div className="space-y-2">
          <Label>Date Range</Label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {isHeadOffice ? (
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select
              value={branchValue}
              onValueChange={(value) => {
                setBranchValue(value);
                setLocationValue(ALL);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All branches</SelectItem>
                {agencyBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Location</Label>
          <Select value={locationValue} onValueChange={setLocationValue}>
            <SelectTrigger disabled={!selectedBranchId}>
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All locations</SelectItem>
              {locationOptions.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            className="w-full"
            onClick={() =>
              onApply({
                dateRange,
                branchId: selectedBranchId,
                locationId: locationValue !== ALL ? locationValue : null,
              })
            }
          >
            Apply Scope
          </Button>
        </div>
      </div>
    </div>
  );
}
