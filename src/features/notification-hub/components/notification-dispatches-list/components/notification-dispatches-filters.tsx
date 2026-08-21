import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type NotificationDispatchesFiltersProps = {
  searchInput: string;
  channel: string;
  status: string;
  onSearchInputChange: (value: string) => void;
  onChannelChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

export function NotificationDispatchesFilters({
  searchInput,
  channel,
  status,
  onSearchInputChange,
  onChannelChange,
  onStatusChange,
}: NotificationDispatchesFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Input
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
        aria-label="Search notification delivery logs"
        placeholder="Search recipient or message"
        className="md:col-span-2"
      />
      <Select value={channel} onValueChange={onChannelChange}>
        <SelectTrigger aria-label="Filter delivery logs by channel">
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All channels</SelectItem>
          <SelectItem value="sms">SMS</SelectItem>
          <SelectItem value="email">Email</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger aria-label="Filter delivery logs by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
