import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import type { BranchOption } from '@/features/branches/api/branches.api';
import type { LocationOption } from '@/features/locations/api/locations.api';
import type { UserOption } from '@/features/users/api/users.api';
import type { ItSupportTicket } from '../../api/it-support.api';

type RowState = {
  status: string;
  priority: string;
  assignedToUserId: string;
  branchId: string;
  locationId: string;
  note: string;
};

type RowStatePatch = Partial<RowState>;

type ItSupportTicketEditDialogProps = {
  editingTicket: ItSupportTicket | null;
  onEditingTicketChange: (ticket: ItSupportTicket | null) => void;
  getRowState: (ticket: ItSupportTicket) => RowState;
  setRowState: (ticketId: string, patch: RowStatePatch) => void;
  getAllowedStatuses: (ticket: ItSupportTicket) => string[];
  priorities: readonly string[];
  prettyValue: (value: string) => string;
  userOptions: UserOption[];
  branchOptions: BranchOption[];
  locationOptions: LocationOption[];
  canManageTickets: boolean;
  submittingRowId: string | null;
  onSaveRow: (ticket: ItSupportTicket) => Promise<void>;
};

export function ItSupportTicketEditDialog({
  editingTicket,
  onEditingTicketChange,
  getRowState,
  setRowState,
  getAllowedStatuses,
  priorities,
  prettyValue,
  userOptions,
  branchOptions,
  locationOptions,
  canManageTickets,
  submittingRowId,
  onSaveRow,
}: ItSupportTicketEditDialogProps) {
  const rowState = editingTicket ? getRowState(editingTicket) : null;

  return (
    <Dialog
      open={Boolean(editingTicket)}
      onOpenChange={(open) => !open && onEditingTicketChange(null)}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Ticket</DialogTitle>
        </DialogHeader>
        {editingTicket && rowState ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <Select
                  value={rowState.status}
                  onValueChange={(value) => setRowState(editingTicket.id, { status: value })}
                  disabled={!canManageTickets}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllowedStatuses(editingTicket).map((item) => (
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
                  value={rowState.priority}
                  onValueChange={(value) => setRowState(editingTicket.id, { priority: value })}
                  disabled={!canManageTickets}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((item) => (
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
                value={rowState.assignedToUserId || '__none__'}
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
              <p className="text-sm font-medium">Branch</p>
              <Select
                value={rowState.branchId || '__none__'}
                onValueChange={(value) =>
                  setRowState(editingTicket.id, {
                    branchId: value === '__none__' ? '' : value,
                    locationId: '',
                  })
                }
                disabled={!canManageTickets}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No branch</SelectItem>
                  {branchOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Location</p>
              <Select
                value={rowState.locationId || '__none__'}
                onValueChange={(value) =>
                  setRowState(editingTicket.id, {
                    locationId: value === '__none__' ? '' : value,
                  })
                }
                disabled={!canManageTickets}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No location</SelectItem>
                  {locationOptions
                    .filter((option) => {
                      const selectedBranchId = rowState.branchId;
                      return selectedBranchId ? option.branchId === selectedBranchId : true;
                    })
                    .map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Update note</p>
              <Textarea
                rows={3}
                value={rowState.note}
                onChange={(event) => setRowState(editingTicket.id, { note: event.target.value })}
                placeholder="Update note (optional)"
                disabled={!canManageTickets}
              />
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onEditingTicketChange(null)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!editingTicket) return;
              await onSaveRow(editingTicket);
              onEditingTicketChange(null);
            }}
            disabled={!editingTicket || submittingRowId === editingTicket?.id || !canManageTickets}
          >
            {editingTicket && submittingRowId === editingTicket.id ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
