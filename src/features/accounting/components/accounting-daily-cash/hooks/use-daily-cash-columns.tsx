import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CashConfirmationStatus } from '@/db/schemas/enums';
import type { DailyCashConfirmationRow } from '../../../api';
import {
  cashConfirmationStatusLabel,
  formatDate,
  formatMoney,
  StatusBadge,
} from '../../accounting-shared';
import type { DailyCashPageView } from '../types/accounting-daily-cash.types';

export function useDailyCashColumns(props: {
  branchNameById: Map<string, string>;
  cashierNameById: Map<string, string>;
  isMutating: boolean;
  locationNameById: Map<string, string>;
  onConfirm: (row: DailyCashConfirmationRow) => Promise<void>;
  onPost: (row: DailyCashConfirmationRow) => Promise<void>;
  view: DailyCashPageView;
}) {
  return useMemo<ColumnDef<DailyCashConfirmationRow>[]>(
    () => [
      {
        accessorKey: 'confirmationDate',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.confirmationDate),
      },
      {
        id: 'branch',
        header: 'Branch',
        accessorFn: (row) => props.branchNameById.get(row.branchId) ?? row.branchId,
      },
      {
        id: 'location',
        header: 'Location',
        accessorFn: (row) =>
          row.locationId ? (props.locationNameById.get(row.locationId) ?? row.locationId) : '-',
      },
      {
        id: 'cashier',
        header: 'Cashier',
        accessorFn: (row) =>
          row.cashierUserId
            ? (props.cashierNameById.get(row.cashierUserId) ?? row.cashierUserId)
            : '-',
      },
      {
        id: 'cash',
        header: 'Cash',
        cell: ({ row }) => (
          <div className="leading-tight">
            <div>{formatMoney(row.original.countedCashPsw)}</div>
            <div className="text-xs text-muted-foreground">
              Expected: {formatMoney(row.original.expectedCashPsw)}
            </div>
          </div>
        ),
      },
      {
        id: 'mtn',
        header: 'MTN',
        cell: ({ row }) => (
          <div className="leading-tight">
            <div>{formatMoney(row.original.countedMtnPsw)}</div>
            <div className="text-xs text-muted-foreground">
              Expected: {formatMoney(row.original.expectedMtnPsw)}
            </div>
          </div>
        ),
      },
      {
        id: 'telecel',
        header: 'Telecel',
        cell: ({ row }) => (
          <div className="leading-tight">
            <div>{formatMoney(row.original.countedTelecelPsw)}</div>
            <div className="text-xs text-muted-foreground">
              Expected: {formatMoney(row.original.expectedTelecelPsw)}
            </div>
          </div>
        ),
      },
      {
        id: 'airtel',
        header: 'Airtel',
        cell: ({ row }) => (
          <div className="leading-tight">
            <div>{formatMoney(row.original.countedAirtelPsw)}</div>
            <div className="text-xs text-muted-foreground">
              Expected: {formatMoney(row.original.expectedAirtelPsw)}
            </div>
          </div>
        ),
      },
      {
        id: 'variance',
        header: 'Variance',
        accessorFn: (row) =>
          row.shortagePsw > 0
            ? `Short ${formatMoney(row.shortagePsw)}`
            : row.overagePsw > 0
              ? `Over ${formatMoney(row.overagePsw)}`
              : 'Balanced',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const tone =
            row.original.status === CashConfirmationStatus.POSTED
              ? 'default'
              : row.original.status === CashConfirmationStatus.CONFIRMED
                ? 'secondary'
                : 'outline';

          return (
            <StatusBadge label={cashConfirmationStatusLabel(row.original.status)} tone={tone} />
          );
        },
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const canConfirm =
            (props.view === 'drafts' || props.view === 'approvals') &&
            row.original.status === CashConfirmationStatus.DRAFT;
          const canPost =
            props.view === 'recorded' && row.original.status === CashConfirmationStatus.CONFIRMED;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canConfirm && !canPost}
                >
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canConfirm ? (
                  <DropdownMenuItem
                    disabled={props.isMutating}
                    onClick={() => {
                      void props.onConfirm(row.original);
                    }}
                  >
                    Confirm
                  </DropdownMenuItem>
                ) : null}
                {canPost ? (
                  <DropdownMenuItem
                    disabled={props.isMutating}
                    onClick={() => {
                      void props.onPost(row.original);
                    }}
                  >
                    Post
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [props],
  );
}
