export type DeliveryFeeContext = {
  parcelId: string;
  bookingCode: string;
  chargePsw: number;
  paidFeePsw: number;
  riderCollectedFeePsw: number;
  updatedAt: string;
};
export type DeliveryFeeEditButtonProps = {
  parcelId: string;
  bookingCode: string;
  disabled?: boolean;
};
