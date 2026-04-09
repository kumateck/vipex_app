import { BellDot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { CommunicationPresence } from '../../../api/communication.api';
import {
  THREAD_TYPES,
  type PresenceStatus,
  type ThreadTypeFilter,
} from '../types/communication-chat.types';
import { prettyValue } from '../utils/communication-chat-format';

type CommunicationChatWorkspacePanelProps = {
  threadTypeFilter: ThreadTypeFilter;
  onThreadTypeFilterChange: (value: ThreadTypeFilter) => void;
  presenceStatus: PresenceStatus;
  onChangePresence: (value: string) => void;
  presenceRows: CommunicationPresence[];
  userLabelById: Map<string, string>;
  onOpenWorkspace: () => void;
  onOpenCreate: () => void;
};
export function CommunicationChatWorkspacePanel({
  threadTypeFilter,
  onThreadTypeFilterChange,
  presenceStatus,
  onChangePresence,
  presenceRows,
  userLabelById,
  onOpenWorkspace,
  onOpenCreate,
}: CommunicationChatWorkspacePanelProps) {
  return (
    <>
      <Card className="h-fit">
        <CardContent className="flex flex-col items-center gap-2 p-2">
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="grid h-10 w-10 place-content-center rounded-xl bg-primary/90 text-xs font-semibold text-primary-foreground"
            title="Workspace"
          >
            VC
          </button>
          <button
            type="button"
            onClick={onOpenCreate}
            className="grid h-10 w-10 place-content-center rounded-xl border bg-background text-muted-foreground transition-colors hover:bg-muted/40"
            title="Create"
          >
            <BellDot className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Workspace</CardTitle>
            <Button size="sm" onClick={onOpenCreate}>
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel>Thread type</FieldLabel>
            <Select
              value={threadTypeFilter}
              onValueChange={(value) => onThreadTypeFilterChange(value as ThreadTypeFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All thread types" />
              </SelectTrigger>
              <SelectContent>
                {THREAD_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {prettyValue(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>My presence</FieldLabel>
            <Select value={presenceStatus} onValueChange={onChangePresence}>
              <SelectTrigger>
                <SelectValue placeholder="Presence status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="rounded-md border bg-muted/20 p-2 text-xs">
            <p className="mb-2 font-medium">Presence</p>
            <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
              {presenceRows.length ? (
                presenceRows.map((row) => {
                  const userLabel = userLabelById.get(row.userId) ?? row.userId;
                  return (
                    <div key={row.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{userLabel}</span>
                      <Badge variant="outline">{prettyValue(row.status)}</Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground">No presence records.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
