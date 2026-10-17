import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/dates';
import { useGetCustomerMessageQuery } from '../../services/api';
import { useMessageHandling } from '../../hooks/use-message-handling';
import { MESSAGE_STATUSES, messageLabel, type MessageDetail } from '../../types';
import { MessageOptionSelect } from './message-option-select';

export function CustomerMessageDetail({ id }: { id: string }) {
  const {
    currentData: message,
    isFetching,
    error,
    refetch,
  } = useGetCustomerMessageQuery(id, { refetchOnMountOrArgChange: true });
  if (error)
    return (
      <div role="alert" className="space-y-3 p-4">
        <p>Could not load this customer message.</p>
        <Button variant="outline" onClick={refetch}>
          Try again
        </Button>
      </div>
    );
  if (!message)
    return (
      <p role="status" className="p-4">
        Loading message…
      </p>
    );
  return (
    <section
      className="space-y-5 rounded-lg border p-4"
      aria-label="Customer message details"
      aria-busy={isFetching}
    >
      <div>
        <h2 className="font-semibold">{message.reference}</h2>
        <p className="text-sm capitalize">
          {message.type} · {messageLabel(message.status)}
        </p>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Customer</dt>
          <dd>{message.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{message.phone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="break-words">{message.email || 'Not provided'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Received</dt>
          <dd>{formatDateTime(message.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Branch supplied by customer</dt>
          <dd>{message.branch || 'Not provided'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tracking code supplied by customer</dt>
          <dd className="break-all">{message.trackingCode || 'Not provided'}</dd>
        </div>
      </dl>
      <p className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">
        {message.message}
      </p>
      <HandlingForm key={message.updatedAt} message={message} />
      <div>
        <h3 className="mb-3 font-medium">Handling history</h3>
        <ol className="space-y-3 text-sm">
          {message.events.map((event) => (
            <li key={event.id} className="border-l-2 pl-3">
              <p className="capitalize">
                {event.fromStatus ? `${messageLabel(event.fromStatus)} → ` : ''}
                {messageLabel(event.toStatus)}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
              {event.note && <p className="whitespace-pre-wrap break-words">{event.note}</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function HandlingForm({ message }: { message: MessageDetail }) {
  const handling = useMessageHandling(message);
  if (!handling.canManage)
    return (
      <p className="text-sm text-muted-foreground">
        You have read-only access to customer messages.
      </p>
    );
  return (
    <form
      className="space-y-3 border-t pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handling.save();
      }}
    >
      <MessageOptionSelect
        label="Status"
        options={MESSAGE_STATUSES}
        value={handling.status}
        onChange={(value) => value && handling.setStatus(value)}
        disabled={handling.isLoading}
      />
      <label className="block text-sm font-medium">
        Private handling note (optional)
        <Textarea
          className="mt-1"
          maxLength={2000}
          value={handling.note}
          onChange={(event) => handling.setNote(event.target.value)}
          disabled={handling.isLoading}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Notes are for the VIPEX team. Saving does not send a reply to the customer.
      </p>
      <Button type="submit" disabled={handling.isLoading}>
        {handling.isLoading ? 'Saving…' : 'Save update'}
      </Button>
    </form>
  );
}
