// Shared smallint-backed enums used in schema and app
export enum BranchType {
  HEADOFFICE = 0,
  AGENCY = 1,
}
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

export enum UserType {
  STAFF = 0,
  CASHIER = 1,
  RIDER = 2,
}
// Inventory enums
export enum StockMovementType {
  RECEIPT = 0,
  ISSUE = 1,
  ADJUSTMENT = 2,
  TRANSFER_OUT = 3,
  TRANSFER_IN = 4,
}

export enum StockAdjustmentReason {
  DAMAGE = 0,
  LOSS = 1,
  FOUND = 2,
  RECOUNT = 3,
  EXPIRED = 4,
  OTHER = 5,
}

export enum TransferStatus {
  PENDING = 0,
  IN_TRANSIT = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

export enum UnitOfMeasure {
  PIECE = 0,
  BOX = 1,
  CARTON = 2,
  KG = 3,
  LITER = 4,
  METER = 5,
  PACK = 6,
  DOZEN = 7,
}

export enum PaymentResponsibility {
  SENDER = 0,
  RECIPIENT = 1,
  SPLIT = 2,
}

export enum PendingBookingStatus {
  PENDING = 0,
  CONFIRMED = 1,
  CANCELLED = 2,
  EXPIRED = 3,
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
export enum IdentificationType {
  PASSPORT = 0,
  DRIVER_LICENSE = 1,
  NHIS_CARD = 2,
  VOTERS_ID_CARD = 3,
  BIOMETRIC_SSNIT_CARD = 4,
  NATIONAL_IDENTIFICATION_CARD = 5,
  STUDENT_ID = 6,
  ECOWAS_IDENTITY_CARD = 7,
  NO_ID = 8,
}
export enum ParcelStatus {
  CREATED = 0, // Parcel info recorded by agent
  PROCESSED = 1, // Cashier processed payment / confirmed shipment
  IN_TRANSIT = 2, // Parcel on intercity transport
  ARRIVED_AT_DESTINATION = 3, // Parcel arrived at destination city/branch
  CUSTOMER_CONTACTED = 4, // Customer contacted for info or collection
  AWAITING_PICKUP = 5, // Parcel ready for customer pickup at branch
  DELIVERED_BY_OFFICE = 6, // Parcel handed over to customer at office/branch
  HOME_DELIVERY_REQUESTED = 7, // Customer requested home delivery
  ADDRESS_COLLECTED = 8, // Delivery address collected by agent
  DISPATCHED = 9, // Parcel dispatched to delivery agent
  RIDER_GIVEN_PARCEL_TO_CUSTOMER = 10, //  Rider successfully delivered parcel to customer and got confirmation (e.g. photo, OTP, signature)
  DELIVERED_AT_HOME = 11, // Parcel delivered to customer's home
  RETURNED_TO_OFFICE = 12, // Parcel returned to branch office
  RETURNED_TO_SENDER = 13, // Parcel returned to sender/source
  CANCELLED = 14, // Parcel order cancelled
}
export enum DeliveryFeeBasis {
  DISTANCE = 0,
  WEIGHT = 1,
  VALUE = 2,
  FIXED = 3,
}

export enum ConsignmentStatus {
  PREPARING = 0,
  READY = 1,
  IN_TRANSIT = 2,
  DELIVERED = 3,
  CANCELLED = 4,
  DELAYED = 5,
}

export enum AutoGroupingMode {
  BY_DESTINATION = 0,
  BY_WEIGHT = 1,
  BY_VALUE = 2,
  BY_SCHEDULE = 3,
  NONE = 4,
}
