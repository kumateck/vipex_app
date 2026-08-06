import { useEffect, useMemo, useState } from 'react';
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
} from '@/components/ui/select-searchable';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { BranchType } from '@/db/schemas/enums';
import { useAuthStore } from '@/stores/auth-store';
import { ANALYTICS_ALL, type AnalyticsResolvedScope, type AnalyticsScopeMeta } from '../types';
import { resolveAnalyticsScope } from '../utils/scope';

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
] as const;

function isoDate(date: Date | undefined): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

function mapDateRangeValue(value: string, customDateRange: DateRange | undefined): string {
  if (value !== 'custom') return value;
  const from = isoDate(customDateRange?.from);
  const to = isoDate(customDateRange?.to ?? customDateRange?.from);
  if (!from) return 'custom';
  if (!to) return from;
  return `${from}:${to}`;
}

function getScopeMeta(user: ReturnType<typeof useAuthStore.getState>['user']): AnalyticsScopeMeta {
  const resolved = resolveAnalyticsScope({
    user,
    selectedBranchId: ANALYTICS_ALL,
    selectedLocationId: ANALYTICS_ALL,
  });
  return resolved.meta;
}

export function AnalyticsFilters({
  onApply,
}: {
  onApply: (scope: AnalyticsResolvedScope) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const scopeMeta = getScopeMeta(user);

  const [dateRangeValue, setDateRangeValue] = useState<string>('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [branchValue, setBranchValue] = useState<string>(ANALYTICS_ALL);
  const [locationValue, setLocationValue] = useState<string>(ANALYTICS_ALL);

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId || scopeMeta.mode !== 'HEAD_OFFICE' },
  );

  const effectiveBranchId =
    scopeMeta.mode === 'HEAD_OFFICE' ? branchValue : (scopeMeta.fixedBranchId ?? ANALYTICS_ALL);

  const locationQueryBranchId =
    effectiveBranchId !== ANALYTICS_ALL ? effectiveBranchId : scopeMeta.fixedBranchId;

  const { currentData: locationOptions = [] } = useListLocationOptionsQuery(
    {
      companyId,
      branchId: locationQueryBranchId,
    },
    {
      skip:
        !companyId ||
        scopeMeta.mode === 'LOCATION' ||
        (!locationQueryBranchId && scopeMeta.mode !== 'HEAD_OFFICE'),
    },
  );

  const agencyBranches = useMemo(
    () => branchOptions.filter((branch) => branch.type !== BranchType.HEADOFFICE),
    [branchOptions],
  );

  const showBranchSelector = scopeMeta.mode === 'HEAD_OFFICE';
  const showLocationSelector = scopeMeta.mode !== 'LOCATION';
  const isCustomRange = dateRangeValue === 'custom';

  useEffect(() => {
    if (!showLocationSelector) return;
    setLocationValue(ANALYTICS_ALL);
  }, [effectiveBranchId, showLocationSelector]);

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className={`grid gap-3 ${showBranchSelector ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Select value={dateRangeValue} onValueChange={setDateRangeValue}>
            <SelectTrigger>
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isCustomRange ? (
          <div className="space-y-2">
            <Label>Custom Dates</Label>
            <DateRangePicker value={customDateRange} onChange={setCustomDateRange} />
          </div>
        ) : null}

        {showBranchSelector ? (
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select
              value={branchValue}
              onValueChange={(value) => {
                setBranchValue(value);
                setLocationValue(ANALYTICS_ALL);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANALYTICS_ALL}>All branches</SelectItem>
                {agencyBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {showLocationSelector ? (
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={locationValue}
              onValueChange={setLocationValue}
              disabled={
                scopeMeta.mode === 'BRANCH' &&
                !scopeMeta.fixedBranchId &&
                effectiveBranchId === ANALYTICS_ALL
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANALYTICS_ALL}>All locations</SelectItem>
                {locationOptions.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="flex items-end">
          <Button
            className="w-full"
            onClick={() => {
              const resolved = resolveAnalyticsScope({
                user,
                selectedBranchId: showBranchSelector ? branchValue : effectiveBranchId,
                selectedLocationId: showLocationSelector ? locationValue : ANALYTICS_ALL,
                dateRange: mapDateRangeValue(dateRangeValue, customDateRange),
              });
              onApply(resolved);
            }}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
