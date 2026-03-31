import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
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
} from '@/components/ui/select';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useListCommunicationPresenceQuery,
  useListCommunicationThreadsQuery,
  useSetCommunicationPresenceMutation,
  type CommunicationPresence,
  type CommunicationThread,
} from '../api/communication.api';
import { useCommunicationSocket } from '../hooks/use-communication-socket';

const THREAD_TYPES = ['all', 'direct', 'group', 'channel'] as const;
type ThreadTypeFilter = (typeof THREAD_TYPES)[number];
type ThreadTypeCreate = Exclude<ThreadTypeFilter, 'all'>;

function prettyValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
}

function ThreadListItem({ thread, onClick }: { thread: CommunicationThread; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">{thread.title || 'Untitled thread'}</p>
          <p className="text-xs text-muted-foreground">{prettyValue(thread.threadType)}</p>
        </div>
        <Badge variant="outline">{thread.participantCount ?? 0}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Last activity: {formatDateTime(thread.lastMessageAt)}
      </p>
    </button>
  );
}

export function CommunicationChatPage() {
  const navigate = useNavigate();
  const [threadTypeFilter, setThreadTypeFilter] = useState<ThreadTypeFilter>('all');
  const [presenceStatus, setPresenceStatus] = useState<'online' | 'away' | 'busy' | 'offline'>(
    'online',
  );
  const [presenceRows, setPresenceRows] = useState<CommunicationPresence[]>([]);

  const threadQueryParams = useMemo(
    () =>
      threadTypeFilter === 'all'
        ? undefined
        : ({ threadType: threadTypeFilter } as { threadType: ThreadTypeCreate }),
    [threadTypeFilter],
  );

  const {
    data: threads = [],
    isLoading: isLoadingThreads,
    refetch: refetchThreads,
  } = useListCommunicationThreadsQuery(threadQueryParams);
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const { data: presenceList } = useListCommunicationPresenceQuery();
  const [setPresenceRequest] = useSetCommunicationPresenceMutation();

  const { isConnected: isSocketConnected, setPresence } = useCommunicationSocket({
    onThreadCreated: () => {
      refetchThreads();
    },
    onPresenceUpdated: (payload) => {
      setPresenceRows((prev) => {
        const index = prev.findIndex((item) => item.userId === payload.userId);
        if (index < 0) return [payload, ...prev];
        const next = [...prev];
        next[index] = payload;
        return next;
      });
    },
  });

  useEffect(() => {
    if (!presenceList) return;
    setPresenceRows(presenceList);
  }, [presenceList]);

  useEffect(() => {
    if (!isSocketConnected) return;
    setPresence(presenceStatus);
  }, [isSocketConnected, presenceStatus, setPresence]);

  const onChangePresence = async (value: string) => {
    const nextStatus = (
      ['online', 'away', 'busy', 'offline'].includes(value) ? value : 'online'
    ) as 'online' | 'away' | 'busy' | 'offline';
    setPresenceStatus(nextStatus);
    setPresence(nextStatus);
    try {
      await setPresenceRequest({ status: nextStatus }).unwrap();
    } catch {
      // Socket path still keeps live UX if REST call fails.
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Team Chat</h1>
            <p className="text-sm text-muted-foreground">
              Browse threads and open a conversation page to chat.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isSocketConnected ? 'default' : 'outline'}>
              {isSocketConnected ? 'Socket live' : 'Socket offline'}
            </Badge>
            <Button variant="outline" onClick={() => refetchThreads()}>
              Refresh threads
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Threads</CardTitle>
                <Button size="sm" onClick={() => navigate('/communication/chat/create')}>
                  Create Thread
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Thread type</FieldLabel>
                <Select
                  value={threadTypeFilter}
                  onValueChange={(value) => setThreadTypeFilter(value as ThreadTypeFilter)}
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
                      const userLabel =
                        userOptions.find((item) => item.id === row.userId)?.fullname ?? row.userId;
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

              <div className="space-y-2">
                {isLoadingThreads ? (
                  <p className="text-sm text-muted-foreground">Loading threads...</p>
                ) : threads.length ? (
                  threads.map((thread) => (
                    <ThreadListItem
                      key={thread.id}
                      thread={thread}
                      onClick={() => navigate(`/communication/chat/${thread.id}`)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No threads yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Select any thread from the sidebar to open its full chat page.</p>
              <p>
                Use <span className="font-medium text-foreground">Create Thread</span> at the
                top-right of the sidebar to open the dedicated thread creation page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollableWrapper>
  );
}
