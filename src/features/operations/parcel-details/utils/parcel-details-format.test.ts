import { describe, expect, test } from 'bun:test';
import type { ParcelHistoryEvent } from '../types';
import { groupHistoryByDay, joinPhones, personName } from './parcel-details-format';

const event = (id: string, occurredAt: string): ParcelHistoryEvent => ({
  id,
  occurredAt,
  category: 'status',
  title: id,
  description: null,
  actorName: null,
  branchName: null,
});

describe('parcel details formatting', () => {
  test('groups history by day with the newest day first, keeping time order inside a day', () => {
    const groups = groupHistoryByDay([
      event('booked', '2026-09-29T16:44:00'),
      event('assigned', '2026-10-06T09:34:00'),
      event('delivered', '2026-10-06T22:41:00'),
    ]);
    expect(groups.map((group) => group.items.map((item) => item.id))).toEqual([
      ['assigned', 'delivered'],
      ['booked'],
    ]);
  });

  test('shows a dash for missing people and phones, and flags unresolved users', () => {
    expect(personName({ u1: 'HAGAR ODURO' }, 'u1')).toBe('HAGAR ODURO');
    expect(personName({}, 'u2')).toBe('Unknown user');
    expect(personName({}, null)).toBe('-');
    expect(joinPhones('024', null, '055')).toBe('024 / 055');
    expect(joinPhones(null)).toBe('-');
  });
});
