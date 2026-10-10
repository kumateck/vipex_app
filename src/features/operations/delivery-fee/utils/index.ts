export { getDeliveryFeeInputError } from '@/shared/shipments/delivery-fee';
export const formatDeliveryFee = (feePsw: number) => `GHS ${(feePsw / 100).toFixed(2)}`;
