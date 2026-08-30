export function buildCampaignTemplateValues(input: {
  senderName?: string | null;
  senderPhone?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  branch?: string | null;
  location?: string | null;
  date?: Date;
}) {
  return {
    senderName: input.senderName ?? '',
    senderPhone: input.senderPhone ?? '',
    recipientName: input.recipientName ?? '',
    recipientPhone: input.recipientPhone ?? '',
    branch: input.branch ?? '',
    location: input.location ?? '',
    date: (input.date ?? new Date()).toISOString().slice(0, 10),
  };
}
