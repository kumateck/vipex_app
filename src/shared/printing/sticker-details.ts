export const STICKER_COMPLAINTS_LINE = 'Complaints: +233 27 501 9133';

export function formatStickerDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '-';
  const parts = new Map(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Accra',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.get('day')} ${parts.get('month')} ${parts.get('year')} ${parts.get('hour')}:${parts.get('minute')}`;
}
