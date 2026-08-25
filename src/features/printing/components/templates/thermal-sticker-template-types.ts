export type ThermalStickerOrientation = 'landscape' | 'portrait';

export type ThermalStickerTemplateProps = {
  bookingCode: string;
  issuedAtLabel: string;
  printedByName?: string | null;
  printedByBranchName?: string | null;
  printedByLocationName?: string | null;
  parcelDetails: string;
  parcelContent?: string | null;
  senderName: string;
  senderTelephone: string;
  senderTelephone2?: string | null;
  receiverName: string;
  receiverTelephone: string;
  receiverTelephone2?: string | null;
  destinationBranchName: string;
  destinationLocationName: string;
  toBePaidCedis?: number;
  qrValue: string;
  formatMoney: (amount: number) => string;
  orientation?: ThermalStickerOrientation;
};

export type PreparedThermalStickerTemplateProps = {
  bookingCode: string;
  issuedAtLabel: string;
  printedByName?: string | null;
  printedByBranchName?: string | null;
  printedByLocationName?: string | null;
  senderName: string;
  senderTelephones: string;
  receiverName: string;
  receiverTelephones: string;
  destinationBranchName: string;
  destinationLocationName: string;
  parcelContent?: string | null;
  parcelDetails: string;
  statusLabel: string;
  statusAmountLabel?: string;
  hasToBePaid: boolean;
  qrValue: string;
};
