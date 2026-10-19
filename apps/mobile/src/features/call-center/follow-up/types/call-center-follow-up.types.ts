export type ContactOutcome = 'follow_up' | 'pickup' | 'delivery';

export type CallCenterQueueMode = 'assigned' | 'addresses';

export type SaveCallOutcomeInput = {
  parcelId: string;
  outcome: ContactOutcome;
  sendSms: boolean;
  sendEmail: boolean;
  existingSecondReceiverId: string | null;
  secondReceiver: { fullname: string; telephone: string } | null;
};
