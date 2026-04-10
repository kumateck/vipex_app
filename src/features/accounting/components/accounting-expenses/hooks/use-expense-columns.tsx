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
import { ExpenseFundingSource, ExpenseRequestStatus } from '@/db/schemas/enums';
import type { ExpenseRequestRow } from '../../../api';
import {
  expenseStatusLabel,
  formatDateTime,
  formatMoney,
  fundingSourceLabel,
  StatusBadge,
} from '../../accounting-shared';

export function useExpenseColumns(props: {
  approveExpenseRequest: (args: {
    id: string;
    approvedByUserId: string;
    approvalReason: string;
  }) => { unwrap: () => Promise<unknown> };
  bankNameById: Map<string, string>;
  companyBankAccountId: string;
  expenseCategoryNameById: Map<string, string>;
  isMutating: boolean;
  payExpenseRequest: (args: {
    id: string;
    paidByUserId: string;
    companyBankAccountId: string | null;
  }) => { unwrap: () => Promise<unknown> };
  postExpenseRequest: (args: { id: string; postedBy: string }) => {
    unwrap: () => Promise<unknown>;
  };
  setRejectingRow: (row: ExpenseRequestRow) => void;
  submitExpenseRequest: (args: { id: string }) => { unwrap: () => Promise<unknown> };
  runExpenseAction: (
    action: () => Promise<unknown>,
    successMessage: string,
    failureMessage: string,
  ) => Promise<void>;
  userId: string;
}) {
  return useMemo<ColumnDef<ExpenseRequestRow>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Recorded',
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: 'category',
        header: 'Category',
        accessorFn: (row) =>
          props.expenseCategoryNameById.get(row.expenseCategoryId) ?? row.expenseCategoryId,
      },
      {
        id: 'purpose',
        header: 'Purpose',
        accessorFn: (row) => row.purpose,
      },
      {
        id: 'fundingSource',
        header: 'Funding',
        accessorFn: (row) => fundingSourceLabel(row.fundingSource),
      },
      {
        id: 'amount',
        header: 'Amount',
        accessorFn: (row) => formatMoney(row.amountPsw),
      },
      {
        id: 'bankAccount',
        header: 'Bank',
        accessorFn: (row) =>
          row.companyBankAccountId
            ? (props.bankNameById.get(row.companyBankAccountId) ?? row.companyBankAccountId)
            : '-',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const tone =
            row.original.status === ExpenseRequestStatus.POSTED
              ? 'default'
              : row.original.status === ExpenseRequestStatus.REJECTED
                ? 'outline'
                : 'secondary';

          return <StatusBadge label={expenseStatusLabel(row.original.status)} tone={tone} />;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const canSubmit = row.original.status === ExpenseRequestStatus.RECORDED;
          const canApprove = row.original.status === ExpenseRequestStatus.SUBMITTED;
          const canReject = row.original.status === ExpenseRequestStatus.SUBMITTED;
          const canPay = row.original.status === ExpenseRequestStatus.APPROVED;
          const canPost = row.original.status === ExpenseRequestStatus.PAID;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canSubmit && !canApprove && !canReject && !canPay && !canPost}
                >
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canSubmit ? (
                  <DropdownMenuItem
                    disabled={props.isMutating}
                    onClick={() => {
                      void props.runExpenseAction(
                        () => props.submitExpenseRequest({ id: row.original.id }).unwrap(),
                        'Expense request submitted',
                        'Failed to submit expense request',
                      );
                    }}
                  >
                    Submit
                  </DropdownMenuItem>
                ) : null}
                {canApprove ? (
                  <DropdownMenuItem
                    disabled={props.isMutating || !props.userId}
                    onClick={() => {
                      void props.runExpenseAction(
                        () =>
                          props
                            .approveExpenseRequest({
                              id: row.original.id,
                              approvedByUserId: props.userId,
                              approvalReason: 'Approved from accounting screen',
                            })
                            .unwrap(),
                        'Expense request approved',
                        'Failed to approve expense request',
                      );
                    }}
                  >
                    Approve
                  </DropdownMenuItem>
                ) : null}
                {canReject ? (
                  <DropdownMenuItem
                    disabled={props.isMutating}
                    onClick={() => props.setRejectingRow(row.original)}
                  >
                    Reject
                  </DropdownMenuItem>
                ) : null}
                {canPay ? (
                  <DropdownMenuItem
                    disabled={props.isMutating || !props.userId}
                    onClick={() => {
                      void props.runExpenseAction(
                        () =>
                          props
                            .payExpenseRequest({
                              id: row.original.id,
                              paidByUserId: props.userId,
                              companyBankAccountId:
                                row.original.fundingSource === ExpenseFundingSource.COMPANY_BANK
                                  ? row.original.companyBankAccountId ||
                                    props.companyBankAccountId ||
                                    null
                                  : null,
                            })
                            .unwrap(),
                        'Expense request marked as paid',
                        'Failed to mark expense request as paid',
                      );
                    }}
                  >
                    Pay
                  </DropdownMenuItem>
                ) : null}
                {canPost ? (
                  <DropdownMenuItem
                    disabled={props.isMutating || !props.userId}
                    onClick={() => {
                      void props.runExpenseAction(
                        () =>
                          props
                            .postExpenseRequest({
                              id: row.original.id,
                              postedBy: props.userId,
                            })
                            .unwrap(),
                        'Expense request posted to ledger',
                        'Failed to post expense request',
                      );
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
