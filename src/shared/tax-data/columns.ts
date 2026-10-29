export const TAX_AMOUNT_COLUMNS = [
  ['paidPrincipalPsw', 'Principal paid'],
  ['netPsw', 'Net price'],
  ['getfundPsw', 'GETFund'],
  ['nhilPsw', 'NHIL'],
  ['covidPsw', 'COVID'],
  ['vatPsw', 'VAT'],
  ['otherTaxPsw', 'Other tax'],
  ['taxTotalPsw', 'Total tax'],
] as const;
export const TAX_EXPORT_COLUMNS = [
  ['bookingCode', 'Invoice', 'text'],
  ['trackingCode', 'Tracking code', 'text'],
  ['bookedOn', 'Booking date', 'text'],
  ['sourceBranchName', 'Source branch', 'text'],
  ['destinationBranchName', 'Destination branch', 'text'],
  ['senderName', 'Sender', 'text'],
  ['senderTelephone', 'Sender telephone', 'text'],
  ['receiverName', 'Receiver', 'text'],
  ['receiverTelephone', 'Receiver telephone', 'text'],
  ['parcelContent', 'Content', 'text'],
  ['parcelDetails', 'Details', 'text'],
  ['parcelValuePsw', 'Parcel value GHS', 'money'],
  ...TAX_AMOUNT_COLUMNS.map(([key, label]) => [key, `${label} GHS`, 'money'] as const),
  ['paymentCount', 'Principal payments', 'number'],
  ['confirmed', 'Tax confirmed', 'boolean'],
] as const;

const identityKeys = new Set<string>(['bookingCode', 'trackingCode', 'bookedOn']);
const taxKeys = new Set<string>(TAX_AMOUNT_COLUMNS.map(([key]) => key));
export const TAX_TABLE_COLUMNS = [
  ...TAX_EXPORT_COLUMNS.filter(([key]) => identityKeys.has(key)),
  ...TAX_EXPORT_COLUMNS.filter(([key]) => taxKeys.has(key)),
  ...TAX_EXPORT_COLUMNS.filter(([key]) => !identityKeys.has(key) && !taxKeys.has(key)),
];
