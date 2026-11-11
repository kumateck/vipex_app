type QueueBoardQuery = {
  branchId: string;
  paymentBucket: 'TP' | 'SP';
  todayOnly: true;
};

export function buildQueueBoardQueries(
  branchId: string,
  access: { receiver: boolean; sender: boolean },
): [QueueBoardQuery | null, QueueBoardQuery | null] {
  return [
    access.receiver ? { branchId, paymentBucket: 'TP', todayOnly: true } : null,
    access.sender ? { branchId, paymentBucket: 'SP', todayOnly: true } : null,
  ];
}
