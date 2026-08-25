export type AssignedDeliveryAction = 'delivered' | 'returned';

export type DeliveryHandoverInput = {
  signatureImage: string;
  principalAmountCedis: number;
  deliveryFeeAmountCedis: number;
};

export type ActiveDeliveryAction = {
  parcelId: string;
  type: AssignedDeliveryAction;
} | null;
