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
import { TaxFilingPeriodStatus, TaxFilingStatus } from '@/db/schemas/enums';
import type { TaxFilingPeriodRow, TaxJournalItemRow } from '../../../api';
import {
  filingPeriodStatusLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  taxFilingStatusLabel,
  StatusBadge,
} from '../../accounting-shared';

export function useTaxColumns(props: {
  branchNameById: Map<string, string>;
  closeTaxFilingPeriod: (args: { id: string }) => { unwrap: () => Promise<unknown> };
  isMutating: boolean;
  markTaxFilingPeriodUnderReview: (args: { id: string }) => { unwrap: () => Promise<unknown> };
  markTaxItemFiled: (args: {
    id: string;
    filingPeriodId: string | null;
    actedByUserId: string;
  }) => { unwrap: () => Promise<unknown> };
  markTaxItemReady: (args: { id: string; filingPeriodId: string; actedByUserId: string }) => {
    unwrap: () => Promise<unknown>;
  };
  periodNameById: Map<string, string>;
  selectedPeriodId: string;
  setExcludingRow: (row: TaxJournalItemRow) => void;
  submitTaxFilingPeriod: (args: { id: string }) => { unwrap: () => Promise<unknown> };
  runPeriodAction: (
    action: () => Promise<unknown>,
    successMessage: string,
    failureMessage: string,
  ) => Promise<void>;
  runTaxAction: (
    action: () => Promise<unknown>,
    successMessage: string,
    failureMessage: string,
  ) => Promise<void>;
  userId: string;
}) {
  const periodColumns = useMemo<ColumnDef<TaxFilingPeriodRow>[]>(
    () => [
      { accessorKey: 'name', header: 'Period' },
      {
        id: 'range',
        header: 'Date Range',
        accessorFn: (row) => `${formatDate(row.dateFrom)} to ${formatDate(row.dateTo)}`,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge label={filingPeriodStatusLabel(row.original.status)} tone="secondary" />
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => row.original.notes || '-',
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const canReview = row.original.status === TaxFilingPeriodStatus.OPEN;
          const canSubmit = row.original.status === TaxFilingPeriodStatus.UNDER_REVIEW;
          const canClose = row.original.status === TaxFilingPeriodStatus.SUBMITTED;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canReview && !canSubmit && !canClose}
                >
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canReview ? (
                  <DropdownMenuItem
                    disabled={props.isMutating}
                    onClick={() => {
                      void props.runPeriodAction(
                        () =>
                          props.markTaxFilingPeriodUnderReview({ id: row.original.id }).unwrap(),
                        'Tax filing period moved to under review',
                        'Failed to move tax filing period to under review',
                      );
                    }}
                  >
                    Review
                  </DropdownMenuItem>
                ) : null}
                {canSubmit ? (
                  <DropdownMenuItem
                    disabled={props.isMutating}
                    onClick={() => {
                      void props.runPeriodAction(
                        () => props.submitTaxFilingPeriod({ id: row.original.id }).unwrap(),
                        'Tax filing period submitted',
                        'Failed to submit tax filing period',
                      );
                    }}
                  >
                    Submit
                  </DropdownMenuItem>
                ) : null}
                {canClose ? (
                  <DropdownMenuItem
                    disabled={props.isMutating}
                    onClick={() => {
                      void props.runPeriodAction(
                        () => props.closeTaxFilingPeriod({ id: row.original.id }).unwrap(),
                        'Tax filing period closed',
                        'Failed to close tax filing period',
                      );
                    }}
                  >
                    Close
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

  const itemColumns = useMemo<ColumnDef<TaxJournalItemRow>[]>(
    () => [
      {
        id: 'postingDate',
        header: 'Posting Date',
        accessorFn: (row) => formatDate(row.postingDate),
      },
      {
        id: 'branch',
        header: 'Branch',
        accessorFn: (row) => props.branchNameById.get(row.branchId) ?? row.branchId,
      },
      { id: 'sourceId', header: 'Source', accessorFn: (row) => row.sourceId ?? '-' },
      { id: 'base', header: 'Tax Base', accessorFn: (row) => formatMoney(row.taxBasePsw) },
      { id: 'taxTotal', header: 'Tax Total', accessorFn: (row) => formatMoney(row.taxTotalPsw) },
      {
        id: 'components',
        header: 'Components',
        accessorFn: (row) =>
          `VAT ${formatMoney(row.vatPsw)} • GETFund ${formatMoney(row.getfundPsw)} • NHIL ${formatMoney(row.nhilPsw)} • COVID ${formatMoney(row.covidPsw)}`,
      },
      {
        id: 'filingPeriod',
        header: 'Filing Period',
        accessorFn: (row) =>
          row.filingPeriodId
            ? (props.periodNameById.get(row.filingPeriodId) ?? row.filingPeriodId)
            : '-',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const tone =
            row.original.filingStatus === TaxFilingStatus.FILED
              ? 'default'
              : row.original.filingStatus === TaxFilingStatus.READY_FOR_FILING
                ? 'secondary'
                : 'outline';
          return (
            <StatusBadge label={taxFilingStatusLabel(row.original.filingStatus)} tone={tone} />
          );
        },
      },
      { id: 'reviewedAt', header: 'Reviewed', accessorFn: (row) => formatDateTime(row.reviewedAt) },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const canReady = row.original.filingStatus === TaxFilingStatus.UNFILED;
          const canFiled = row.original.filingStatus === TaxFilingStatus.READY_FOR_FILING;
          const canExclude = row.original.filingStatus !== TaxFilingStatus.FILED;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canReady && !canFiled && !canExclude}
                >
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canReady ? (
                  <DropdownMenuItem
                    disabled={props.isMutating || !props.selectedPeriodId || !props.userId}
                    onClick={() => {
                      void props.runTaxAction(
                        () =>
                          props
                            .markTaxItemReady({
                              id: row.original.id,
                              filingPeriodId: props.selectedPeriodId,
                              actedByUserId: props.userId,
                            })
                            .unwrap(),
                        'Tax item marked ready for filing',
                        'Failed to mark tax item ready',
                      );
                    }}
                  >
                    Ready
                  </DropdownMenuItem>
                ) : null}
                {canFiled ? (
                  <DropdownMenuItem
                    disabled={props.isMutating || !props.userId}
                    onClick={() => {
                      void props.runTaxAction(
                        () =>
                          props
                            .markTaxItemFiled({
                              id: row.original.id,
                              filingPeriodId:
                                row.original.filingPeriodId ?? props.selectedPeriodId ?? null,
                              actedByUserId: props.userId,
                            })
                            .unwrap(),
                        'Tax item marked as filed',
                        'Failed to mark tax item as filed',
                      );
                    }}
                  >
                    Filed
                  </DropdownMenuItem>
                ) : null}
                {canExclude ? (
                  <DropdownMenuItem
                    disabled={props.isMutating}
                    onClick={() => props.setExcludingRow(row.original)}
                  >
                    Exclude
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

  return { itemColumns, periodColumns };
}
