import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { formatDateTime } from '@/lib/dates';
import { useCustomerInbox } from '../../hooks/use-customer-inbox';
import { MESSAGE_STATUSES, MESSAGE_TYPES, messageLabel } from '../../types';
import { CustomerMessageDetail } from './customer-message-detail';
import { MessageOptionSelect } from './message-option-select';

export function CustomerInboxPage() {
  const inbox = useCustomerInbox();
  if (!inbox.canRead)
    return (
      <p role="alert" className="p-6">
        You do not have permission to view customer messages.
      </p>
    );
  return (
    <ScrollableWrapper>
      <div className="space-y-5 p-4 md:p-6">
        <header>
          <h1 className="text-2xl font-semibold">Customer messages</h1>
          <p className="text-sm text-muted-foreground">
            Website enquiries, complaints and feedback.
          </p>
        </header>
        <div className="flex flex-wrap items-end gap-3">
          <MessageOptionSelect
            label="Message type"
            options={MESSAGE_TYPES}
            value={inbox.type}
            onChange={inbox.changeType}
            allLabel="All types"
          />
          <MessageOptionSelect
            label="Status"
            options={MESSAGE_STATUSES}
            value={inbox.status}
            onChange={inbox.changeStatus}
            allLabel="All statuses"
          />
          <Button
            variant="outline"
            onClick={() => void inbox.refetch()}
            disabled={inbox.isFetching}
          >
            Refresh
          </Button>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section
            className="min-w-0 space-y-3"
            aria-label="Customer inbox"
            aria-busy={inbox.isFetching}
          >
            {inbox.error && (
              <p role="alert">Could not load customer messages. Please try refreshing.</p>
            )}
            {inbox.isFetching && (
              <p role="status" className="text-sm">
                Loading messages…
              </p>
            )}
            {inbox.data?.total === 0 && (
              <p className="text-sm text-muted-foreground">No messages match these filters.</p>
            )}
            {inbox.data?.items.map((message) => (
              <button
                key={message.id}
                type="button"
                aria-pressed={inbox.selectedId === message.id}
                onClick={() => inbox.setSelectedId(message.id)}
                className="block w-full rounded-lg border p-3 text-left hover:bg-muted focus-visible:outline-2 aria-pressed:border-primary"
              >
                <span className="block break-all text-xs text-muted-foreground">
                  {message.reference}
                </span>
                <span className="mt-1 block font-medium">{message.name}</span>
                <span className="block text-sm capitalize">
                  {message.type} · {messageLabel(message.status)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatDateTime(message.createdAt)}
                </span>
              </button>
            ))}
            {inbox.data && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {inbox.data.total} messages · Page {inbox.page}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inbox.page <= 1 || inbox.isFetching}
                    onClick={() => inbox.setPage(inbox.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inbox.page * 25 >= inbox.data.total || inbox.isFetching}
                    onClick={() => inbox.setPage(inbox.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </section>
          {inbox.selectedId ? (
            <CustomerMessageDetail key={inbox.selectedId} id={inbox.selectedId} />
          ) : (
            <p className="rounded-lg border p-4 text-sm text-muted-foreground">
              Select a message to view its details and handling history.
            </p>
          )}
        </div>
      </div>
    </ScrollableWrapper>
  );
}
