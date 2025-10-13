// Shared smallint-backed enums used in schema and app

export enum Payer {
  SENDER = 0,
  RECIPIENT = 1,
}

export enum CashierType {
  SENDING = 0,
  TOBEPAID = 1,
  DELIVERY = 2,
}

export enum PaymentMethod {
  CASH = 0,
  MTN = 1,
  TELECEL = 2,
  AIRTEL = 3,
}

// What the payment covers (for tax and reporting separation)
export enum PaymentComponent {
  PRINCIPAL = 0, // taxable per Ghana scheme
  DELIVERY_FEE = 1, // NOT taxable per your rule
  OTHER = 2,
}

export enum DeliveryMode {
  OFFICE = 0,
  DOORSTEP = 1,
}

export enum UserStatus {
  ACTIVE = 0,
  INVITED = 1,
  REMOVED = 2,
  BLOCKED = 3,
  INACTIVE = 4,
  SUSPENDED = 5,
  PENDING = 6,
}
