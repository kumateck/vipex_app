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

export enum CustomerType {
  INDIVIDUAL = 0,
  BUSINESS = 1,
}

export enum CustomerCreditSourceType {
  PARCEL = 0,
  DELIVERY = 1,
  MANUAL = 2,
}

export enum CustomerCreditTransactionType {
  CHARGE = 0,
  PAYMENT = 1,
  ADJUSTMENT = 2,
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

export enum Gender {
  MALE = 0,
  FEMALE = 1,
  OTHER = 2,
  UNSPECIFIED = 3,
}
export enum EmploymentStatus {
  ACTIVE = 0,
  PROBATION = 1,
  SUSPENDED = 2,
  RESIGNED = 3,
  TERMINATED = 4,
  INACTIVE = 5,
}
export enum EmploymentType {
  FULL_TIME = 0,
  PART_TIME = 1,
  CONTRACT = 2,
  INTERN = 3,
  CASUAL = 4,
}
export enum AttendanceStatus {
  PRESENT = 0,
  ABSENT = 1,
  LATE = 2,
  HALF_DAY = 3,
  LEAVE = 4,
  OFF_DAY = 5,
}
export enum LeaveRequestStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  CANCELLED = 3,
}
export enum LeaveSelectionMode {
  DATE_RANGE = 0,
  WEEK_RANGE = 1,
}
export enum LeaveSwapStatus {
  PENDING_PEER = 0,
  PENDING_HR = 1,
  APPROVED = 2,
  REJECTED = 3,
  CANCELLED = 4,
  EXECUTED = 5,
}
export enum ApprovalStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}
export enum PayrollFrequency {
  MONTHLY = 0,
  WEEKLY = 1,
  BIWEEKLY = 2,
}
export enum PayType {
  MONTHLY = 0,
  DAILY = 1,
  HOURLY = 2,
}
export enum PayrollPeriodStatus {
  DRAFT = 0,
  OPEN = 1,
  PROCESSING = 2,
  APPROVED = 3,
  POSTED = 4,
  CANCELLED = 5,
}
export enum PayrollRunStatus {
  DRAFT = 0,
  PROCESSING = 1,
  COMPLETED = 2,
  APPROVED = 3,
  POSTED = 4,
  FAILED = 5,
}
export enum PayrollItemType {
  EARNING = 0,
  DEDUCTION = 1,
  EMPLOYER_CONTRIBUTION = 2,
}
export enum CompensationItemCalculationType {
  FIXED = 0,
  PERCENTAGE = 1,
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
  PARTIALLY_FULFILLED = 4,
}

export enum StockRequestStatus {
  DRAFT = 0,
  SUBMITTED = 1,
  APPROVED = 2,
  PARTIALLY_FULFILLED = 3,
  FULFILLED = 4,
  REJECTED = 5,
  CANCELLED = 6,
}

export enum StockRequestType {
  INTER_BRANCH = 0,
  INTRA_BRANCH = 1,
}

export enum InventoryMaintenanceIssueType {
  MAINTENANCE = 0,
  DAMAGE = 1,
  MISSING = 2,
}

export enum InventoryMaintenanceStatus {
  OPEN = 0,
  CLOSED = 1,
}

export enum InventoryLocationType {
  MAIN_STORE = 0,
  BRANCH_STORE = 1,
  CONSUMPTION_LOCATION = 2,
}

export enum StockAllocationStrategy {
  FEFO = 0,
  OLDEST_RECEIPT = 1,
  HIGHEST_AVAILABLE = 2,
}

export enum StockReservationStatus {
  OPEN = 0,
  PARTIALLY_ALLOCATED = 1,
  ALLOCATED = 2,
  ISSUED = 3,
  SHORT = 4,
  CANCELLED = 5,
}

export enum StockReservationAllocationStatus {
  RESERVED = 0,
  RELEASED = 1,
  ISSUED = 2,
}

export enum StockLotStatus {
  ACTIVE = 0,
  EXPIRED = 1,
  QUARANTINED = 2,
  DEPLETED = 3,
}

export enum StockCountSessionStatus {
  DRAFT = 0,
  SUBMITTED = 1,
  APPROVED = 2,
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

// Inventory major workflow enums
export enum InventoryApprovalEntityType {
  STOCK_REQUEST = 0,
  STOCK_TRANSFER = 1,
  STOCK_ADJUSTMENT = 2,
  REPLENISHMENT_PROPOSAL = 3,
}

export enum InventoryApprovalStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  ESCALATED = 3,
  CANCELLED = 4,
}

export enum InventoryValuationMethod {
  WEIGHTED_AVERAGE = 0,
  FIFO = 1,
}

export enum InventoryReplenishmentProposalStatus {
  DRAFT = 0,
  SUBMITTED = 1,
  APPROVED = 2,
  REJECTED = 3,
  CANCELLED = 4,
}

export enum InventoryTaskType {
  PICK = 0,
  PACK = 1,
  DISPATCH = 2,
  CYCLE_COUNT = 3,
}

export enum InventoryTaskStatus {
  OPEN = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

export enum InventoryEventType {
  POLICY_UPDATED = 0,
  APPROVAL_SUBMITTED = 1,
  APPROVAL_DECIDED = 2,
  VALUATION_RECOMPUTED = 3,
  REPLENISHMENT_GENERATED = 4,
  REPLENISHMENT_DECIDED = 5,
  TASK_CREATED = 6,
  TASK_SCANNED = 7,
  CORRECTION_POSTED = 8,
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

export enum AccountClass {
  ASSET = 0,
  LIABILITY = 1,
  EQUITY = 2,
  INCOME = 3,
  EXPENSE = 4,
}

export enum JournalSourceType {
  MANUAL = 0,
  DAILY_CASH_CONFIRMATION = 1,
  EXPENSE = 2,
  PETTY_CASH_REPLENISHMENT = 3,
  CASH_TO_BANK = 4,
  TAX = 5,
  SALES_CONFIRMATION = 6,
  PAYMENT = 7,
  PAYROLL = 8,
}

export enum CashConfirmationStatus {
  DRAFT = 0,
  CONFIRMED = 1,
  POSTED = 2,
}

export enum ExpenseFundingSource {
  PETTY_CASH = 0,
  SALES_CASH = 1,
  COMPANY_BANK = 2,
}

export enum ExpenseRequestStatus {
  RECORDED = 0,
  SUBMITTED = 1,
  APPROVED = 2,
  REJECTED = 3,
  PAID = 4,
  POSTED = 5,
}

export enum TaxFilingStatus {
  UNFILED = 0,
  READY_FOR_FILING = 1,
  FILED = 2,
  EXCLUDED = 3,
}

export enum TaxFilingPeriodStatus {
  OPEN = 0,
  UNDER_REVIEW = 1,
  SUBMITTED = 2,
  CLOSED = 3,
}

export enum ManualJournalEntryStatus {
  PENDING_APPROVAL = 0,
  POSTED = 1,
  REJECTED = 2,
}

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
  RETURNED_TO_OFFICE = 12, // Parcel returned to branch office
  RETURNED_TO_SENDER = 13, // Parcel returned to sender/source
  CANCELLED = 14, // Parcel order cancelled
  DISCREPANCY = 15, // Parcel has a reported issue or discrepancy
  AGED_IN_WAREHOUSE = 16, // Aged parcel moved to warehouse pending final disposition
  DISPOSED_BY_SALE = 17, // Aged parcel sold to recover outstanding charges
  DISPOSED_BY_DESTRUCTION = 18, // Aged parcel destroyed/disposed as waste
  DISPOSED_BY_DONATION = 19, // Aged parcel donated/disposed without sale
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

export enum ConsignmentReceivingStatus {
  OPEN = 0, // created, receiving in progress or not yet started
  CLOSED = 1, // closed, all active items confirmed arrived
  CLOSED_WITH_EXCEPTIONS = 2, // closed with sign-off despite missing items
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
