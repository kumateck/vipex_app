export type ChangeParcelDestinationInput = {
  parcelId: string;
  destinationId: string;
  pickupLocationId: string | null;
  expectedDestinationId: string;
  expectedPickupLocationId: string | null;
  reason: string;
};

export type DestinationChangeParcel = {
  id: string;
  bookingCode: string;
  isDeleted: boolean;
};
