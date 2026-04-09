import { useEffect, useMemo, useState } from 'react';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useListCommunicationMeetingsQuery,
  useListCommunicationThreadsQuery,
} from '../../../api/communication.api';
import type {
  CommunicationEventItem,
  CommunicationEventStatus,
  CommunicationEventType,
  RelativeScheduleBucket,
} from '../types/communication-events.types';
import {
  dateKey,
  eventDate,
  getCalendarGridDates,
  getRelativeScheduleBucket,
  isSameDay,
  toDateOnly,
} from '../utils/communication-events-date';

export function useCommunicationEventsData() {
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeMonth, setActiveMonth] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [fromDate, setFromDate] = useState<string>(() => toDateOnly(new Date()));
  const [toDate, setToDate] = useState<string>('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CommunicationEventType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CommunicationEventStatus>('all');
  const [participantFilterUserIds, setParticipantFilterUserIds] = useState<string[]>([]);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [dismissedReminderEventIds, setDismissedReminderEventIds] = useState<string[]>([]);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);

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

  const userById = useMemo(
    () => new Map(userOptions.map((option) => [option.id, option])),
    [userOptions],
  );

  const events = useMemo<CommunicationEventItem[]>(
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
        const inferredType = inferredTypeRaw.toLowerCase() as CommunicationEventType;
        const status: CommunicationEventStatus =
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
    const buckets: Record<RelativeScheduleBucket, CommunicationEventItem[]> = {
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

  const selectedDayMeetings = useMemo(
    () =>
      filteredEvents.filter(
        (item) => item.startsAtDate && isSameDay(item.startsAtDate, selectedDate),
      ),
    [filteredEvents, selectedDate],
  );

  const groupedSelectedDayMeetings = useMemo(() => {
    const buckets: Record<RelativeScheduleBucket, CommunicationEventItem[]> = {
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
    const map = new Map<string, CommunicationEventItem[]>();
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

  return {
    view,
    setView,
    selectedDate,
    setSelectedDate,
    activeMonth,
    setActiveMonth,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    participantFilterUserIds,
    setParticipantFilterUserIds,
    nowTs,
    dismissedReminderEventIds,
    setDismissedReminderEventIds,
    isDayDialogOpen,
    setIsDayDialogOpen,
    isLoading,
    refetch,
    threads,
    userOptions,
    userById,
    events,
    filteredEvents,
    groupedListEvents,
    selectedDayMeetings,
    groupedSelectedDayMeetings,
    selectedDayTitle,
    eventsByDay,
    monthDays,
    reminderEvents,
  };
}
