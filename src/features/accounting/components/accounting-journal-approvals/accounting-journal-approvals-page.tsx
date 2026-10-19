import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useApproveAndPostManualJournalEntryMutation,
  useListPendingManualJournalEntriesQuery,
  useRejectManualJournalEntryMutation,
} from '../../api';
import {
  AccountingDisabledState,
  AccountingUnauthorizedState,
  formatDateTime,
  formatMoney,
} from '../accounting-shared';

export function AccountingJournalApprovalsPage() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const canRead = permissions.has(PermissionKeys.CanReadAccountingManualEntries);
  const canApprove = permissions.has(PermissionKeys.CanApproveAccountingManualEntries);

  if (!user?.company?.useAccounting) return <AccountingDisabledState />;
  if (!canRead && !canApprove) {
    return (
      <AccountingUnauthorizedState
        title="Journal Approvals Restricted"
        description="Your role does not include permission to view or approve manual journal entries."
      />
    );
  }

  const companyId = user.company?.id ?? '';
  return <AccountingJournalApprovalsContent companyId={companyId} canApprove={canApprove} />;
}

function AccountingJournalApprovalsContent({
  companyId,
  canApprove,
}: {
  companyId: string;
  canApprove: boolean;
}) {
  const { data: pendingEntries = [], isFetching } = useListPendingManualJournalEntriesQuery(
    { companyId },
    { skip: !companyId },
  );
  const [approveAndPostManualJournalEntry, { isLoading: isApproving }] =
    useApproveAndPostManualJournalEntryMutation();
  const [rejectManualJournalEntry, { isLoading: isRejecting }] =
    useRejectManualJournalEntryMutation();

  async function handleApprove(manualEntryId: string) {
    try {
      const result = await approveAndPostManualJournalEntry({
        id: manualEntryId,
        companyId,
        approvalReason: 'Approved from pending manual entry queue',
      }).unwrap();
      toast.success(`Entry approved and posted (${result.postedEntryId})`);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to approve pending entry');
    }
  }

  async function handleReject(manualEntryId: string) {
    const rejectionReason = globalThis.prompt('Enter rejection reason');
    if (!rejectionReason?.trim()) return;

    try {
      await rejectManualJournalEntry({
        id: manualEntryId,
        companyId,
        rejectionReason: rejectionReason.trim(),
      }).unwrap();
      toast.success('Entry rejected');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to reject pending entry');
    }
  }

  return (
    <ScrollableWrapper>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manual Journal Approvals</CardTitle>
            <CardDescription>
              Review queued manual journal entries and approve/reject before posting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isFetching ? (
              <p className="text-sm text-muted-foreground">Loading pending entries...</p>
            ) : pendingEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending entries. Auto-authorized entries are posted directly and can be found
                under Reports &gt; Journal Listing.
              </p>
            ) : (
              pendingEntries.map((entry) => (
                <div key={entry.id} className="space-y-2 rounded-md border p-3">
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <p>
                      <strong>Recorded:</strong> {formatDateTime(entry.createdAt)}
                    </p>
                    <p>
                      <strong>Entry date:</strong> {formatDateTime(entry.entryDate)}
                    </p>
                    <p>
                      <strong>Total debit:</strong> {formatMoney(entry.totalDebitPsw)}
                    </p>
                    <p>
                      <strong>Total credit:</strong> {formatMoney(entry.totalCreditPsw)}
                    </p>
                    <p>
                      <strong>Policy:</strong> {entry.policyCode ?? 'N/A'}
                    </p>
                    <p>
                      <strong>Threshold:</strong> {formatMoney(entry.thresholdPsw)}
                    </p>
                  </div>
                  {entry.memo ? (
                    <p className="text-sm text-muted-foreground">
                      <strong>Memo:</strong> {entry.memo}
                    </p>
                  ) : null}

                  {canApprove ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleApprove(entry.id)}
                        disabled={isApproving || isRejecting}
                      >
                        Approve & Post
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleReject(entry.id)}
                        disabled={isApproving || isRejecting}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      You can view this queue, but only approvers can process entries.
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
