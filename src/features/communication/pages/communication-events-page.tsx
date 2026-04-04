import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  List,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useCreateCommunicationMessageMutation,
  useDeleteCommunicationMessageMutation,
  useListCommunicationMeetingsQuery,
  useListCommunicationThreadsQuery,
  useUpdateCommunicationMessageMutation,
} from '../api/communication.api';

function toDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function eventDate(meeting: { startsAt: string | null; createdAt: string | null }) {
  const raw = meeting.startsAt ?? meeting.createdAt;
  const parsed = raw ? new Date(raw) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthLabel(value: Date) {
  return value.toLocaleDateString([], { month: 'long', year: 'numeric' });
}

type RelativeScheduleBucket = 'today' | 'upcoming' | 'previous';

function getRelativeScheduleBucket(
  startsAtDate: Date | null,
  nowTs: number,
): RelativeScheduleBucket {
  if (!startsAtDate || Number.isNaN(startsAtDate.getTime())) return 'previous';
  const now = new Date(nowTs);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const eventTs = startsAtDate.getTime();
  if (eventTs >= todayStart && eventTs < tomorrowStart) return 'today';
  return eventTs > nowTs ? 'upcoming' : 'previous';
}

function getCalendarGridDates(monthDate: Date) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  const lastOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const end = new Date(lastOfMonth);
  end.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function CommunicationEventsPage() {
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeMonth, setActiveMonth] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [fromDate, setFromDate] = useState<string>(() => toDateOnly(new Date()));
  const [toDate, setToDate] = useState<string>('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'meeting' | 'audio' | 'video'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [participantFilterUserIds, setParticipantFilterUserIds] = useState<string[]>([]);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [dismissedReminderEventIds, setDismissedReminderEventIds] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'meeting' | 'audio' | 'video'>('meeting');
  const [eventLink, setEventLink] = useState('');
  const [eventThreadId, setEventThreadId] = useState('');
  const [eventParticipantUserIds, setEventParticipantUserIds] = useState<string[]>([]);
  const [eventReminderMinutes, setEventReminderMinutes] = useState('15');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartsAt, setEventStartsAt] = useState<Date | undefined>(() => new Date());
  const [editingEventMessageId, setEditingEventMessageId] = useState<string | null>(null);

  const fromIso = fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined;
  const toIso = toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined;

  const {
    data: meetings = [],
    isLoading,
    refetch,
  } = useListCommunicationMeetingsQuery({
    from: fromIso,
    to: toIso,
    limit: 500,
  });
  const { data: threads = [] } = useListCommunicationThreadsQuery();
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const [createMessage, { isLoading: isCreatingEvent }] = useCreateCommunicationMessageMutation();
  const [updateMessage, { isLoading: isUpdatingEvent }] = useUpdateCommunicationMessageMutation();
  const [deleteMessage, { isLoading: isDeletingEvent }] = useDeleteCommunicationMessageMutation();
  const userById = useMemo(
    () => new Map(userOptions.map((option) => [option.id, option])),
    [userOptions],
  );

  const events = useMemo(
    () =>
      meetings.map((meeting) => {
        const metadata =
          meeting.metadataJson &&
          typeof meeting.metadataJson === 'object' &&
          !Array.isArray(meeting.metadataJson)
            ? (meeting.metadataJson as Record<string, unknown>)
            : {};
        const startsAtDate = eventDate(meeting);
        const inferredTypeRaw =
          (typeof metadata.callType === 'string' && metadata.callType) ||
          (typeof metadata.kind === 'string' && metadata.kind) ||
          (typeof metadata.type === 'string' && metadata.type) ||
          'meeting';
        const inferredType = inferredTypeRaw.toLowerCase() as 'meeting' | 'audio' | 'video';
        const status: 'scheduled' | 'completed' =
          startsAtDate && startsAtDate.getTime() < Date.now() ? 'completed' : 'scheduled';
        const senderName =
          userOptions.find((user) => user.id === meeting.senderUserId)?.fullname ??
          userOptions.find((user) => user.id === meeting.senderUserId)?.email ??
          'Unknown';
        const participantUserIds = Array.isArray(metadata.participantUserIds)
          ? (metadata.participantUserIds as unknown[]).filter(
              (value): value is string => typeof value === 'string' && value.trim().length > 0,
            )
          : [];
        const participants = Array.isArray(metadata.participants)
          ? (metadata.participants as unknown[]).filter(
              (value): value is string => typeof value === 'string' && value.trim().length > 0,
            )
          : [];
        const participantNamesFromIds = participantUserIds
          .map(
            (userId) =>
              userById.get(userId)?.fullname ?? userById.get(userId)?.email ?? 'Unknown user',
          )
          .filter(Boolean);
        const resolvedParticipants = participants.length
          ? participants
          : participantNamesFromIds.length
            ? participantNamesFromIds
            : [senderName];
        const reminderMinutesRaw = metadata.reminderMinutes;
        const reminderMinutes =
          typeof reminderMinutesRaw === 'number' && Number.isFinite(reminderMinutesRaw)
            ? Math.max(0, Math.floor(reminderMinutesRaw))
            : 0;
        return {
          ...meeting,
          startsAtDate,
          inferredType,
          status,
          senderName,
          participantUserIds,
          participants: resolvedParticipants,
          reminderMinutes,
        };
      }),
    [meetings, userById, userOptions],
  );

  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          event.title.toLowerCase().includes(q) ||
          (event.threadTitle ?? '').toLowerCase().includes(q) ||
          event.senderName.toLowerCase().includes(q);
        const matchesType = typeFilter === 'all' ? true : event.inferredType === typeFilter;
        const matchesStatus = statusFilter === 'all' ? true : event.status === statusFilter;
        const matchesParticipants = !participantFilterUserIds.length
          ? true
          : participantFilterUserIds.some((selectedId) =>
              event.participantUserIds.includes(selectedId),
            );
        return matchesSearch && matchesType && matchesStatus && matchesParticipants;
      }),
    [events, participantFilterUserIds, search, statusFilter, typeFilter],
  );
  const groupedListEvents = useMemo(() => {
    const buckets: Record<RelativeScheduleBucket, typeof filteredEvents> = {
      today: [],
      upcoming: [],
      previous: [],
    };
    for (const event of filteredEvents) {
      buckets[getRelativeScheduleBucket(event.startsAtDate, nowTs)].push(event);
    }
    buckets.today.sort(
      (a, b) => (a.startsAtDate?.getTime() ?? 0) - (b.startsAtDate?.getTime() ?? 0),
    );
    buckets.upcoming.sort(
      (a, b) => (a.startsAtDate?.getTime() ?? 0) - (b.startsAtDate?.getTime() ?? 0),
    );
    buckets.previous.sort(
      (a, b) => (b.startsAtDate?.getTime() ?? 0) - (a.startsAtDate?.getTime() ?? 0),
    );
    return buckets;
  }, [filteredEvents, nowTs]);

  const meetingsWithDate = useMemo(
    () =>
      filteredEvents
        .map((meeting) => ({ meeting, date: meeting.startsAtDate }))
        .filter(
          (item): item is { meeting: (typeof filteredEvents)[number]; date: Date } =>
            item.date !== null,
        ),
    [filteredEvents],
  );

  const selectedDayMeetings = useMemo(
    () =>
      meetingsWithDate
        .filter((item) => isSameDay(item.date, selectedDate))
        .map((item) => item.meeting),
    [meetingsWithDate, selectedDate],
  );
  const groupedSelectedDayMeetings = useMemo(() => {
    const buckets: Record<RelativeScheduleBucket, typeof selectedDayMeetings> = {
      today: [],
      upcoming: [],
      previous: [],
    };
    for (const meeting of selectedDayMeetings) {
      buckets[getRelativeScheduleBucket(meeting.startsAtDate, nowTs)].push(meeting);
    }
    buckets.today.sort(
      (a, b) => (a.startsAtDate?.getTime() ?? 0) - (b.startsAtDate?.getTime() ?? 0),
    );
    buckets.upcoming.sort(
      (a, b) => (a.startsAtDate?.getTime() ?? 0) - (b.startsAtDate?.getTime() ?? 0),
    );
    buckets.previous.sort(
      (a, b) => (b.startsAtDate?.getTime() ?? 0) - (a.startsAtDate?.getTime() ?? 0),
    );
    return buckets;
  }, [selectedDayMeetings, nowTs]);

  const selectedDayTitle = useMemo(
    () =>
      selectedDate.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [selectedDate],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof filteredEvents>();
    for (const event of filteredEvents) {
      if (!event.startsAtDate) continue;
      const key = dateKey(event.startsAtDate);
      const current = map.get(key) ?? [];
      current.push(event);
      map.set(key, current);
    }
    return map;
  }, [filteredEvents]);

  const monthDays = useMemo(() => getCalendarGridDates(activeMonth), [activeMonth]);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const reminderEvents = useMemo(
    () =>
      filteredEvents.filter((event) => {
        if (!event.startsAtDate || event.reminderMinutes <= 0) return false;
        if (dismissedReminderEventIds.includes(event.messageId)) return false;
        const startMs = event.startsAtDate.getTime();
        const reminderStartMs = startMs - event.reminderMinutes * 60_000;
        return nowTs >= reminderStartMs && nowTs < startMs;
      }),
    [dismissedReminderEventIds, filteredEvents, nowTs],
  );

  const participantDisplay = (event: (typeof filteredEvents)[number]) => {
    const maxVisible = 3;
    const visibleIds = event.participantUserIds.slice(0, maxVisible);
    const extraCount = Math.max(0, event.participantUserIds.length - maxVisible);
    const participantsText = event.participants.join(', ');
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {visibleIds.map((userId) => {
            const option = userById.get(userId);
            const name = option?.fullname || option?.email || 'Unknown user';
            return (
              <Avatar
                key={`${event.messageId}-${userId}`}
                className="h-6 w-6 border border-background"
              >
                <AvatarFallback className="text-[10px] font-semibold">
                  {name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            );
          })}
          {!visibleIds.length ? (
            <Avatar className="h-6 w-6 border border-background">
              <AvatarFallback className="text-[10px] font-semibold">
                {event.senderName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
        <span className="truncate text-sm text-muted-foreground">
          {participantsText}
          {extraCount > 0 ? ` (+${extraCount})` : ''}
        </span>
      </div>
    );
  };

  const renderEventCard = (event: (typeof filteredEvents)[number]) => (
    <div key={event.messageId} className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted font-semibold">
            {event.senderName.slice(0, 1).toUpperCase()}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {event.inferredType === 'meeting' ? 'Meeting' : event.inferredType}
              </Badge>
              <Badge variant={event.status === 'completed' ? 'secondary' : 'default'}>
                {event.status === 'completed' ? 'Completed' : 'Scheduled'}
              </Badge>
            </div>
            <p className="text-2xl font-semibold leading-none">{event.title}</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {event.startsAtDate ? event.startsAtDate.toLocaleDateString() : '-'}
              </p>
              <p className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {event.startsAtDate
                  ? event.startsAtDate.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </p>
              <div className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                {participantDisplay(event)}
              </div>
              <p className="inline-flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Reminder: {event.reminderMinutes ? `${event.reminderMinutes} min before` : 'Off'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.link ? (
            <a href={event.link} target="_blank" rel="noreferrer" className="text-xs underline">
              Join
            </a>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => openEditDialog(event)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => void onDeleteEvent(event)}
            disabled={isDeletingEvent}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );

  const openCreateDialog = (presetDate?: Date) => {
    const baseDate = presetDate ?? selectedDate ?? new Date();
    setEventStartsAt(baseDate);
    if (!eventThreadId && threads[0]?.id) {
      setEventThreadId(threads[0].id);
    }
    setEditingEventMessageId(null);
    setEventReminderMinutes('15');
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (event: (typeof filteredEvents)[number]) => {
    const metadata =
      event.metadataJson &&
      typeof event.metadataJson === 'object' &&
      !Array.isArray(event.metadataJson)
        ? (event.metadataJson as Record<string, unknown>)
        : {};
    const participants = Array.isArray(metadata.participants)
      ? (metadata.participants as unknown[]).filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
    const participantUserIds = Array.isArray(metadata.participantUserIds)
      ? (metadata.participantUserIds as unknown[]).filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
    const participantIdsFromNames = participants
      .map(
        (participant) =>
          userOptions.find((user) => user.fullname === participant || user.email === participant)
            ?.id,
      )
      .filter((value): value is string => Boolean(value));
    const mergedParticipantIds = Array.from(
      new Set([...participantUserIds, ...participantIdsFromNames]),
    );

    setEditingEventMessageId(event.messageId);
    setEventTitle(event.title);
    setEventType(
      event.inferredType === 'audio' || event.inferredType === 'video'
        ? event.inferredType
        : 'meeting',
    );
    setEventLink(event.link ?? '');
    setEventThreadId(event.threadId);
    setEventParticipantUserIds(mergedParticipantIds);
    setEventReminderMinutes(
      typeof metadata.reminderMinutes === 'number' && Number.isFinite(metadata.reminderMinutes)
        ? String(metadata.reminderMinutes)
        : '15',
    );
    setEventDescription(event.body ?? '');
    setEventStartsAt(event.startsAtDate ?? new Date());
    setIsCreateDialogOpen(true);
  };

  const onDeleteEvent = async (event: (typeof filteredEvents)[number]) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteMessage({ id: event.messageId, threadId: event.threadId }).unwrap();
      toast.success('Event deleted');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete event.');
    }
  };

  const submitCreateEvent = async () => {
    const threadId = eventThreadId.trim();
    if (!threadId) {
      return;
    }
    if (!eventTitle.trim()) {
      return;
    }
    if (!eventParticipantUserIds.length) {
      toast.error('Select at least one participant.');
      return;
    }
    if (eventStartsAt && eventStartsAt.getTime() < Date.now()) {
      toast.error('Event time must be now or in the future.');
      return;
    }

    const startsAtIso = eventStartsAt ? eventStartsAt.toISOString() : null;
    const reminderMinutes = Number(eventReminderMinutes);
    const participants = eventParticipantUserIds
      .map(
        (userId) => userById.get(userId)?.fullname ?? userById.get(userId)?.email ?? 'Unknown user',
      )
      .filter(Boolean);

    const payload = {
      threadId,
      body: eventDescription.trim() || null,
      metadataJson: {
        title: eventTitle.trim(),
        kind: eventType,
        callType: eventType,
        link: eventLink.trim() || null,
        startsAt: startsAtIso,
        reminderMinutes: Number.isFinite(reminderMinutes) ? Math.max(0, reminderMinutes) : 0,
        participantUserIds: eventParticipantUserIds,
        participants,
      },
    };

    if (editingEventMessageId) {
      await updateMessage({
        id: editingEventMessageId,
        ...payload,
      }).unwrap();
      toast.success('Event updated');
    } else {
      await createMessage({
        ...payload,
        messageType: 'meeting',
      }).unwrap();
      toast.success('Event created');
    }

    setIsCreateDialogOpen(false);
    setEditingEventMessageId(null);
    setEventTitle('');
    setEventType('meeting');
    setEventLink('');
    setEventParticipantUserIds([]);
    setEventReminderMinutes('15');
    setEventDescription('');
    await refetch();
  };

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Events Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Manage your meetings, calls, and other scheduled events with alarms.
            </p>
            <Button variant="outline" size="icon" className="mt-3 h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="relative">
              <Bell className="mr-2 h-4 w-4" />
              Reminders
              {reminderEvents.length ? (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {reminderEvents.length}
                </span>
              ) : null}
            </Button>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </div>
        </div>

        {reminderEvents.length ? (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reminder Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reminderEvents.slice(0, 5).map((event) => (
                <div
                  key={`reminder-${event.messageId}`}
                  className="flex items-center justify-between gap-2 rounded-md border bg-background/70 p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Starts at{' '}
                      {event.startsAtDate
                        ? event.startsAtDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                      {' • '}
                      reminder {event.reminderMinutes}m before
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDismissedReminderEventIds((prev) => [...prev, event.messageId])
                      }
                    >
                      Dismiss
                    </Button>
                    <Link
                      className="text-xs underline"
                      to={`/communication/chat/${event.threadId}`}
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Filter by participants</p>
          <MultiSelect
            options={userOptions}
            value={participantFilterUserIds}
            onValueChange={setParticipantFilterUserIds}
            getLabel={(option) => option.fullname || option.email || 'Unknown user'}
            getValue={(option) => option.id}
            placeholder="All participants"
            searchPlaceholder="Search users..."
            emptyMessage="No users found."
          />
        </div>

        <Tabs
          value={view}
          onValueChange={(value) => setView(value as 'list' | 'calendar')}
          className="space-y-4"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>{monthLabel(activeMonth)}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-7 gap-2 text-center text-sm text-muted-foreground">
                  {weekdays.map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {monthDays.map((day) => {
                    const dayEvents = eventsByDay.get(dateKey(day)) ?? [];
                    const isCurrentMonth = day.getMonth() === activeMonth.getMonth();
                    const isSelected = isSameDay(day, selectedDate);
                    return (
                      <button
                        key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day);
                          setIsDayDialogOpen(true);
                        }}
                        className={`min-h-24 rounded-lg border p-2 text-left transition-colors ${
                          isSelected ? 'border-primary ring-1 ring-primary/60' : 'border-border'
                        } ${isCurrentMonth ? 'bg-card' : 'bg-muted/20 text-muted-foreground'}`}
                      >
                        <p className="text-sm font-medium">{day.getDate()}</p>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.messageId}
                              className={`truncate rounded px-2 py-0.5 text-[11px] ${
                                event.inferredType === 'meeting'
                                  ? 'bg-orange-500/20 text-orange-300'
                                  : 'bg-violet-500/20 text-violet-300'
                              }`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 ? (
                            <p className="text-[10px] text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Events on {selectedDate.toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDayMeetings.length ? (
                  selectedDayMeetings.map((meeting) => (
                    <div key={meeting.messageId} className="rounded-lg border p-3">
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {meeting.threadTitle || 'Untitled thread'}
                      </p>
                      <div className="mt-2 flex gap-2 text-xs">
                        <Link className="underline" to={`/communication/chat/${meeting.threadId}`}>
                          Open thread
                        </Link>
                        {meeting.link ? (
                          <a
                            href={meeting.link}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            Join meeting
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No events on this day.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Events Calendar</CardTitle>
                <div className="grid gap-2 sm:grid-cols-2">
                  <DatePicker
                    date={fromDate ? new Date(`${fromDate}T00:00:00`) : undefined}
                    onDateChange={(date) => setFromDate(date ? toDateOnly(date) : '')}
                    placeholder="From date"
                  />
                  <DatePicker
                    date={toDate ? new Date(`${toDate}T00:00:00`) : undefined}
                    onDateChange={(date) => setToDate(date ? toDateOnly(date) : '')}
                    placeholder="To date"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading events...</p>
                ) : filteredEvents.length ? (
                  (
                    [
                      ['today', 'Today'],
                      ['upcoming', 'Upcoming'],
                      ['previous', 'Previous'],
                    ] as const
                  ).map(([bucket, title]) => (
                    <div key={bucket} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {title}
                      </p>
                      <div className="space-y-3">
                        {groupedListEvents[bucket].length ? (
                          groupedListEvents[bucket].map((event) => renderEventCard(event))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No {title.toLowerCase()} events.
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No events found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDayDialogOpen} onOpenChange={setIsDayDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedDayTitle}</DialogTitle>
              <DialogDescription>
                {selectedDayMeetings.length
                  ? `${selectedDayMeetings.length} event${selectedDayMeetings.length > 1 ? 's' : ''} scheduled`
                  : 'No events found'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {selectedDayMeetings.length ? (
                (
                  [
                    ['today', 'Today'],
                    ['upcoming', 'Upcoming'],
                    ['previous', 'Previous'],
                  ] as const
                ).map(([bucket, title]) => (
                  <div key={bucket} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {title}
                    </p>
                    <div className="space-y-3">
                      {groupedSelectedDayMeetings[bucket].length ? (
                        groupedSelectedDayMeetings[bucket].map((event) => (
                          <div key={event.messageId} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline">
                                    {(event.inferredType === 'meeting'
                                      ? 'Meeting'
                                      : event.inferredType
                                    ).toUpperCase()}
                                  </Badge>
                                  <Badge
                                    variant={event.status === 'completed' ? 'secondary' : 'default'}
                                  >
                                    {event.status === 'completed' ? 'Completed' : 'Pending'}
                                  </Badge>
                                </div>
                                <p className="text-xl font-semibold">{event.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Time:{' '}
                                  {event.startsAtDate
                                    ? event.startsAtDate.toLocaleTimeString([], {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      })
                                    : '-'}
                                </p>
                                <div className="text-sm text-muted-foreground">
                                  <span className="mr-1">Participants:</span>
                                  {participantDisplay(event)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Reminder:{' '}
                                  {event.reminderMinutes
                                    ? `${event.reminderMinutes} min before`
                                    : 'Off'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Thread: {event.threadTitle || 'Untitled thread'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9"
                                  onClick={() => openEditDialog(event)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9"
                                  onClick={() => void onDeleteEvent(event)}
                                  disabled={isDeletingEvent}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No {title.toLowerCase()} events.
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border p-8 text-center">
                  <p className="text-muted-foreground">No events found</p>
                  <Button className="mt-4" onClick={() => openCreateDialog(selectedDate)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => openCreateDialog(selectedDate)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEventMessageId ? 'Edit Event' : 'Create Event'}</DialogTitle>
              <DialogDescription>
                Create a meeting/call event and publish it into a thread.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Event title"
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
                className="sm:col-span-2"
              />
              <Select
                value={eventType}
                onValueChange={(value) => setEventType(value as typeof eventType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
              <DateTimePicker
                value={eventStartsAt}
                onChange={setEventStartsAt}
                placeholder="Select event start date and time"
                minDateTime={new Date()}
              />
              <Select value={eventThreadId} onValueChange={setEventThreadId}>
                <SelectTrigger className="sm:col-span-2">
                  <SelectValue placeholder="Select thread" />
                </SelectTrigger>
                <SelectContent>
                  {threads.map((thread) => (
                    <SelectItem key={thread.id} value={thread.id}>
                      {thread.title || 'Untitled thread'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Meeting link (optional)"
                value={eventLink}
                onChange={(event) => setEventLink(event.target.value)}
                className="sm:col-span-2"
              />
              <div className="space-y-2 sm:col-span-2">
                <p className="text-sm font-medium">Participants</p>
                <MultiSelect
                  options={userOptions}
                  value={eventParticipantUserIds}
                  onValueChange={setEventParticipantUserIds}
                  getLabel={(option) => option.fullname || option.email || 'Unknown user'}
                  getValue={(option) => option.id}
                  placeholder="Select participants"
                  searchPlaceholder="Search users..."
                  emptyMessage="No users found."
                />
                <p className="text-xs text-muted-foreground">
                  {eventParticipantUserIds.length} participant
                  {eventParticipantUserIds.length === 1 ? '' : 's'} selected
                </p>
              </div>
              <Select value={eventReminderMinutes} onValueChange={setEventReminderMinutes}>
                <SelectTrigger className="sm:col-span-2">
                  <SelectValue placeholder="Reminder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No reminder</SelectItem>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="10">10 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Description (optional)"
                value={eventDescription}
                onChange={(event) => setEventDescription(event.target.value)}
                className="sm:col-span-2"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void submitCreateEvent()}
                disabled={
                  !eventThreadId ||
                  !eventTitle.trim() ||
                  !eventParticipantUserIds.length ||
                  isCreatingEvent ||
                  isUpdatingEvent
                }
              >
                {editingEventMessageId
                  ? isUpdatingEvent
                    ? 'Updating...'
                    : 'Save Changes'
                  : isCreatingEvent
                    ? 'Creating...'
                    : 'Create Event'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollableWrapper>
  );
}
