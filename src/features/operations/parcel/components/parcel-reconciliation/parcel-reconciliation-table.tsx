import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import type { PaginationMeta, PaginationRequestDto } from '@/server/types/pagination.types';
import type { ParcelReconciliationCaseRow } from '../../api/parcel.api';
import { ACTION_OPTIONS, CASE_STATUS_LABEL, CASE_TYPE_OPTIONS } from './constants';
import type { ParcelReconciliationFilters } from './types';
import { formatMoneyPsw, formatReconciliationDate } from './utils';

type ParcelReconciliationTableProps = {
  data: ParcelReconciliationCaseRow[];
  meta: PaginationMeta;
  loading: boolean;
  canRequest: boolean;
  canApprove: boolean;
  canExecute: boolean;
  serverFilters: ParcelReconciliationFilters;
  onRequestChange: (request: PaginationRequestDto<ParcelReconciliationFilters>) => void;
  onCreateCase: () => void;
  onApproveCase: (reconciliationCase: ParcelReconciliationCaseRow) => void;
  onExecuteCase: (reconciliationCase: ParcelReconciliationCaseRow) => void;
};

export function ParcelReconciliationTable({
  data,
  meta,
  loading,
  canRequest,
  canApprove,
  canExecute,
  serverFilters,
  onRequestChange,
  onCreateCase,
  onApproveCase,
  onExecuteCase,
}: ParcelReconciliationTableProps) {
  const columns = useMemo<ColumnDef<ParcelReconciliationCaseRow>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        accessorKey: 'caseType',
        header: 'Case Type',
        cell: ({ row }) =>
          CASE_TYPE_OPTIONS.find((option) => option.value === row.original.caseType)?.label ??
          `Type ${row.original.caseType}`,
      },
      {
        accessorKey: 'actionType',
        header: 'Action',
        cell: ({ row }) =>
          row.original.actionType == null
            ? '-'
            : (ACTION_OPTIONS.find((option) => option.value === row.original.actionType)?.label ??
              `Action ${row.original.actionType}`),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) =>
          CASE_STATUS_LABEL[row.original.status] ?? `Unknown (${row.original.status})`,
      },
      {
        id: 'correction',
        header: 'Correction / Effective Shift',
        cell: ({ row }) =>
          row.original.proposedChargePsw == null ? (
            '-'
          ) : (
            <div className="min-w-52 text-xs">
              <p>
                Charge: {formatMoneyPsw(row.original.originalChargePsw)} →{' '}
                <strong>{formatMoneyPsw(row.original.proposedChargePsw)}</strong>
              </p>
              <p className="text-muted-foreground">
                {row.original.sessionCashierName ?? 'Cashier'} ·{' '}
                {formatReconciliationDate(
                  row.original.effectiveAt ?? row.original.sessionScheduledStartTime,
                )}
              </p>
            </div>
          ),
      },
      {
        accessorKey: 'requestedByName',
        header: 'Requested By',
        cell: ({ row }) => row.original.requestedByName ?? row.original.requestedBy,
      },
      {
        accessorKey: 'requestedAt',
        header: 'Requested At',
        cell: ({ row }) => formatReconciliationDate(row.original.requestedAt),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            {canApprove && row.original.status === 0 ? (
              <Button size="sm" onClick={() => onApproveCase(row.original)}>
                Approve
              </Button>
            ) : null}
            {canExecute && row.original.status === 1 ? (
              <Button size="sm" variant="secondary" onClick={() => onExecuteCase(row.original)}>
                Execute
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canApprove, canExecute, onApproveCase, onExecuteCase],
  );

  return (
    <ScrollableWrapper>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Parcel Reconciliation Cases</CardTitle>
              <CardDescription>
                Investigate by booking or telephone, then request, independently approve, and apply
                corrections to the transaction&apos;s original shift.
              </CardDescription>
            </div>
            {canRequest ? <Button onClick={onCreateCase}>New Case</Button> : null}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            mode="server"
            data={data}
            columns={columns}
            meta={meta}
            loading={loading}
            serverFilters={serverFilters}
            onRequestChange={onRequestChange}
            searchPlaceholder="Search by booking, tracking, telephone, or note"
            enableVirtualization={false}
          />
        </CardContent>
      </Card>
    </ScrollableWrapper>
  );
}
