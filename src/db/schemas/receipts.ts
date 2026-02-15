import {
  pgTable,
  varchar,
  timestamp,
  text,
  index,
  uniqueIndex,
  smallint,
  integer,
  json,
  boolean,
} from 'drizzle-orm/pg-core';
import { companies, users } from './core';
import { createId } from '@paralleldrive/cuid2';

// Receipt templates for different types
export const receiptTemplates = pgTable(
  'receipt_templates',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    type: smallint('type').notNull(), // ReceiptType enum
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 500 }),

    // HTML template with placeholders
    template: text('template').notNull(),

    // Print settings (JSON object)
    printSettings: json('print_settings'),

    // Default margins, sizes, etc.
    defaultSettings: json('default_settings'),

    // Active flag
    isActive: boolean('is_active').notNull().default(true),

    // Audit fields
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('receipt_templates_company_idx').on(t.companyId),
    byType: index('receipt_templates_type_idx').on(t.type),
    uqCompanyType: uniqueIndex('receipt_templates_company_type_uq').on(t.companyId, t.type),
  }),
);

// Generated receipts for tracking
export const generatedReceipts = pgTable(
  'generated_receipts',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    type: smallint('type').notNull(), // ReceiptType enum

    // Reference to what this receipt is for
    referenceId: varchar('reference_id', { length: 25 }).notNull(), // Could be bookingId, parcelId, paymentId
    referenceType: varchar('reference_type', { length: 50 }).notNull(), // 'booking', 'parcel', 'payment'

    // Receipt content
    receiptNumber: varchar('receipt_number', { length: 255 }).notNull(),
    content: text('content').notNull(), // Generated HTML/PDF content

    // Metadata (JSON object)
    metadata: json('metadata'), // Customer info, amounts, etc.

    // Print tracking
    printedAt: timestamp('printed_at', { withTimezone: false }),
    printedBy: varchar('printed_by', { length: 25 }).references(() => users.id),
    printCount: integer('print_count').notNull().default(0),

    // Creation tracking
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('generated_receipts_company_idx').on(t.companyId),
    byType: index('generated_receipts_type_idx').on(t.type),
    byReference: index('generated_receipts_reference_idx').on(t.referenceId, t.referenceType),
    byReceiptNumber: index('generated_receipts_receipt_number_idx').on(t.receiptNumber),
    uqReceiptNumber: uniqueIndex('generated_receipts_receipt_number_uq').on(t.receiptNumber),
  }),
);
