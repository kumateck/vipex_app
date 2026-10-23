import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { useTaxData } from '../../hooks';

export function TaxDataRouteFields({ data }: { data: ReturnType<typeof useTaxData> }) {
  const d = data.draft;
  return (
    <div className="grid gap-4 sm:grid-cols-2 ">
      <div className="space-y-2">
        <Label htmlFor="tax-data-from">From branch</Label>
        {d.isHeadOffice ? (
          <Select value={d.branchId} onValueChange={d.setBranchId}>
            <SelectTrigger id="tax-data-from">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All source branches</SelectItem>
              {data.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="rounded-md border px-3 py-2 text-sm">{d.branchName}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tax-data-to">To branch</Label>
        <Select value={d.destinationBranchId} onValueChange={d.setDestinationBranchId}>
          <SelectTrigger id="tax-data-to">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All destinations</SelectItem>
            {data.destinations.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Booking date</Label>
        <DatePicker
          date={d.date ? new Date(`${d.date}T00:00:00`) : undefined}
          onDateChange={(value) => d.setDate(value ? format(value, 'yyyy-MM-dd') : '')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tax-data-confirmation">Tax confirmation</Label>
        <Select
          value={d.confirmation}
          onValueChange={(value) => d.setConfirmation(value as typeof d.confirmation)}
        >
          <SelectTrigger id="tax-data-confirmation">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All records</SelectItem>
            <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
