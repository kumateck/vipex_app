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
