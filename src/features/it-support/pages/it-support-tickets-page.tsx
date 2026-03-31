import { useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth-store';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useListItSupportTicketsQuery,
  useUpdateItSupportTicketMutation,
  type ItSupportTicket,
} from '../api/it-support.api';

const STATUSES = ['open', 'in_progress', 'pending_user', 'resolved', 'closed'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

function prettyValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const kb = sizeBytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

type RowEditState = {
  status: string;
  priority: string;
  assignedToUserId: string;
  note: string;
};

export function ItSupportTicketsPage() {
  const user = useAuthStore((state) => state.user);
  const canManageTickets = (user?.permissions ?? []).includes(
    PermissionKeys.CanUpdateItSupportTickets,
  );

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>('all');

  const [editRows, setEditRows] = useState<Record<string, RowEditState>>({});
  const [submittingRowId, setSubmittingRowId] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<ItSupportTicket | null>(null);

  const query = useMemo(
    () => ({
      status: filterStatus === 'all' ? undefined : filterStatus,
      priority: filterPriority === 'all' ? undefined : filterPriority,
      assignedToUserId: filterAssignedTo === 'all' ? undefined : filterAssignedTo,
    }),
    [filterAssignedTo, filterPriority, filterStatus],
  );

  const { data: tickets = [], isLoading, refetch } = useListItSupportTicketsQuery(query);
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const [updateTicket] = useUpdateItSupportTicketMutation();

  const getRowState = (ticket: ItSupportTicket): RowEditState => {
    const existing = editRows[ticket.id];
    if (existing) return existing;
    return {
      status: ticket.status,
      priority: ticket.priority,
      assignedToUserId: ticket.assignedToUserId ?? '',
      note: '',
    };
  };

  const setRowState = (ticketId: string, patch: Partial<RowEditState>) => {
    setEditRows((prev) => {
      const current = prev[ticketId] ?? {
        status: 'open',
        priority: 'medium',
        assignedToUserId: '',
        note: '',
      };
      return { ...prev, [ticketId]: { ...current, ...patch } };
    });
  };

  const onSaveRow = async (ticket: ItSupportTicket) => {
    const row = getRowState(ticket);
    setSubmittingRowId(ticket.id);
    try {
      await updateTicket({
        id: ticket.id,
        status: row.status,
        priority: row.priority,
        assignedToUserId: row.assignedToUserId.trim() || null,
        note: row.note.trim() || null,
      }).unwrap();
      toast.success('Ticket updated');
      setEditRows((prev) => {
        const next = { ...prev };
        delete next[ticket.id];
        return next;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update ticket');
    } finally {
      setSubmittingRowId(null);
    }
  };

  const getUserLabel = (userId?: string | null) => {
    if (!userId) return 'Unassigned';
    return userOptions.find((option) => option.id === userId)?.fullname ?? userId;
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>IT Support Tickets</CardTitle>
            <PermissionGuard permissionKey={PermissionKeys.CanCreateItSupportTickets}>
              <Button asChild>
                <Link to="/it-support/tickets/new">Create ticket</Link>
              </Button>
            </PermissionGuard>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  {STATUSES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {prettyValue(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priority</SelectItem>
                  {PRIORITIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {prettyValue(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAssignedTo} onValueChange={setFilterAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Assigned to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignees</SelectItem>
                  {userOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8}>Loading IT support tickets...</TableCell>
                  </TableRow>
                ) : tickets.length ? (
                  tickets.map((ticket) => {
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{ticket.subject}</p>
                            {ticket.description ? (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {ticket.description}
                              </p>
                            ) : null}
                            <Link
                              to={`/it-support/tickets/${ticket.id}`}
                              className="text-xs underline"
                            >
                              Open details
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{prettyValue(ticket.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prettyValue(ticket.priority)}</Badge>
                        </TableCell>
                        <TableCell>{prettyValue(ticket.category)}</TableCell>
                        <TableCell>{getUserLabel(ticket.assignedToUserId)}</TableCell>
                        <TableCell>
                          {ticket.attachments.length ? (
                            <div className="space-y-1">
                              {ticket.attachments.map((attachment) => (
                                <a
                                  key={attachment.id}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-xs underline"
                                >
                                  {attachment.fileName} ({formatFileSize(attachment.sizeBytes)})
                                </a>
                              ))}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/it-support/tickets/${ticket.id}`}>Open details</Link>
                                </DropdownMenuItem>
                                <PermissionGuard
                                  permissionKey={PermissionKeys.CanUpdateItSupportTickets}
                                >
                                  <DropdownMenuItem onClick={() => setEditingTicket(ticket)}>
                                    Update ticket
                                  </DropdownMenuItem>
                                </PermissionGuard>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8}>No IT support tickets found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog
          open={Boolean(editingTicket)}
          onOpenChange={(open) => !open && setEditingTicket(null)}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Update Ticket</DialogTitle>
            </DialogHeader>
            {editingTicket ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Status</p>
                    <Select
                      value={getRowState(editingTicket).status}
                      onValueChange={(value) => setRowState(editingTicket.id, { status: value })}
                      disabled={!canManageTickets}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {prettyValue(item)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Priority</p>
                    <Select
                      value={getRowState(editingTicket).priority}
                      onValueChange={(value) => setRowState(editingTicket.id, { priority: value })}
                      disabled={!canManageTickets}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {prettyValue(item)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Assigned to</p>
                  <Select
                    value={getRowState(editingTicket).assignedToUserId || '__none__'}
                    onValueChange={(value) =>
                      setRowState(editingTicket.id, {
                        assignedToUserId: value === '__none__' ? '' : value,
                      })
                    }
                    disabled={!canManageTickets}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {userOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.fullname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Update note</p>
                  <Textarea
                    rows={3}
                    value={getRowState(editingTicket).note}
                    onChange={(event) =>
                      setRowState(editingTicket.id, { note: event.target.value })
                    }
                    placeholder="Update note (optional)"
                    disabled={!canManageTickets}
                  />
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTicket(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editingTicket) return;
                  await onSaveRow(editingTicket);
                  setEditingTicket(null);
                }}
                disabled={
                  !editingTicket || submittingRowId === editingTicket.id || !canManageTickets
                }
              >
                {editingTicket && submittingRowId === editingTicket.id
                  ? 'Saving...'
                  : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollableWrapper>
  );
}
