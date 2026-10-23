import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { PARCEL_STATUS_LABELS } from '@/shared/shipments/parcel-status-labels';
import type { useParcelAnalytics } from '../../hooks';

type Props = { analytics: ReturnType<typeof useParcelAnalytics> };
export function ParcelAnalyticsFilters({ analytics: a }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Booking date range</Label>
        <DateRangePicker value={a.range} onChange={a.setRange} />
        <p className="text-xs text-muted-foreground">
          Up to 366 days. Status and balances reflect current records.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="parcel-analytics-basis">Branch view</Label>
        <Select
          value={a.basis}
          onValueChange={(value) => a.setBasis(value as 'source' | 'destination')}
        >
          <SelectTrigger id="parcel-analytics-basis">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="source">Outgoing · booking branch</SelectItem>
            <SelectItem value="destination">Incoming · destination branch</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="parcel-analytics-branch">Branch scope</Label>
        {a.isHeadOffice ? (
          <BranchSelect
            id="parcel-analytics-branch"
            value={a.branch}
            onChange={a.setBranch}
            options={a.options}
          />
        ) : (
          <p className="rounded-md border px-3 py-2 text-sm">{a.branchName}</p>
        )}
      </div>
      {a.isHeadOffice ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="parcel-analytics-origin">Origin branch</Label>
            <BranchSelect
              id="parcel-analytics-origin"
              value={a.origin}
              onChange={a.setOrigin}
              options={a.options}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parcel-analytics-destination">Destination branch</Label>
            <BranchSelect
              id="parcel-analytics-destination"
              value={a.destination}
              onChange={a.setDestination}
              options={a.options}
            />
          </div>
        </>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="parcel-analytics-status">Current parcel status</Label>
        <Select value={a.status} onValueChange={a.setStatus}>
          <SelectTrigger id="parcel-analytics-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(PARCEL_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function BranchSelect(props: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
}) {
  return (
    <Select value={props.value} onValueChange={props.onChange}>
      <SelectTrigger id={props.id}>
        <SelectValue placeholder="All branches" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All branches</SelectItem>
        {props.options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
