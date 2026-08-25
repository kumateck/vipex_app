export const formatDeliveryChangeMoney = (amountPsw: number | null | undefined) =>
  `GHS ${((amountPsw ?? 0) / 100).toFixed(2)}`;
