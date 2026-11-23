import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';

export type EditableParcelInformation = Pick<
  ParcelFullDetails['parcel'],
  'id' | 'sourceId' | 'destinationId' | 'receiverId' | 'bookingCode' | 'parcelDetails' | 'isDeleted'
> & {
  receiverName: string | null;
  receiverAvailable: boolean;
};

export type ParcelInformationValues = {
  parcelDetails: string;
  receiverName: string;
};

export type ParcelInformationActionProps = {
  details: ParcelFullDetails;
  row: ParcelSearchRow | null;
  onSaved: () => void;
};
