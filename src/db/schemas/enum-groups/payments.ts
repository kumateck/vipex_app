export enum Payer {
  SENDER = 0,
  RECIPIENT = 1,
}

export enum CashierType {
  SENDING = 0, // SENDER pays at cashier for sending a parcel
  TOBEPAID = 1, // RECIPIENT pays at cashier when picking up a parcel (if sender chose recipient to pay)
  DELIVERY = 2, // RECIPIENT pays at cashier for home delivery (if sender chose recipient to pay and requested home delivery)
  FULL = 3, // Cashier that does both sending and receiving payments (e.g. for walk-in customers or when payer type is not specified)
}

export enum PaymentMethod {
  CASH = 0,
  MTN = 1,
  TELECEL = 2,
  AIRTEL = 3,
  CREDIT = 4,
}

export enum PaymentComponent {
  PRINCIPAL = 0, // taxable per Ghana scheme
  DELIVERY_FEE = 1, // NOT taxable per your rule
  OTHER = 2,
}

export enum DeliveryMode {
  OFFICE = 0,
  DOORSTEP = 1,
}

export enum PaymentResponsibility {
  SENDER = 0,
  RECIPIENT = 1,
  SPLIT = 2,
}

export enum ReceiptType {
  PAYMENT = 0,
  TRACKING_STICKER = 1,
}

export enum SplitPaymentType {
  PERCENTAGE = 0,
  FIXED = 1,
  WEIGHTED = 2,
}
