import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BellDot,
  ChevronDown,
  ChevronRight,
  Hash,
  MessageSquareText,
  Mic,
  MicOff,
  PhoneCall,
  Users2,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
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
} from '@/components/ui/select-searchable';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useJoinVoiceChannelMutation,
  useMarkCommunicationChannelReadMutation,
  useListCommunicationCallsQuery,
  useListCommunicationChannelUnreadCountsQuery,
  useListCommunicationChannelsQuery,
  useListCommunicationUnreadCountsQuery,
  useListCommunicationPresenceQuery,
  useListCommunicationThreadsQuery,
  useSetCommunicationPresenceMutation,
  type CommunicationCallSession,
  type CommunicationChannel,
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

function SectionHeader({
  title,
  icon,
  isOpen,
  onToggle,
}: {
  title: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/40"
    >
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </span>
      {isOpen ? (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

function ThreadListItem({
  thread,
  onClick,
  icon,
  isActive,
  unreadCount,
  mentionCount,
}: {
  thread: CommunicationThread;
  onClick: () => void;
  icon: 'dm' | 'group';
  isActive: boolean;
  unreadCount: number;
  mentionCount: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border p-2.5 text-left transition-colors ${
        isActive
          ? 'border-primary/50 bg-primary/10'
          : 'border-transparent bg-muted/20 hover:border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-content-center rounded-md bg-background text-muted-foreground">
            {icon === 'dm' ? (
              <MessageSquareText className="h-4 w-4" />
            ) : (
              <Users2 className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{thread.title || 'Untitled thread'}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(thread.lastMessageAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {mentionCount > 0 ? <Badge variant="destructive">@{mentionCount}</Badge> : null}
          {unreadCount > 0 ? <Badge variant="default">{unreadCount}</Badge> : null}
          <Badge variant="outline">{thread.participantCount ?? 0}</Badge>
        </div>
      </div>
    </button>
  );
}

function ChannelListItem({
  channel,
  onOpen,
  isActive,
  unreadCount,
  mentionCount,
}: {
  channel: CommunicationChannel;
  onOpen: () => void;
  isActive: boolean;
  unreadCount: number;
  mentionCount: number;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-md border p-2.5 text-left transition-colors ${
        isActive
          ? 'border-primary/50 bg-primary/10'
          : 'border-transparent bg-muted/20 hover:border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-content-center rounded-md bg-background text-muted-foreground">
            <Hash className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{channel.name}</p>
            <p className="text-xs text-muted-foreground">{prettyValue(channel.visibility)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {mentionCount > 0 ? <Badge variant="destructive">@{mentionCount}</Badge> : null}
          {unreadCount > 0 ? <Badge variant="default">{unreadCount}</Badge> : null}
          <Badge variant="outline">{channel.participantCount}</Badge>
        </div>
      </div>
    </button>
  );
}

function VoiceChannelListItem({
  channel,
  activeCall,
  participantCount,
  participants,
  isJoining,
  isActive,
  unreadCount,
  mentionCount,
  onJoin,
}: {
  channel: CommunicationChannel;
  activeCall: CommunicationCallSession | null;
  participantCount: number;
  participants: Array<{ label: string; isMuted: boolean; isVideoOff: boolean }>;
  isJoining: boolean;
  isActive: boolean;
  unreadCount: number;
  mentionCount: number;
  onJoin: () => void;
}) {
  return (
    <div
      className={`rounded-md border p-2.5 transition-colors ${
        isActive
          ? 'border-primary/50 bg-primary/10'
          : 'border-transparent bg-muted/20 hover:border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-content-center rounded-md bg-background text-muted-foreground">
            <Volume2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{channel.name}</p>
            <p className="text-xs text-muted-foreground">
              {prettyValue(channel.visibility)} voice{activeCall ? ' • Live' : ' • Idle'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {mentionCount > 0 ? <Badge variant="destructive">@{mentionCount}</Badge> : null}
          {unreadCount > 0 ? <Badge variant="default">{unreadCount}</Badge> : null}
          <Badge variant={activeCall ? 'default' : 'outline'}>{participantCount}</Badge>
        </div>
      </div>
      {participants.length ? (
        <>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {participants.map((participant) => participant.label).join(', ')}
            {participantCount > participants.length
              ? ` +${participantCount - participants.length} more`
              : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {participants.map((participant) => (
              <span
                key={participant.label}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {participant.isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {participant.isVideoOff ? (
                  <VideoOff className="h-3 w-3" />
                ) : (
                  <Video className="h-3 w-3" />
                )}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">No one connected</p>
      )}
      <div className="mt-2">
        <Button size="sm" className="w-full" onClick={onJoin} disabled={isJoining}>
          <PhoneCall className="mr-1 h-4 w-4" />
          {isJoining ? 'Joining...' : 'Join Voice'}
        </Button>
      </div>
    </div>
  );
}

export function CommunicationChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [threadTypeFilter, setThreadTypeFilter] = useState<ThreadTypeFilter>('all');
  const [presenceStatus, setPresenceStatus] = useState<'online' | 'away' | 'busy' | 'offline'>(
    'online',
  );
  const [presenceRows, setPresenceRows] = useState<CommunicationPresence[]>([]);
  const [callParticipantsByCallId, setCallParticipantsByCallId] = useState<
    Record<
      string,
      {
        participants: Array<{ userId: string; isMuted: boolean; isVideoOff: boolean }>;
      }
    >
  >({});
  const [joiningVoiceChannelId, setJoiningVoiceChannelId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
    dms: true,
    groups: true,
    text: true,
    voice: true,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

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
  const {
    data: textChannels = [],
    isLoading: isLoadingTextChannels,
    refetch: refetchTextChannels,
  } = useListCommunicationChannelsQuery({ channelType: 'text' });
  const {
    data: voiceChannels = [],
    isLoading: isLoadingVoiceChannels,
    refetch: refetchVoiceChannels,
  } = useListCommunicationChannelsQuery({ channelType: 'voice' });
  const { data: activeCalls = [], refetch: refetchCalls } = useListCommunicationCallsQuery({
    status: 'active',
  });
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const { data: unreadCounts = [], refetch: refetchUnreadCounts } =
    useListCommunicationUnreadCountsQuery();
  const { data: voiceUnreadCounts = [], refetch: refetchVoiceUnreadCounts } =
    useListCommunicationChannelUnreadCountsQuery({
      channelType: 'voice',
    });
  const { data: presenceList } = useListCommunicationPresenceQuery();
  const [setPresenceRequest] = useSetCommunicationPresenceMutation();
  const [joinVoiceChannel] = useJoinVoiceChannelMutation();
  const [markChannelRead] = useMarkCommunicationChannelReadMutation();

  const userLabelById = useMemo(
    () =>
      new Map(
        userOptions.map((option) => [option.id, option.fullname || option.email || option.id]),
      ),
    [userOptions],
  );

  const {
    isConnected: isSocketConnected,
    setPresence,
    requestCallParticipants,
  } = useCommunicationSocket({
    onThreadCreated: () => {
      refetchThreads();
      refetchUnreadCounts();
    },
    onMessageCreated: () => {
      refetchThreads();
      refetchUnreadCounts();
    },
    onCallCreated: () => {
      refetchCalls();
      refetchVoiceUnreadCounts();
    },
    onCallUpdated: () => {
      refetchCalls();
      refetchVoiceUnreadCounts();
    },
    onCallParticipantsUpdated: ({ callId, participants }) => {
      setCallParticipantsByCallId((prev) => ({
        ...prev,
        [callId]: {
          participants: participants.map((item) => ({
            userId: item.userId,
            isMuted: item.isMuted,
            isVideoOff: item.isVideoOff,
          })),
        },
      }));
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

  useEffect(() => {
    if (!isSocketConnected || !activeCalls.length) return;
    for (const call of activeCalls) {
      requestCallParticipants(call.id);
    }
  }, [activeCalls, isSocketConnected, requestCallParticipants]);

  const directThreads = useMemo(
    () => threads.filter((thread) => thread.threadType === 'direct'),
    [threads],
  );

  const textChannelThreadIds = useMemo(() => {
    const ids = textChannels
      .map((channel) => channel.threadId)
      .filter((id): id is string => Boolean(id));
    return new Set(ids);
  }, [textChannels]);

  const groupThreads = useMemo(
    () =>
      threads.filter(
        (thread) =>
          thread.threadType === 'group' ||
          (thread.threadType === 'channel' && !textChannelThreadIds.has(thread.id)),
      ),
    [textChannelThreadIds, threads],
  );

  const activeCallByChannelId = useMemo(() => {
    const map = new Map<string, CommunicationCallSession>();
    for (const call of activeCalls) {
      if (!call.channelId) continue;
      const existing = map.get(call.channelId);
      const existingTime = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const currentTime = call.updatedAt ? new Date(call.updatedAt).getTime() : 0;
      if (!existing || currentTime >= existingTime) {
        map.set(call.channelId, call);
      }
    }
    return map;
  }, [activeCalls]);

  const selectedThreadId = useMemo(() => {
    const match = location.pathname.match(/\/communication\/chat\/([^/]+)/);
    return match?.[1] ?? null;
  }, [location.pathname]);
  const selectedCallId = useMemo(() => {
    const match = location.pathname.match(/\/communication\/calls\/([^/]+)/);
    return match?.[1] ?? null;
  }, [location.pathname]);

  const unreadByThreadId = useMemo(
    () => new Map(unreadCounts.map((item) => [item.threadId, item.unreadCount])),
    [unreadCounts],
  );
  const mentionsByThreadId = useMemo(
    () => new Map(unreadCounts.map((item) => [item.threadId, item.mentionCount])),
    [unreadCounts],
  );
  const voiceUnreadByChannelId = useMemo(
    () => new Map(voiceUnreadCounts.map((item) => [item.channelId, item.unreadCount])),
    [voiceUnreadCounts],
  );
  const voiceMentionsByChannelId = useMemo(
    () => new Map(voiceUnreadCounts.map((item) => [item.channelId, item.mentionCount])),
    [voiceUnreadCounts],
  );

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

  const onJoinVoiceChannel = async (channel: CommunicationChannel) => {
    setJoiningVoiceChannelId(channel.id);
    try {
      const joined = await joinVoiceChannel({ channelId: channel.id }).unwrap();
      await markChannelRead({ id: channel.id }).unwrap();
      navigate(`/communication/calls/${joined.call.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join voice channel.');
    } finally {
      setJoiningVoiceChannelId(null);
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Team Chat</h1>
            <p className="text-sm text-muted-foreground">
              Team chat orientation using the existing app appearance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isSocketConnected ? 'default' : 'outline'}>
              {isSocketConnected ? 'Socket live' : 'Socket offline'}
            </Badge>
            <Button
              variant="outline"
              onClick={() => {
                refetchThreads();
                refetchTextChannels();
                refetchVoiceChannels();
                refetchCalls();
                refetchVoiceUnreadCounts();
              }}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[60px_370px_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardContent className="flex flex-col items-center gap-2 p-2">
              <button
                type="button"
                onClick={() => navigate('/communication/chat')}
                className="grid h-10 w-10 place-content-center rounded-xl bg-primary/90 text-xs font-semibold text-primary-foreground"
                title="Workspace"
              >
                VC
              </button>
              <button
                type="button"
                onClick={() => navigate('/communication/chat/create')}
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
                <Button size="sm" onClick={() => navigate('/communication/chat/create')}>
                  New
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

          <Card>
            <CardHeader>
              <CardTitle>Conversation View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="space-y-2">
                <SectionHeader
                  title="DMs"
                  icon={<MessageSquareText className="h-3.5 w-3.5" />}
                  isOpen={openSections.dms}
                  onToggle={() => toggleSection('dms')}
                />
                {openSections.dms ? (
                  isLoadingThreads ? (
                    <p className="text-sm text-muted-foreground">Loading direct chats...</p>
                  ) : directThreads.length ? (
                    directThreads.map((thread) => (
                      <ThreadListItem
                        key={thread.id}
                        thread={thread}
                        icon="dm"
                        isActive={selectedThreadId === thread.id}
                        unreadCount={
                          selectedThreadId === thread.id
                            ? 0
                            : (unreadByThreadId.get(thread.id) ?? 0)
                        }
                        mentionCount={
                          selectedThreadId === thread.id
                            ? 0
                            : (mentionsByThreadId.get(thread.id) ?? 0)
                        }
                        onClick={() => navigate(`/communication/chat/${thread.id}`)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No direct chats yet.</p>
                  )
                ) : null}
              </div>

              <div className="space-y-2">
                <SectionHeader
                  title="Groups"
                  icon={<Users2 className="h-3.5 w-3.5" />}
                  isOpen={openSections.groups}
                  onToggle={() => toggleSection('groups')}
                />
                {openSections.groups ? (
                  isLoadingThreads ? (
                    <p className="text-sm text-muted-foreground">Loading groups...</p>
                  ) : groupThreads.length ? (
                    groupThreads.map((thread) => (
                      <ThreadListItem
                        key={thread.id}
                        thread={thread}
                        icon="group"
                        isActive={selectedThreadId === thread.id}
                        unreadCount={
                          selectedThreadId === thread.id
                            ? 0
                            : (unreadByThreadId.get(thread.id) ?? 0)
                        }
                        mentionCount={
                          selectedThreadId === thread.id
                            ? 0
                            : (mentionsByThreadId.get(thread.id) ?? 0)
                        }
                        onClick={() => navigate(`/communication/chat/${thread.id}`)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No groups yet.</p>
                  )
                ) : null}
              </div>

              <div className="space-y-2">
                <SectionHeader
                  title="Text Channels"
                  icon={<Hash className="h-3.5 w-3.5" />}
                  isOpen={openSections.text}
                  onToggle={() => toggleSection('text')}
                />
                {openSections.text ? (
                  isLoadingTextChannels ? (
                    <p className="text-sm text-muted-foreground">Loading text channels...</p>
                  ) : textChannels.length ? (
                    textChannels.map((channel) => (
                      <ChannelListItem
                        key={channel.id}
                        channel={channel}
                        isActive={Boolean(
                          channel.threadId && selectedThreadId === channel.threadId,
                        )}
                        unreadCount={
                          channel.threadId && selectedThreadId !== channel.threadId
                            ? (unreadByThreadId.get(channel.threadId) ?? 0)
                            : 0
                        }
                        mentionCount={
                          channel.threadId && selectedThreadId !== channel.threadId
                            ? (mentionsByThreadId.get(channel.threadId) ?? 0)
                            : 0
                        }
                        onOpen={() => {
                          if (!channel.threadId) return;
                          navigate(`/communication/chat/${channel.threadId}`);
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No text channels yet.</p>
                  )
                ) : null}
              </div>

              <div className="space-y-2">
                <SectionHeader
                  title="Voice Channels"
                  icon={<Volume2 className="h-3.5 w-3.5" />}
                  isOpen={openSections.voice}
                  onToggle={() => toggleSection('voice')}
                />
                {openSections.voice ? (
                  isLoadingVoiceChannels ? (
                    <p className="text-sm text-muted-foreground">Loading voice channels...</p>
                  ) : voiceChannels.length ? (
                    voiceChannels.map((channel) => {
                      const activeCall = activeCallByChannelId.get(channel.id) ?? null;
                      const participantInfo = activeCall
                        ? callParticipantsByCallId[activeCall.id]
                        : undefined;
                      const participantCount = participantInfo?.participants.length ?? 0;
                      const participants = (participantInfo?.participants ?? [])
                        .slice(0, 3)
                        .map((participant) => ({
                          label: userLabelById.get(participant.userId) ?? participant.userId,
                          isMuted: participant.isMuted,
                          isVideoOff: participant.isVideoOff,
                        }));
                      return (
                        <VoiceChannelListItem
                          key={channel.id}
                          channel={channel}
                          activeCall={activeCall}
                          participantCount={participantCount}
                          participants={participants}
                          isJoining={joiningVoiceChannelId === channel.id}
                          isActive={Boolean(activeCall && selectedCallId === activeCall.id)}
                          unreadCount={
                            activeCall && selectedCallId === activeCall.id
                              ? 0
                              : (voiceUnreadByChannelId.get(channel.id) ?? 0)
                          }
                          mentionCount={
                            activeCall && selectedCallId === activeCall.id
                              ? 0
                              : (voiceMentionsByChannelId.get(channel.id) ?? 0)
                          }
                          onJoin={() => void onJoinVoiceChannel(channel)}
                        />
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No voice channels yet.</p>
                  )
                ) : null}
              </div>

              <p>
                Pick a DM, group, or text channel from the list above to open conversation detail.
              </p>
              <p>
                Voice channels are always available. Click{' '}
                <span className="font-medium text-foreground">Join Voice</span> to enter instantly.
              </p>
              {selectedThreadId ? (
                <p>
                  Current thread:{' '}
                  <span className="font-medium text-foreground">{selectedThreadId}</span>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollableWrapper>
  );
}
