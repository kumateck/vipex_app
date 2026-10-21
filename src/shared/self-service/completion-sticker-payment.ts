type CompletionPayment = {
  chargeCedis: number | string;
  paymentResponsibility: 'SENDER' | 'RECEIVER' | 'SPLIT';
  senderSettlementMode: 'PAY_NOW' | 'CREDIT';
  senderPartialPaymentCedis?: number | string | null;
};

// Completion records no sender payment. A planned split contribution is not a receipt.
export function getSelfServiceStickerPayment(input: CompletionPayment) {
  const charge = Number(input.chargeCedis);
  const receiverToPayCedis =
    input.paymentResponsibility === 'RECEIVER'
      ? charge
      : input.paymentResponsibility === 'SPLIT'
        ? Math.max(charge - Number(input.senderPartialPaymentCedis ?? 0), 0)
        : 0;
  return { receiverToPayCedis } as const;
}
