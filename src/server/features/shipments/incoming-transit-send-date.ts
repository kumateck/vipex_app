import { BadRequest } from '../../utils/http-error';

export function incomingTransitSendDateBounds(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw BadRequest('Send date must be YYYY-MM-DD');
  const start = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== value) {
    throw BadRequest('Send date is not a valid calendar date');
  }
  return { start, end: new Date(start.getTime() + 86_400_000) };
}
