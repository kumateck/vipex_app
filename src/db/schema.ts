import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  doublePrecision,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Postgres schema for Bun + Drizzle ORM with UUID primary keys.
 * - All id primary keys are UUID with defaultRandom() (uses gen_random_uuid()).
 * - Ensure pgcrypto extension is enabled (see scripts/enable_pgcrypto.*).
 * - updatedAt uses $onUpdate(() => new Date()) to auto-set when updating via Drizzle.
 */

// Companies
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  code: varchar('code', { length: 255 }).notNull(),
  tin: varchar('tin', { length: 255 }),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Branches
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  telephone: varchar('telephone', { length: 255 }),
  address: varchar('address', { length: 255 }),
  email: varchar('email', { length: 255 }),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Customers
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    fullname: varchar('fullname', { length: 255 }).notNull(),
    telephone: varchar('telephone', { length: 255 }),
    telephone2: varchar('telephone2', { length: 255 }),
    address: varchar('address', { length: 255 }),
    email: varchar('email', { length: 255 }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    idxCustomersFullname: index('idx_customers_fullname').on(t.fullname),
    idxCustomersTelephone: index('idx_customers_telephone').on(t.telephone),
  }),
);

// Cards
export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Customer Cards
export const customerCards = pgTable('customer_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  cardId: uuid('card_id')
    .notNull()
    .references(() => cards.id),
  cardNumber: varchar('card_number', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Statuses
export const statuses = pgTable('statuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 255 }).notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Roles
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  createdBy: uuid('created_by').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullname: varchar('fullname', { length: 255 }).notNull(),
  telephone: varchar('telephone', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  userStatus: varchar('user_status', { length: 20 }).notNull().default('ACTIVE'),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id),
  createdBy: uuid('created_by').notNull(), // kept without FK as in original migrations
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  taxReportConfirmation: boolean('tax_report_confirmation').notNull().default(false),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpires: timestamp('reset_token_expires', { withTimezone: false }),
});

// Permissions
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  permission: varchar('permission', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  permType: varchar('perm_type', { length: 255 }).notNull(),
  permIcon: varchar('perm_icon', { length: 255 }),
  permParent: varchar('perm_parent', { length: 255 }),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Role Permissions
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Locations
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Cashier Session Types
export const cashierSessionTypes = pgTable(
  'cashier_session_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionType: varchar('session_type', { length: 50 }).notNull(),
    startTime: varchar('start_time', { length: 5 }).notNull(),
    endTime: varchar('end_time', { length: 5 }).notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    uqSessionType: uniqueIndex('cashier_session_types_session_type_unique').on(t.sessionType),
  }),
);

// Cashier Sessions
export const cashierSessions = pgTable('cashier_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  cashierId: uuid('cashier_id')
    .notNull()
    .references(() => users.id),
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id),
  sessionTypeId: uuid('session_type_id')
    .notNull()
    .references(() => cashierSessionTypes.id),
  startTime: timestamp('start_time', { withTimezone: false }).notNull(),
  endTime: timestamp('end_time', { withTimezone: false }),
  openingBalance: doublePrecision('opening_balance').notNull().default(0),
  closingBalance: doublePrecision('closing_balance'),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Bookings
export const bookings = pgTable(
  'bookings',
  {
    bookingCode: varchar('booking_code', { length: 255 }).primaryKey(),
    invoice: varchar('invoice', { length: 255 }),
    senderId: uuid('sender_id').notNull(), // original schema had no FK
    amountPaid: doublePrecision('amount_paid').notNull().default(0),
    actualPrice: doublePrecision('actual_price').notNull().default(0),
    vatPrice: doublePrecision('vat_price').notNull().default(0),
    getfundPrice: doublePrecision('getfund_price').notNull().default(0),
    nhilPrice: doublePrecision('nhil_price').notNull().default(0),
    covidPrice: doublePrecision('covid_price').notNull().default(0),
    tobePaid: doublePrecision('tobe_paid').notNull().default(0),
    shouldnotPay: boolean('shouldnot_pay').default(false),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => branches.id),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => branches.id),
    statusId: uuid('status_id')
      .notNull()
      .references(() => statuses.id),
    paymentMode: varchar('payment_mode', { length: 255 }),
    actionType: varchar('action_type', { length: 255 }).notNull().default('VERIFIED'),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    sentBy: uuid('sent_by'),
    sendingDate: timestamp('sending_date', { withTimezone: false }),
    deletedBy: uuid('deleted_by'),
    deletedDate: timestamp('deleted_date', { withTimezone: false }),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    cashierSessionId: uuid('cashier_session_id').references(() => cashierSessions.id),
  },
  (t) => ({
    idxBookingsSenderId: index('idx_bookings_sender_id').on(t.senderId),
  }),
);

// Consignments
export const consignments = pgTable('consignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  sourceId: uuid('source_id')
    .notNull()
    .references(() => branches.id),
  destinationId: uuid('destination_id')
    .notNull()
    .references(() => branches.id),
  code: varchar('code', { length: 255 }).notNull(),
  date: timestamp('date', { withTimezone: false }).notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Parcels
export const parcels = pgTable(
  'parcels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => branches.id),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => branches.id),
    bookingCode: varchar('booking_code', { length: 255 })
      .notNull()
      .references(() => bookings.bookingCode),
    consignmentId: uuid('consignment_id'),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => customers.id),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => customers.id),
    secondReceiverId: uuid('second_receiver_id').references(() => customers.id),
    statusId: uuid('status_id')
      .notNull()
      .references(() => statuses.id),
    parcelDetails: varchar('parcel_details', { length: 255 }).notNull(),
    parcelContent: varchar('parcel_content', { length: 255 }).notNull(),
    parcelValue: doublePrecision('parcel_value').default(0),
    cardId: uuid('card_id').references(() => cards.id),
    cardNumber: varchar('card_number', { length: 255 }),
    secondCardId: uuid('second_card_id').references(() => cards.id),
    secondCardNumber: varchar('second_card_number', { length: 255 }),
    pickupLocationId: uuid('pickup_location_id').references(() => locations.id),
    amountPaid: doublePrecision('amount_paid').notNull().default(0),
    tobePaid: doublePrecision('tobe_paid').notNull().default(0),
    tobePaidActualPrice: doublePrecision('tobepaid_actual_price').notNull().default(0),
    tobePaidVatPrice: doublePrecision('tobepaid_vat_price').notNull().default(0),
    tobePaidGetfundPrice: doublePrecision('tobepaid_getfund_price').notNull().default(0),
    tobePaidNhilPrice: doublePrecision('tobepaid_nhil_price').notNull().default(0),
    tobePaidCovidPrice: doublePrecision('tobepaid_covid_price').notNull().default(0),
    taxReportConfirmation: boolean('tax_report_confirmation').notNull().default(false),
    paymentMode: varchar('payment_mode', { length: 255 }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    receivedBy: uuid('received_by').references(() => users.id),
    receivedAt: timestamp('received_at', { withTimezone: false }),
    confirmedBy: uuid('confirmed_by').references(() => users.id),
    confirmedAt: timestamp('confirmed_at', { withTimezone: false }),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    cashierSessionId: uuid('cashier_session_id').references(() => cashierSessions.id),
  },
  (t) => ({
    idxParcelsBookingCode: index('idx_parcels_booking_code').on(t.bookingCode),
    idxParcelsSenderId: index('idx_parcels_sender_id').on(t.senderId),
    idxParcelsReceiverId: index('idx_parcels_receiver_id').on(t.receiverId),
  }),
);

// Deliveries
export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  parcelId: uuid('parcel_id')
    .notNull()
    .references(() => parcels.id),
  type: varchar('type', { length: 20 }).notNull(),
  location: varchar('location', { length: 255 }),
  receiverCalledConfirmedBy: uuid('receiver_called_confirmed_by').references(() => users.id),
  receiverCalledConfirmedAt: timestamp('receiver_called_confirmed_at', {
    withTimezone: false,
  }),
  charge: doublePrecision('charge').notNull().default(0),
  amountPaid: doublePrecision('amount_paid').notNull().default(0),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deliveredBy: uuid('delivered_by').references(() => users.id),
  deliveredAt: timestamp('delivered_at', { withTimezone: false }),
  confirmedBy: uuid('confirmed_by').references(() => users.id),
  confirmedAt: timestamp('confirmed_at', { withTimezone: false }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  cashierSessionId: uuid('cashier_session_id').references(() => cashierSessions.id),
});
