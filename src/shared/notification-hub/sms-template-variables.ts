export const SMS_LOCATION_VARIABLES = ['location', 'locationName', 'locationPhone'] as const;

export function buildSmsLocationVariables(input: {
  location?: string | null;
  locationPhone?: string | null;
}) {
  return {
    location: input.location ?? '',
    locationName: input.location ?? '',
    locationPhone: input.locationPhone ?? '',
  };
}

export const BULK_SMS_VARIABLES = [
  'senderName',
  'senderPhone',
  'recipientName',
  'recipientPhone',
  'branch',
  ...SMS_LOCATION_VARIABLES,
  'date',
] as const;
