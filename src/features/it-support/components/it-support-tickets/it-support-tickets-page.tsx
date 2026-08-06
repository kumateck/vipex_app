import { useMemo, useState } from 'react';
import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/select-searchable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { useAuthStore } from '@/stores/auth-store';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useListItSupportTicketsQuery,
  useUpdateItSupportTicketMutation,
  type ItSupportTicket,
} from '../../api/it-support.api';
import { ItSupportTicketEditDialog } from './it-support-ticket-edit-dialog';

const STATUSES = ['open', 'in_progress', 'pending_user', 'resolved', 'closed'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const STATUS_TRANSITIONS: Record<string, string[]> = {
  open: ['in_progress', 'pending_user', 'resolved', 'closed'],
  in_progress: ['pending_user', 'resolved', 'closed'],
  pending_user: ['in_progress', 'resolved', 'closed'],
  resolved: ['in_progress', 'pending_user', 'closed'],
  closed: ['open'],
};

function prettyValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_progress':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'pending_user':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'resolved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'closed':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
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
  branchId: string;
  locationId: string;
  note: string;
};

export function ItSupportTicketsPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const canManageTickets = (user?.permissions ?? []).includes(
    PermissionKeys.CanUpdateItSupportTickets,
  );
  const canReopenClosedTickets = (user?.permissions ?? []).includes(
    PermissionKeys.CanReopenItSupportTickets,
  );

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');

  const [editRows, setEditRows] = useState<Record<string, RowEditState>>({});
  const [submittingRowId, setSubmittingRowId] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<ItSupportTicket | null>(null);

  const query = useMemo(
    () => ({
      status: filterStatus === 'all' ? undefined : filterStatus,
      priority: filterPriority === 'all' ? undefined : filterPriority,
      assignedToUserId: filterAssignedTo === 'all' ? undefined : filterAssignedTo,
      branchId: filterBranch === 'all' ? undefined : filterBranch,
      locationId: filterLocation === 'all' ? undefined : filterLocation,
    }),
    [filterAssignedTo, filterBranch, filterLocation, filterPriority, filterStatus],
  );

  const { data: tickets = [], isLoading, refetch } = useListItSupportTicketsQuery(query);
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    companyId ? { companyId } : undefined,
    { skip: !companyId },
  );
  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    companyId ? { companyId } : undefined,
    { skip: !companyId },
  );
  const [updateTicket] = useUpdateItSupportTicketMutation();

  const getRowState = (ticket: ItSupportTicket): RowEditState => {
    const existing = editRows[ticket.id];
    if (existing) return existing;
    return {
      status: ticket.status,
      priority: ticket.priority,
      assignedToUserId: ticket.assignedToUserId ?? '',
      branchId: ticket.branchId ?? '',
      locationId: ticket.locationId ?? '',
      note: '',
    };
  };

  const setRowState = (ticketId: string, patch: Partial<RowEditState>) => {
    setEditRows((prev) => {
      const current = prev[ticketId] ?? {
        status: 'open',
        priority: 'medium',
        assignedToUserId: '',
        branchId: '',
        locationId: '',
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
        branchId: row.branchId.trim() || null,
        locationId: row.locationId.trim() || null,
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
    return (
      userOptions.find((option) => option.id === userId)?.fullname ??
      userOptions.find((option) => option.id === userId)?.email ??
      'Unknown user'
    );
  };
  const getBranchLabel = (branchId?: string | null) => {
    if (!branchId) return '-';
    return branchOptions.find((option) => option.id === branchId)?.name ?? 'Unknown branch';
  };
  const getLocationLabel = (locationId?: string | null) => {
    if (!locationId) return '-';
    return locationOptions.find((option) => option.id === locationId)?.name ?? 'Unknown location';
  };

  const getAllowedStatuses = (ticket: ItSupportTicket) => {
    const current = ticket.status;
    const nextStatuses = STATUS_TRANSITIONS[current] ?? [];
    const candidates = [current, ...nextStatuses];
    if (current === 'closed' && !canReopenClosedTickets) {
      return ['closed'];
    }
    return candidates.filter((status) => STATUSES.includes(status as (typeof STATUSES)[number]));
  };
  const filteredLocationOptions =
    filterBranch === 'all'
      ? locationOptions
      : locationOptions.filter((option) => option.branchId === filterBranch);

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
            <div className="grid gap-3 md:grid-cols-6">
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
              <Select
                value={filterBranch}
                onValueChange={(value) => {
                  setFilterBranch(value);
                  setFilterLocation('all');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branchOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {filteredLocationOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
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
                  <TableHead>Branch</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10}>Loading IT support tickets...</TableCell>
                  </TableRow>
                ) : tickets.length ? (
                  tickets.map((ticket) => {
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{ticket.subject}</p>
                            {ticket.description ? (
                              <p
                                className="text-xs text-muted-foreground whitespace-pre-wrap break-words overflow-hidden"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
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
                          <Badge variant="outline" className={statusBadgeClass(ticket.status)}>
                            {prettyValue(ticket.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prettyValue(ticket.priority)}</Badge>
                        </TableCell>
                        <TableCell>{prettyValue(ticket.category)}</TableCell>
                        <TableCell>{getUserLabel(ticket.assignedToUserId)}</TableCell>
                        <TableCell>{getBranchLabel(ticket.branchId)}</TableCell>
                        <TableCell>{getLocationLabel(ticket.locationId)}</TableCell>
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
                          {ticket.createdAt ? formatDateTimeShared(ticket.createdAt) : '-'}
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
                    <TableCell colSpan={10}>No IT support tickets found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ItSupportTicketEditDialog
          editingTicket={editingTicket}
          onEditingTicketChange={setEditingTicket}
          getRowState={getRowState}
          setRowState={setRowState}
          getAllowedStatuses={getAllowedStatuses}
          priorities={PRIORITIES}
          prettyValue={prettyValue}
          userOptions={userOptions}
          branchOptions={branchOptions}
          locationOptions={locationOptions}
          canManageTickets={canManageTickets}
          submittingRowId={submittingRowId}
          onSaveRow={onSaveRow}
        />
      </div>
    </ScrollableWrapper>
  );
}
