export type RiderAssignmentSocketPayload = {
  riderUserId: string;
  parcelIds: string[];
  assignedAt: string;
};

export type RiderAssignmentSignal = RiderAssignmentSocketPayload & {
  source: 'socket' | 'poll' | 'mutation';
};
