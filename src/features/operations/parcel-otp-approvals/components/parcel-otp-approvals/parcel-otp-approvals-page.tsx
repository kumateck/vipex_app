import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  OTP_AUTHORIZATION_WORKFLOW_LABELS,
  type OtpApprovalQueueItem,
  type OtpAuthorizationWorkflow,
} from '@/shared/shipments/receiver-otp-exception';
import { OtpApprovalDialog } from '../../dialogs';
import { useOtpApprovalQueue } from '../../hooks';
import { OtpApprovalTable } from './otp-approval-table';

export function ParcelOtpApprovalsPage() {
  const queue = useOtpApprovalQueue();
  const { currentData, isFetching, isError, error, refetch } = queue.query;
  const { select } = queue;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const refreshRef = useRef<HTMLButtonElement>(null);
  const open = useCallback(
    (parcel: OtpApprovalQueueItem, trigger: HTMLButtonElement) => {
      triggerRef.current = trigger;
      select(parcel);
    },
    [select],
  );

  function restoreFocus(event: Event) {
    event.preventDefault();
    const trigger = triggerRef.current;
    if (!queue.approvalMessage && trigger?.isConnected) trigger.focus();
    else refreshRef.current?.focus();
  }

  return (
    <div className="w-full p-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>OTP Approvals</h1>
            </CardTitle>
            <CardDescription>
              Review parcels waiting for OTP confirmation and authorize pickup when the collector’s
              identity has been verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid w-full gap-2 sm:w-48">
                <Label htmlFor="otp-approval-workflow">Workflow</Label>
                <Select
                  value={queue.workflow}
                  onValueChange={(value) => queue.changeWorkflow(value as OtpAuthorizationWorkflow)}
                >
                  <SelectTrigger id="otp-approval-workflow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receiver_cashier">
                      {OTP_AUTHORIZATION_WORKFLOW_LABELS.receiver_cashier}
                    </SelectItem>
                    <SelectItem value="office_pickup">
                      {OTP_AUTHORIZATION_WORKFLOW_LABELS.office_pickup}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <form className="flex flex-1 items-end gap-2" onSubmit={queue.submitSearch}>
                <div className="grid flex-1 gap-2 sm:max-w-80">
                  <Label htmlFor="otp-approval-search">Booking or tracking code</Label>
                  <Input
                    id="otp-approval-search"
                    type="search"
                    maxLength={255}
                    value={queue.searchInput}
                    onChange={(event) => queue.setSearchInput(event.target.value)}
                  />
                </div>
                <Button type="submit" variant="outline">
                  Search
                </Button>
              </form>
              <Button
                ref={refreshRef}
                variant="outline"
                onClick={() => void refetch()}
                aria-disabled={isFetching}
              >
                Refresh
              </Button>
            </div>
            {queue.approvalMessage ? (
              <p role="status" className="rounded-md border bg-muted/50 p-3 text-sm">
                {queue.approvalMessage}
              </p>
            ) : null}
            <div aria-busy={isFetching}>
              {isError ? (
                <p role="alert" className="rounded-md border p-4 text-sm text-destructive">
                  {getErrorMessage(error, '') || 'Unable to load OTP approvals. Try refreshing.'}
                </p>
              ) : !currentData ? (
                <p role="status" className="rounded-md border p-4 text-sm">
                  Loading OTP approvals…
                </p>
              ) : currentData.items.length ? (
                <OtpApprovalTable items={currentData.items} onSelect={open} />
              ) : (
                <p role="status" className="rounded-md border p-4 text-sm text-muted-foreground">
                  No parcels awaiting OTP confirmation for this workflow and search.
                </p>
              )}
            </div>
            {queue.page > 1 || currentData?.hasNextPage ? (
              <div className="flex items-center justify-end gap-3 text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={queue.page === 1 || isFetching}
                  onClick={() => queue.setPage(queue.page - 1)}
                >
                  Previous
                </Button>
                <span>Page {queue.page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentData?.hasNextPage || isFetching}
                  onClick={() => queue.setPage(queue.page + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </ScrollableWrapper>
      {queue.selected ? (
        <OtpApprovalDialog
          parcel={queue.selected}
          workflow={queue.workflow}
          onClose={queue.dismiss}
          onApproved={queue.approve}
          onRestoreFocus={restoreFocus}
        />
      ) : null}
    </div>
  );
}
