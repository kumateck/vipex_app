export type InvoiceA5TemplateProps = {
  bookingCode: string;
  issuedAtLabel: string;
  parcelDetails: string;
  parcelContent?: string | null;
  parcelValueCedis?: number | null;
  receivedByName?: string | null;
  destinationBranchName: string;
  destinationLocationName: string;
  senderName: string;
  senderTelephone: string;
  receiverName: string;
  receiverTelephone: string;
  paymentModeLabel: string;
  totalChargeCedis: number;
  senderPaidCedis: number;
  receiverToPayCedis: number;
  amountPaidCedis: number;
  amountInWords: string;
  tax: {
    vat: number;
    getfund: number;
    nhil: number;
    totalTax: number;
  };
  qrValue: string;
  formatMoney: (amount: number) => string;
};
