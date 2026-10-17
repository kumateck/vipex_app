import { and, gte, lt, type Column } from 'drizzle-orm';
import { BadRequest } from '../../utils/http-error';

export function incomingTransitSendDateBounds(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw BadRequest('Send date must be YYYY-MM-DD');
  const start = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== value) {
    throw BadRequest('Send date is not a valid calendar date');
  }
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

/**
 * Condition matching `column` on the selected send date. Typed comparisons let the column
 * serialize the Date bounds; a raw `sql` fragment would hand the driver a Date it rejects.
 */
export function incomingTransitSendDateCondition(column: Column, value: string) {
  const { start, end } = incomingTransitSendDateBounds(value);
  return and(gte(column, start), lt(column, end));
}
