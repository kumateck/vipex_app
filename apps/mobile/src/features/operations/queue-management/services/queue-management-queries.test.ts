import { describe, expect, test } from 'bun:test';
import { buildQueueBoardQueries } from './queue-management-queries';

describe('mobile queue board queries', () => {
  test('limits both receiver and sender boards to the current day', () => {
    expect(buildQueueBoardQueries('branch-1', { receiver: true, sender: true })).toEqual([
      { branchId: 'branch-1', paymentBucket: 'TP', todayOnly: true },
      { branchId: 'branch-1', paymentBucket: 'SP', todayOnly: true },
    ]);
  });

  test('omits boards the user cannot access', () => {
    expect(buildQueueBoardQueries('branch-1', { receiver: false, sender: true })).toEqual([
      null,
      { branchId: 'branch-1', paymentBucket: 'SP', todayOnly: true },
    ]);
  });
});
