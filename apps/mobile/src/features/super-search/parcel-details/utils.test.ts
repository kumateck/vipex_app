import { describe, expect, test } from 'bun:test';
import { groupHistoryByDay, joinPhones, personName } from './utils';

describe('mobile parcel details helpers', () => {
  test('groups history newest day first and newest entry first within a day', () => {
    const groups = groupHistoryByDay([
      { id: 'booked', occurredAt: '2026-09-29T16:44:00' },
      { id: 'assigned', occurredAt: '2026-10-06T09:34:00' },
      { id: 'delivered', occurredAt: '2026-10-06T22:41:00' },
    ]);
    expect(groups.map((group) => group.items.map((item) => item.id))).toEqual([
      ['delivered', 'assigned'],
      ['booked'],
    ]);
  });

  test('names people from the details map, flagging ids that no longer resolve', () => {
    expect(personName({ u1: 'HAGAR ODURO' }, 'u1')).toBe('HAGAR ODURO');
    expect(personName({}, 'gone')).toBe('Unknown user');
    expect(personName(undefined, null)).toBe('-');
  });

  test('joins available phones and shows a dash when none exist', () => {
    expect(joinPhones('0244', undefined, '0555')).toBe('0244 / 0555');
    expect(joinPhones(null, undefined)).toBe('-');
  });
});
