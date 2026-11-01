export enum ParcelHolderType {
  BRANCH = 0,
  LOCATION = 1,
  WAREHOUSE = 2,
}

export enum ParcelInternalTransferStatus {
  PENDING = 0,
  ACKNOWLEDGED = 1,
  CANCELLED = 2,
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
  RETURNED_TO_OFFICE = 12, // Rider returned parcel to destination branch for reprocessing
  RETURNED_TO_SENDER = 13, // Parcel returned to sender/source
  CANCELLED = 14, // Parcel order cancelled
  DISCREPANCY = 15, // Parcel has a reported issue or discrepancy
  AGED_IN_WAREHOUSE = 16, // Aged parcel moved to warehouse pending final disposition
  DISPOSED_BY_SALE = 17, // Aged parcel sold to recover outstanding charges
  DISPOSED_BY_DESTRUCTION = 18, // Aged parcel destroyed/disposed as waste
  DISPOSED_BY_DONATION = 19, // Aged parcel donated/disposed without sale
  RETURN_TO_SOURCE = 20, // Destination branch recorded a return to the original source branch
}

export enum ParcelDispositionActionType {
  NOTICE_SENT = 0,
  TRANSFERRED_TO_WAREHOUSE = 1,
  SOLD = 2,
  DESTROYED = 3,
  DONATED = 4,
  WRITTEN_OFF = 5,
}

export enum ParcelReconciliationCaseStatus {
  REQUESTED = 0,
  APPROVED = 1,
  EXECUTED = 2,
  REJECTED = 3,
}

export enum ParcelStorageClearanceStatus {
  PENDING_APPROVAL = 0,
  APPROVED_FOR_FINANCE = 1,
  RETURNED_FOR_REVIEW = 2,
  REJECTED = 3,
  EXECUTED = 4,
}

export enum ParcelReconciliationCaseType {
  SHORTAGE = 0,
  OVERAGE = 1,
  WRONG_AMOUNT = 2,
  WRONG_PARCEL_TYPE = 3,
  DUPLICATE_ENTRY = 4,
  CUSTOMER_CANCELLATION_BEFORE_DELIVERY = 5,
  DATA_ENTRY_ERROR = 6,
}

export enum ParcelReconciliationActionType {
  VOID_AND_REFUND = 0,
  VOID_AND_REBOOK = 1,
  VOID_TO_SUSPENSE = 2,
  KEEP_ORIGINAL_VOID_DUPLICATE = 3,
  MERGE_TO_SINGLE = 4,
  CORRECT_AMOUNT_IN_ORIGINAL_SESSION = 5,
}
