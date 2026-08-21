import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/dates';
import type { NotificationDispatch } from '../../../api/notification-hub.api';

type NotificationDispatchDetailsDialogProps = {
  dispatch: NotificationDispatch | null;
  onClose: () => void;
};

function DetailItem({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value ?? '-'}</dd>
    </div>
  );
}

export function NotificationDispatchDetailsDialog({
  dispatch,
  onClose,
}: NotificationDispatchDetailsDialogProps) {
  return (
    <Dialog open={Boolean(dispatch)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Message delivery details</DialogTitle>
          <DialogDescription>
            Review the complete notification submitted to the provider.
          </DialogDescription>
        </DialogHeader>

        {dispatch ? (
          <div className="space-y-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Channel" value={dispatch.channel.toUpperCase()} />
              <DetailItem label="Status" value={dispatch.status} />
              <DetailItem label="Recipient" value={dispatch.recipientName} />
              <DetailItem label="Address" value={dispatch.recipientAddress} />
              <DetailItem label="Attempts" value={dispatch.attemptCount} />
              <DetailItem label="Created" value={formatDateTime(dispatch.createdAt)} />
              <DetailItem label="Provider" value={dispatch.providerKey} />
              <DetailItem label="Provider message ID" value={dispatch.providerMessageId} />
            </dl>

            {dispatch.subject ? <DetailItem label="Subject" value={dispatch.subject} /> : null}

            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Message sent
              </h3>
              <p className="whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-4 text-sm">
                {dispatch.body}
              </p>
            </div>

            {dispatch.errorMessage ? (
              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-destructive">
                  Error
                </h3>
                <p className="whitespace-pre-wrap break-words rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
                  {dispatch.errorMessage}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
