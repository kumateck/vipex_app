export type AssignedDeliveryAction = 'delivered' | 'returned';

export type DeliveryHandoverInput = {
  signatureImage: string;
  principalAmountCedis: number;
  deliveryFeeAmountCedis: number;
  secondReceiverId?: string;
  handoverTarget: 'main' | 'second';
};

export type ActiveDeliveryAction = {
  parcelId: string;
  type: AssignedDeliveryAction;
} | null;
