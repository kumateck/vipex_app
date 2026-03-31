import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useCreateItSupportTicketNoteMutation,
  useGetItSupportTicketQuery,
  useListItSupportTicketEventsQuery,
  type ItSupportTicketEvent,
} from '../api/it-support.api';

function prettyValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function eventTitle(event: ItSupportTicketEvent) {
  if (event.eventType === 'internal_note') return 'Internal note added';
  if (event.eventType === 'ticket_created') return 'Ticket created';
  if (event.eventType === 'ticket_updated') return 'Ticket updated';
  return prettyValue(event.eventType);
}

export function ItSupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState('');
  const user = useAuthStore((state) => state.user);

  const {
    data: ticket,
    isLoading: isLoadingTicket,
    refetch: refetchTicket,
  } = useGetItSupportTicketQuery(id ?? '', { skip: !id });
  const {
    data: events = [],
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useListItSupportTicketEventsQuery(id ?? '', { skip: !id });

  const [createNote, { isLoading: isCreatingNote }] = useCreateItSupportTicketNoteMutation();

  if (!id) return <div className="p-4">Ticket not found.</div>;

  const onSubmitNote = async () => {
    const value = note.trim();
    if (!value) {
      toast.error('Note is required');
      return;
    }

    try {
      await createNote({ id, note: value }).unwrap();
      setNote('');
      toast.success('Internal note added');
      await Promise.all([refetchEvents(), refetchTicket()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add internal note');
    }
  };

  if (isLoadingTicket || !ticket) {
    return <div className="p-4">Loading IT support ticket...</div>;
  }

  const canManageTickets = (user?.permissions ?? []).includes(
    PermissionKeys.CanUpdateItSupportTickets,
  );
  const canAddComment = canManageTickets || ticket.assignedToUserId === user?.id;

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">Ticket ID: {ticket.id}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/it-support/tickets">Back to tickets</Link>
        </Button>
      </div>

      <ScrollableWrapper>
        <div className="space-y-4 pb-2">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">{prettyValue(ticket.status)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Priority</p>
                <p className="font-medium">{prettyValue(ticket.priority)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{prettyValue(ticket.category)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned To</p>
                <p className="font-medium">{ticket.assignedToUserId ?? '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="font-medium whitespace-pre-wrap">{ticket.description ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">
                  {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="font-medium">
                  {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '-'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Attachments</p>
                {ticket.attachments.length ? (
                  <div className="space-y-1">
                    {ticket.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm underline"
                      >
                        {attachment.fileName}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium">-</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline & Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canAddComment ? (
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    placeholder="Add comment"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={onSubmitNote} disabled={isCreatingNote}>
                      {isCreatingNote ? 'Saving...' : 'Add comment'}
                    </Button>
                    <Button variant="outline" onClick={() => setNote('')} disabled={isCreatingNote}>
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Comments can be added by assigned personnel.
                </p>
              )}

              <div className="space-y-3">
                {isLoadingEvents ? (
                  <p className="text-sm text-muted-foreground">Loading timeline...</p>
                ) : events.length ? (
                  events.map((event) => (
                    <div key={event.id} className="rounded-md border p-3 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{eventTitle(event)}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}
                        </p>
                      </div>

                      {event.fromStatus || event.toStatus ? (
                        <p className="text-xs text-muted-foreground">
                          {event.fromStatus ? prettyValue(event.fromStatus) : '-'} {'->'}{' '}
                          {event.toStatus ? prettyValue(event.toStatus) : '-'}
                        </p>
                      ) : null}

                      {event.eventNote ? (
                        <p className="text-sm whitespace-pre-wrap">{event.eventNote}</p>
                      ) : null}

                      <p className="text-xs text-muted-foreground">
                        By: {event.performedByUserName ?? event.performedBy ?? 'System'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No timeline entries yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>
    </div>
  );
}
