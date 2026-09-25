import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useSessionDelegates } from '../../hooks/use-session-delegates';

export function SessionDelegatesDialog({
  sessionId,
  open,
  onOpenChange,
}: {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const delegates = useSessionDelegates(sessionId, open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>To-be-paid delegates</DialogTitle>
          <DialogDescription>
            These staff can complete receiver-paid parcels in your active session. Access ends when
            you remove them or close the session.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Select value={delegates.userId} onValueChange={delegates.setUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose staff member" />
            </SelectTrigger>
            <SelectContent>
              {delegates.available.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.fullname} · {person.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => void delegates.add()}
            disabled={!delegates.userId || delegates.assigning}
          >
            Add
          </Button>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {delegates.isLoading ? <p>Loading staff...</p> : null}
          {!delegates.isLoading && !delegates.data?.assigned.length ? (
            <p className="text-sm text-muted-foreground">No delegates assigned.</p>
          ) : null}
          {delegates.data?.assigned.map((person) => (
            <div
              key={person.userId}
              className="flex items-center justify-between gap-2 rounded border p-2"
            >
              <span className="min-w-0 truncate text-sm">{person.fullname}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={delegates.revoking}
                onClick={() => void delegates.remove(person.userId)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
