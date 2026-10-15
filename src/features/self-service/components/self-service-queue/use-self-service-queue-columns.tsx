import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SelfServiceDraftStatus } from '@/db/schemas/enums';
import { formatDateTime } from '@/lib/dates';
import type { SelfServiceDraft } from '../../api/self-service-agent.api';

export function useSelfServiceQueueColumns(input: {
  canComplete: boolean;
  isClaiming: boolean;
  onComplete: (draft: SelfServiceDraft) => void;
  onView: (draft: SelfServiceDraft) => void;
}) {
  return useMemo<ColumnDef<SelfServiceDraft>[]>(
    () => [
      ...(['sender', 'receiver'] as const).map(
        (role): ColumnDef<SelfServiceDraft> => ({
          id: role,
          header: role === 'sender' ? 'Sender' : 'Receiver',
          accessorFn: (row) =>
            `${row[`${role}Fullname`]} ${row[`${role}Phone`]} ${row[`${role}Phone2`] ?? ''}`,
          cell: ({ row }) => (
            <div>
              <div className="font-medium">{row.original[`${role}Fullname`]}</div>
              <div className="text-xs text-muted-foreground">
                {row.original[`${role}Phone`]}
                {row.original[`${role}Phone2`] ? ` / ${row.original[`${role}Phone2`]}` : ''}
              </div>
            </div>
          ),
        }),
      ),
      {
        accessorKey: 'parcelContent',
        header: 'Content',
        cell: ({ getValue }) => (
          <div className="max-w-xs whitespace-normal">{String(getValue())}</div>
        ),
      },
      {
        accessorKey: 'parcelValuePsw',
        header: 'Value',
        cell: ({ row }) => `GH₵${(row.original.parcelValuePsw / 100).toFixed(2)}`,
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => (row.status === SelfServiceDraftStatus.CLAIMED ? 'Claimed' : 'New'),
        cell: ({ row, getValue }) => (
          <Badge
            variant={
              row.original.status === SelfServiceDraftStatus.CLAIMED ? 'secondary' : 'outline'
            }
          >
            {String(getValue())}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => input.onView(row.original)}>
              View / Edit
            </Button>
            {input.canComplete ? (
              <Button
                size="sm"
                disabled={input.isClaiming}
                onClick={() => input.onComplete(row.original)}
              >
                Complete
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [input.canComplete, input.isClaiming, input.onComplete, input.onView],
  );
}
