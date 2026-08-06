import type { RelativeScheduleBucket } from '../types/communication-events.types';

export function toDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function eventDate(meeting: { startsAt: string | null; createdAt: string | null }) {
  const raw = meeting.startsAt ?? meeting.createdAt;
  const parsed = raw ? new Date(raw) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monthLabel(value: Date) {
  return value.toLocaleDateString([], { month: 'long', year: 'numeric' });
}

export function getRelativeScheduleBucket(
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

export function getCalendarGridDates(monthDate: Date) {
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
