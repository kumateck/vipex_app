export type CommunicationCallStatus = 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled';

const ALLOWED_NEXT_STATUSES: Readonly<
  Record<CommunicationCallStatus, ReadonlyArray<CommunicationCallStatus>>
> = Object.freeze({
  pending: ['ringing', 'active', 'ended', 'cancelled'],
  ringing: ['active', 'ended', 'cancelled'],
  active: ['ended', 'cancelled'],
  ended: [],
  cancelled: [],
});

export function normalizeCommunicationCallStatus(value: string): CommunicationCallStatus | null {
  if (value === 'pending') return 'pending';
  if (value === 'ringing') return 'ringing';
  if (value === 'active') return 'active';
  if (value === 'ended') return 'ended';
  if (value === 'cancelled') return 'cancelled';
  return null;
}

export function canTransitionCommunicationCallStatus(
  fromStatus: string,
  toStatus: CommunicationCallStatus,
): boolean {
  if (fromStatus === toStatus) return true;
  const normalizedFrom = normalizeCommunicationCallStatus(fromStatus);
  if (!normalizedFrom) return false;
  return ALLOWED_NEXT_STATUSES[normalizedFrom].includes(toStatus);
}
