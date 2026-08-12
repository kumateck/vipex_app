export const PaymentMethod = {
  CASH: 0,
  MTN: 1,
  TELECEL: 2,
  AIRTEL: 3,
  CREDIT: 4,
} as const;

// Mirrors src/db/schemas/enums.ts PaymentResponsibility. Mobile creation records
// responsibility only; the sender cashier completes payment and printing later.
export const PaymentResponsibility = {
  SENDER: 0,
  RECIPIENT: 1,
  SPLIT: 2,
} as const;
