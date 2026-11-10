import type { PaymentMethod } from '@/db/schemas/enums';

export type ReceiverPaymentInput = {
  companyId: string;
  branchId: string;
  parcelId: string;
  method: PaymentMethod;
  cashierUserId: string;
  confirmedBy: string;
  secondReceiverId?: string | null;
  cardId?: string | null;
  cardNumber?: string | null;
  secondCardId?: string | null;
  secondCardNumber?: string | null;
  amountCedis?: number | string | null;
  storageAmountCedis?: number | string | null;
  receiverOtpVerificationToken?: string;
  receiverOtpTarget?: 'main' | 'second';
  momoTransactionId?: string | null;
  requestSignature?: boolean;
  expectedReceiverId?: string;
  expectedSecondReceiverId?: string | null;
  handoverTarget?: 'main' | 'second';
};
