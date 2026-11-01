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
