import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useListNotificationDispatchesQuery,
  useRetryNotificationDispatchMutation,
} from '../api/notification-hub.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function NotificationDispatchesListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: {
        channel: channel === 'all' ? undefined : channel,
        status: status === 'all' ? undefined : status,
      },
    }),
    [page, search, channel, status],
  );

  const { data, isLoading } = useListNotificationDispatchesQuery(query);
  const [retryDispatch, { isLoading: isRetrying }] = useRetryNotificationDispatchMutation();
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const onRetry = async (id: string) => {
    try {
      await retryDispatch({ id }).unwrap();
      toast.success('Dispatch retry triggered');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to retry dispatch');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Notification Delivery Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
                placeholder="Search recipient or message"
                className="md:col-span-2"
              />
              <Select
                value={channel}
                onValueChange={(value) => {
                  setChannel(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading dispatches...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="uppercase">{row.channel}</TableCell>
                      <TableCell>
                        <div>{row.recipientName ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">{row.recipientAddress}</div>
                      </TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.attemptCount}</TableCell>
                      <TableCell className="max-w-[240px] truncate">
                        {row.errorMessage ?? '-'}
                      </TableCell>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {row.status === 'failed' ? (
                          <Button size="sm" onClick={() => onRetry(row.id)} disabled={isRetrying}>
                            Retry
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>No dispatches found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta?.page ?? 1} of {meta?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => prev - 1)}
                  disabled={(meta?.page ?? 1) <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
