import {
  pgTable,
  varchar,
  timestamp,
  bigint,
  smallint,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies, branches } from './core';
import { SplitPaymentType, DeliveryFeeBasis } from './enums';
import { createId } from '@paralleldrive/cuid2';

// Payment rules for split calculations
export const paymentRules = pgTable(
  'payment_rules',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),

    // Base charges (in pesewas)
    baseChargePsw: bigint('base_charge_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),

    // Delivery fee calculation
    deliveryFeeBasis: smallint('delivery_fee_basis').notNull().default(DeliveryFeeBasis.FIXED),
    deliveryFeePsw: bigint('delivery_fee_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),

    // Service charges
    serviceChargePsw: bigint('service_charge_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),

    // Insurance (optional)
    insuranceRequired: boolean('insurance_required').notNull().default(false),
    insuranceRate: smallint('insurance_rate'), // percentage * 100
    insuranceMinPsw: bigint('insurance_min_psw', { mode: 'number' }).default(sql`0`),

    // Split payment configuration
    splitPaymentType: smallint('split_payment_type').notNull().default(SplitPaymentType.PERCENTAGE),
    splitPercentage: smallint('split_percentage'), // sender pays X%, recipient pays (100-X)%
    splitFixedSenderPsw: bigint('split_fixed_sender_psw', { mode: 'number' }).default(sql`0`),
    splitFixedRecipientPsw: bigint('split_fixed_recipient_psw', { mode: 'number' }).default(sql`0`),

    // Branch and distance specific
    sourceBranchId: varchar('source_branch_id', { length: 25 }).references(() => branches.id),
    destinationBranchId: varchar('destination_branch_id', { length: 25 }).references(
      () => branches.id,
    ),
    distanceKm: smallint('distance_km'), // for distance-based pricing

    // Active flag and conditions
    isActive: boolean('is_active').notNull().default(true),
    minWeight: smallint('min_weight'),
    maxWeight: smallint('max_weight'),
    minAmountPsw: bigint('min_amount_psw', { mode: 'number' }).default(0),
    maxAmountPsw: bigint('max_amount_psw', { mode: 'number' }),

    // Audit fields
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('payment_rules_company_idx').on(t.companyId),
    byRoute: index('payment_rules_route_idx').on(t.sourceBranchId, t.destinationBranchId),
    byActive: index('payment_rules_active_idx').on(t.isActive),
    byWeightRange: index('payment_rules_weight_range_idx').on(t.minWeight, t.maxWeight),
    uqCompanyRoute: uniqueIndex('payment_rules_company_route_uq').on(
      t.companyId,
      t.sourceBranchId,
      t.destinationBranchId,
    ),
  }),
);

// Payment calculation cache for performance
export const paymentCalculations = pgTable(
  'payment_calculations',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 }).notNull(),

    // Input parameters
    sourceBranchId: varchar('source_branch_id', { length: 25 }).notNull(),
    destinationBranchId: varchar('destination_branch_id', { length: 25 }).notNull(),
    parcelValuePsw: bigint('parcel_value_psw', { mode: 'number' }).notNull(),
    weight: smallint('weight'),
    distanceKm: smallint('distance_km'),

    // Calculated results
    totalChargePsw: bigint('total_charge_psw', { mode: 'number' }).notNull(),
    baseChargePsw: bigint('base_charge_psw', { mode: 'number' }).notNull(),
    deliveryFeePsw: bigint('delivery_fee_psw', { mode: 'number' }).notNull(),
    serviceChargePsw: bigint('service_charge_psw', { mode: 'number' }).notNull(),
    insurancePsw: bigint('insurance_psw', { mode: 'number' }).notNull(),

    // Split breakdown
    senderAmountPsw: bigint('sender_amount_psw', { mode: 'number' }).notNull(),
    recipientAmountPsw: bigint('recipient_amount_psw', { mode: 'number' }).notNull(),

    // Tax breakdown
    vatPsw: bigint('vat_psw', { mode: 'number' }).notNull(),
    getfundPsw: bigint('getfund_psw', { mode: 'number' }).notNull(),
    nhilPsw: bigint('nhil_psw', { mode: 'number' }).notNull(),
    covidPsw: bigint('covid_psw', { mode: 'number' }).notNull(),
    taxTotalPsw: bigint('tax_total_psw', { mode: 'number' }).notNull(),

    // Metadata
    paymentRuleId: varchar('payment_rule_id', { length: 25 }).references(() => paymentRules.id),
    calculationHash: varchar('calculation_hash', { length: 64 }).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('payment_calculations_company_idx').on(t.companyId),
    byRoute: index('payment_calculations_route_idx').on(t.sourceBranchId, t.destinationBranchId),
    byHash: index('payment_calculations_hash_idx').on(t.calculationHash),
    uqHash: uniqueIndex('payment_calculations_hash_uq').on(t.calculationHash),
  }),
);
