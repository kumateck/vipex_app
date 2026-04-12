import { useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CommunicationEngagementRequest } from '@/features/communication/api/communication.api';

type CommunicationRequestsPanelProps = {
  incomingRequests: CommunicationEngagementRequest[];
  outgoingRequests: CommunicationEngagementRequest[];
  isLoadingIncomingRequests: boolean;
  isLoadingOutgoingRequests: boolean;
  isApprovingRequest: boolean;
  isDecliningRequest: boolean;
  onApproveRequest: (id: string) => Promise<void>;
  onDeclineRequest: (id: string) => Promise<void>;
};

function RequestRowSkeleton() {
  return (
    <div className="rounded-md border p-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-3 w-52" />
    </div>
  );
}

export function CommunicationRequestsPanel({
  incomingRequests,
  outgoingRequests,
  isLoadingIncomingRequests,
  isLoadingOutgoingRequests,
  isApprovingRequest,
  isDecliningRequest,
  onApproveRequest,
  onDeclineRequest,
}: CommunicationRequestsPanelProps) {
  const [pendingDecision, setPendingDecision] = useState<{
    id: string;
    action: 'approve' | 'decline';
    label: string;
  } | null>(null);

  const isProcessing = isApprovingRequest || isDecliningRequest;
  const incomingEmpty = !isLoadingIncomingRequests && !incomingRequests.length;
  const outgoingEmpty = !isLoadingOutgoingRequests && !outgoingRequests.length;

  const confirmCopy = useMemo(() => {
    if (!pendingDecision) return null;
    return pendingDecision.action === 'approve'
      ? `Approve chat request from ${pendingDecision.label}?`
      : `Decline chat request from ${pendingDecision.label}?`;
  }, [pendingDecision]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <section className="space-y-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Incoming Requests
        </h3>
        <div className="space-y-2">
          {isLoadingIncomingRequests ? (
            <>
              <RequestRowSkeleton />
              <RequestRowSkeleton />
            </>
          ) : null}
          {incomingEmpty ? (
            <p className="px-1 text-xs text-muted-foreground">No incoming requests.</p>
          ) : null}
          {incomingRequests.map((request) => {
            const label = request.requesterFullname ?? request.requesterUserId;
            const meta = [
              request.requesterRoleName,
              request.requesterBranchName,
              request.requesterLocationName,
            ]
              .filter(Boolean)
              .join(' • ');
            return (
              <div key={request.id} className="space-y-2 rounded-md border p-3">
                <div className="space-y-0.5">
                  <p className="truncate text-sm font-semibold">{label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {meta || 'No role assigned'}
                  </p>
                </div>
                {request.reasonNote ? (
                  <p className="text-xs text-muted-foreground">Reason: {request.reasonNote}</p>
                ) : null}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setPendingDecision({ id: request.id, action: 'approve', label })}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingDecision({ id: request.id, action: 'decline', label })}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Outgoing Requests
        </h3>
        <div className="space-y-2">
          {isLoadingOutgoingRequests ? (
            <>
              <RequestRowSkeleton />
              <RequestRowSkeleton />
            </>
          ) : null}
          {outgoingEmpty ? (
            <p className="px-1 text-xs text-muted-foreground">No outgoing requests.</p>
          ) : null}
          {outgoingRequests.map((request) => {
            const label = request.targetFullname ?? request.targetUserId;
            const meta = [
              request.targetRoleName,
              request.targetBranchName,
              request.targetLocationName,
            ]
              .filter(Boolean)
              .join(' • ');
            return (
              <div key={request.id} className="space-y-1 rounded-md border p-3">
                <p className="truncate text-sm font-semibold">{label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {meta || 'No role assigned'}
                </p>
                {request.reasonNote ? (
                  <p className="text-xs text-muted-foreground">Reason: {request.reasonNote}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <AlertDialog
        open={Boolean(pendingDecision)}
        onOpenChange={(open) => !open && setPendingDecision(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>{confirmCopy}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isProcessing}
              onClick={async () => {
                if (!pendingDecision) return;
                if (pendingDecision.action === 'approve') {
                  await onApproveRequest(pendingDecision.id);
                } else {
                  await onDeclineRequest(pendingDecision.id);
                }
                setPendingDecision(null);
              }}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
