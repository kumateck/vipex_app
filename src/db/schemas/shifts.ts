import {
  pgTable,
  varchar,
  timestamp,
  bigint,
  boolean,
  index,
  uniqueIndex,
  smallint,
  integer,
  json,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies, branches, users } from './core';
import { createId } from '@paralleldrive/cuid2';

// Enhanced shift configurations
export const shiftTypes = pgTable(
  'shift_types',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 500 }),

    // Shift timing configuration
    standardDurationHours: smallint('standard_duration_hours').notNull().default(8), // Default 8-hour shifts
    maxDurationHours: smallint('max_duration_hours').notNull().default(24), // Maximum 24-hour shift
    allowCrossDay: boolean('allow_cross_day').notNull().default(true),

    // Break configurations
    breakDurationMinutes: smallint('break_duration_minutes').notNull().default(30), // 30 minutes
    breaksPerShift: smallint('breaks_per_shift').notNull().default(1), // 1 break per 8-hour shift

    // Handover requirements
    requiresCashierCount: boolean('requires_cashier_count').notNull().default(true),
    handoverChecklist: json('handover_checklist'), // Required handover items

    // Active flag
    isActive: boolean('is_active').notNull().default(true),

    // Audit fields
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('shift_types_company_idx').on(t.companyId),
    uqCompany: uniqueIndex('shift_types_company_name_uq').on(t.companyId, t.name),
  }),
);

// Enhanced cashier sessions with shift support
export const cashierSessions = pgTable(
  'cashier_sessions_enhanced',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    cashierId: varchar('cashier_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    shiftTypeId: varchar('shift_type_id', { length: 25 }).references(() => shiftTypes.id),

    // Enhanced timing support
    scheduledStartTime: timestamp('scheduled_start_time', { withTimezone: false }).notNull(),
    scheduledEndTime: timestamp('scheduled_end_time', { withTimezone: false }).notNull(),
    actualStartTime: timestamp('actual_start_time', { withTimezone: false }),
    actualEndTime: timestamp('actual_end_time', { withTimezone: false }),
    isCrossDayShift: boolean('is_cross_day_shift').notNull().default(false),

    // Break tracking
    breakStartTimes: json('break_start_times'), // Array of break start times
    breakEndTimes: json('break_end_times'), // Array of break end times
    totalBreakMinutes: integer('total_break_minutes').notNull().default(0),

    // Enhanced financial tracking
    openingBalancePsw: bigint('opening_balance_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    closingBalancePsw: bigint('closing_balance_psw', { mode: 'number' }),
    expectedClosingBalancePsw: bigint('expected_closing_balance_psw', { mode: 'number' }),
    variancePsw: bigint('variance_psw', { mode: 'number' }).default(sql`0`),

    // Transaction counts
    totalTransactions: integer('total_transactions').notNull().default(0),
    cashTransactions: integer('cash_transactions').notNull().default(0),
    mobileMoneyTransactions: integer('mobile_money_transactions').notNull().default(0),
    cardTransactions: integer('card_transactions').notNull().default(0),

    // Performance metrics
    averageTransactionValue: smallint('average_transaction_value'),
    customerCount: integer('customer_count').notNull().default(0),
    parcelsProcessed: integer('parcels_processed').notNull().default(0),

    // Shift status
    status: varchar('status', { length: 20 }).notNull().default('SCHEDULED'), // SCHEDULED | ACTIVE | PAUSED | COMPLETED | CANCELLED
    statusReason: varchar('status_reason', { length: 500 }),

    // Handover information
    handoverToCashierId: varchar('handover_to_cashier_id', { length: 25 }).references(
      () => users.id,
    ),
    handoverTime: timestamp('handover_time', { withTimezone: false }),
    handoverNotes: varchar('handover_notes', { length: 1000 }),
    handoverConfirmedBy: varchar('handover_confirmed_by', { length: 25 }).references(
      () => users.id,
    ),
    handoverConfirmedAt: timestamp('handover_confirmed_at', { withTimezone: false }),

    // Compliance and audit
    complianceNotes: varchar('compliance_notes', { length: 1000 }),
    auditScore: smallint('audit_score'), // 0-100 compliance score

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCashier: index('cashier_sessions_enhanced_cashier_idx').on(t.cashierId),
    byBranch: index('cashier_sessions_enhanced_branch_idx').on(t.branchId),
    byShiftType: index('cashier_sessions_enhanced_shift_type_idx').on(t.shiftTypeId),
    byStatus: index('cashier_sessions_enhanced_status_idx').on(t.status),
    byScheduledStart: index('cashier_sessions_enhanced_scheduled_start_idx').on(
      t.scheduledStartTime,
    ),
    byCrossDay: index('cashier_sessions_enhanced_cross_day_idx').on(t.isCrossDayShift),
  }),
);

export const cashierSessionDelegates = pgTable(
  'cashier_session_delegates',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    sessionId: varchar('session_id', { length: 25 })
      .notNull()
      .references(() => cashierSessions.id),
    userId: varchar('user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    assignedBy: varchar('assigned_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    assignedAt: timestamp('assigned_at', { withTimezone: false }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: false }),
  },
  (t) => ({
    uniqueSessionUser: uniqueIndex('cashier_session_delegates_session_user_uq').on(
      t.sessionId,
      t.userId,
    ),
    byUser: index('cashier_session_delegates_user_idx').on(t.userId),
  }),
);

// Shift templates for recurring schedules
export const shiftTemplates = pgTable(
  'shift_templates',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    shiftTypeId: varchar('shift_type_id', { length: 25 }).references(() => shiftTypes.id),
    name: varchar('name', { length: 255 }).notNull(),

    // Schedule template
    weeklySchedule: json('weekly_schedule'), // {"monday": "08:00-16:00", "tuesday": "08:00-16:00", ...}
    startDate: varchar('start_date', { length: 20 }), // "2024-01-01"
    endDate: varchar('end_date', { length: 20 }), // "2024-12-31"
    rotationPattern: varchar('rotation_pattern', { length: 50 }), // "morning", "evening", "night"

    // Override settings
    priority: smallint('priority').notNull().default(5), // 1-10 priority
    maxConsecutiveDays: smallint('max_consecutive_days').notNull().default(6), // Max consecutive days
    requiresWeekendCoverage: boolean('requires_weekend_coverage').notNull().default(false),

    // Active flag
    isActive: boolean('is_active').notNull().default(true),

    // Audit fields
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('shift_templates_company_idx').on(t.companyId),
    byBranch: index('shift_templates_branch_idx').on(t.branchId),
    byShiftType: index('shift_templates_shift_type_idx').on(t.shiftTypeId),
    uqCompanyBranchName: uniqueIndex('shift_templates_company_branch_name_uq').on(
      t.companyId,
      t.branchId,
      t.name,
    ),
  }),
);

// Shift swaps and coverage
export const shiftSwaps = pgTable(
  'shift_swaps',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),

    // Swap details
    originalSessionId: varchar('original_session_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    replacementSessionId: varchar('replacement_session_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    swapTime: timestamp('swap_time', { withTimezone: false }).notNull(),
    swapReason: varchar('swap_reason', { length: 500 }),
    approvedBy: varchar('approved_by', { length: 25 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: false }),

    // Coverage gaps
    gapStartTime: timestamp('gap_start_time', { withTimezone: false }),
    gapEndTime: timestamp('gap_end_time', { withTimezone: false }),
    gapDurationMinutes: integer('gap_duration_minutes'),

    // Status
    status: varchar('status', { length: 20 }).notNull().default('PENDING'), // PENDING | APPROVED | REJECTED
    notes: varchar('notes', { length: 1000 }),

    // Audit fields
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('shift_swaps_company_idx').on(t.companyId),
    byBranch: index('shift_swaps_branch_idx').on(t.branchId),
    byOriginalSession: index('shift_swaps_original_session_idx').on(t.originalSessionId),
    byStatus: index('shift_swaps_status_idx').on(t.status),
    bySwapTime: index('shift_swaps_swap_time_idx').on(t.swapTime),
  }),
);

export const cashierSessionTypes = pgTable(
  'cashier_session_types',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    sessionType: varchar('session_type', { length: 50 }).notNull(),
    startTime: varchar('start_time', { length: 5 }).notNull(),
    endTime: varchar('end_time', { length: 5 }).notNull(),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uqSessionType: uniqueIndex('cashier_session_types_session_type_uq').on(t.sessionType),
  }),
);
