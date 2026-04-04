// utils/date.ts

import { format, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const DEFAULT_TIMEZONE = 'Africa/Accra';

// -----------------------------
// Core Format (Your Standard)
// -----------------------------
export const formatDateTime = (date: Date | string) => {
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
};

// -----------------------------
// With Timezone Control
// -----------------------------
export const formatDateTimeTZ = (date: Date | string, timezone: string = DEFAULT_TIMEZONE) => {
  return formatInTimeZone(date, timezone, 'dd MMM yyyy, HH:mm');
};

// -----------------------------
// Date Only
// -----------------------------
export const formatDate = (date: Date | string) => {
  return format(new Date(date), 'dd MMM yyyy');
};

// -----------------------------
// Time Only
// -----------------------------
export const formatTime = (date: Date | string) => {
  return format(new Date(date), 'HH:mm');
};

// -----------------------------
// Relative Time (UX)
// -----------------------------
export const formatRelative = (date: Date | string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// -----------------------------
// Tooltip Format (Full detail)
// -----------------------------
export const formatFull = (date: Date | string) => {
  return format(new Date(date), 'dd MMM yyyy, HH:mm:ss');
};

// -----------------------------
// ISO Safe (for backend / sorting)
// -----------------------------
export const toISO = (date: Date | string) => {
  return new Date(date).toISOString();
};
