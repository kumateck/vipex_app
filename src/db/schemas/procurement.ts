import {
  bigint,
  boolean,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { branches, companies, users } from './core';

export const ProcurementRequestStatus = {
  DRAFT: 0,
  SUBMITTED: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;

export const procurementSuppliers = pgTable(
  'procurement_suppliers',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    contactPerson: varchar('contact_person', { length: 255 }),
    email: varchar('email', { length: 255 }),
    telephone: varchar('telephone', { length: 50 }),
    address: text('address'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('procurement_suppliers_company_idx').on(t.companyId),
    byCompanyActive: index('procurement_suppliers_company_active_idx').on(t.companyId, t.isActive),
    uqCompanyLowerName: uniqueIndex('procurement_suppliers_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

export const procurementPurchaseRequests = pgTable(
  'procurement_purchase_requests',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    requestNo: varchar('request_no', { length: 50 }).notNull(),
    supplierId: varchar('supplier_id', { length: 25 }).references(() => procurementSuppliers.id),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    amountPsw: bigint('amount_psw', { mode: 'number' }).notNull().default(0),
    status: smallint('status').notNull().default(ProcurementRequestStatus.SUBMITTED),
    requestedByUserId: varchar('requested_by_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    approvedByUserId: varchar('approved_by_user_id', { length: 25 }).references(() => users.id),
    rejectedByUserId: varchar('rejected_by_user_id', { length: 25 }).references(() => users.id),
    rejectionReason: text('rejection_reason'),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    rejectedAt: timestamp('rejected_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('procurement_purchase_requests_company_idx').on(t.companyId),
    byCompanyStatus: index('procurement_purchase_requests_company_status_idx').on(
      t.companyId,
      t.status,
    ),
    bySupplier: index('procurement_purchase_requests_supplier_idx').on(t.supplierId),
    uqCompanyRequestNo: uniqueIndex('procurement_purchase_requests_company_request_no_uq').on(
      t.companyId,
      t.requestNo,
    ),
  }),
);
