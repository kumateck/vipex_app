import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/dates';
import type { NotificationDispatch } from '../../../api/notification-hub.api';

type NotificationDispatchesTableProps = {
  rows: NotificationDispatch[];
  isLoading: boolean;
  isRetrying: boolean;
  onView: (dispatch: NotificationDispatch) => void;
  onRetry: (id: string) => void;
};

export const NotificationDispatchesTable = memo(function NotificationDispatchesTable({
  rows,
  isLoading,
  isRetrying,
  onView,
  onRetry,
}: NotificationDispatchesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Channel</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Message</TableHead>
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
              <TableCell colSpan={8}>Loading dispatches...</TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="uppercase">{row.channel}</TableCell>
                <TableCell>
                  <div>{row.recipientName ?? '-'}</div>
                  <div className="text-xs text-muted-foreground">{row.recipientAddress}</div>
                </TableCell>
                <TableCell className="max-w-[360px]">
                  <p className="line-clamp-2 whitespace-pre-wrap break-words" title={row.body}>
                    {row.body}
                  </p>
                </TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.attemptCount}</TableCell>
                <TableCell className="max-w-[240px] truncate" title={row.errorMessage ?? undefined}>
                  {row.errorMessage ?? '-'}
                </TableCell>
                <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onView(row)}>
                      View
                    </Button>
                    {row.status === 'failed' ? (
                      <Button size="sm" onClick={() => onRetry(row.id)} disabled={isRetrying}>
                        Retry
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8}>No dispatches found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
});
