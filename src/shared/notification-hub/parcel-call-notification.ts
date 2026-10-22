export type ParcelCallNotificationFailure = {
  channel: 'sms' | 'email';
  recipientType: 'receiver' | 'second_receiver';
  message: string;
};

export type ParcelCallNotificationSummary = {
  sentCount: number;
  failedCount: number;
  // Optional so clients still handle servers that return only counts.
  failures?: readonly ParcelCallNotificationFailure[];
};
