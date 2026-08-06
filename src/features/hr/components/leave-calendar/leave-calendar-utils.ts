const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfWeekMonday(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + diff);
  return result;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function dayDiff(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

export function statusLabel(status: number) {
  if (status === 1) return 'Approved';
  if (status === 2) return 'Rejected';
  if (status === 3) return 'Cancelled';
  return 'Pending';
}

export function swapStatusLabel(status: number) {
  if (status === 1) return 'Pending HR';
  if (status === 2) return 'Approved';
  if (status === 3) return 'Rejected';
  if (status === 4) return 'Cancelled';
  if (status === 5) return 'Executed';
  return 'Pending Peer';
}
