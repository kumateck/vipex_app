export type SmsType = 'otp';

export function buildMnotifySmsPayload(input: {
  recipient: string;
  sender: string;
  message: string;
  smsType?: SmsType;
}) {
  return {
    recipient: [input.recipient],
    sender: input.sender,
    message: input.message,
    is_schedule: 'false',
    schedule_date: '',
    ...(input.smsType ? { sms_type: input.smsType } : {}),
  };
}
