import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  bigint,
  index,
  uniqueIndex,
  smallint,
  integer,
  json,
  text,
} from 'drizzle-orm/pg-core';
import { companies, branches, users, locations, warehouses } from './core';
import { customers, cards } from './customers';
import { cashierSessions } from './shifts';
import { sql } from 'drizzle-orm';
import {
  ConsignmentReceivingStatus,
  ParcelDispositionActionType,
  ParcelReconciliationActionType,
  ParcelReconciliationCaseStatus,
  ParcelReconciliationCaseType,
  ParcelHolderType,
  ParcelInternalTransferStatus,
  ParcelStatus,
  PaymentMethod,
  PaymentResponsibility,
  PendingBookingStatus,
} from './enums';
import { createId } from '@paralleldrive/cuid2';

// Bookings: pure header (no destinationId, invoice, paymentMode, actionType)
// id is UUID primary key; parcels link via bookingId
export const bookings = pgTable(
  'bookings',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    sourceId: varchar('source_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    createdBy: varchar('created_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
    cashierSessionId: varchar('cashier_session_id', { length: 25 }),
  },
  (t) => ({ byCreated: index('bookings_created_idx').on(t.createdAt) }),
);
// Parcels: trackingCode (QR) + bookingCode (human visible); payment method stored as smallint
export const parcels = pgTable(
  'parcels',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    sourceId: varchar('source_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    sourceLocationId: varchar('source_location_id', { length: 25 }).references(() => locations.id),
    destinationId: varchar('destination_id', { length: 25 })
      .notNull()
      .references(() => branches.id),

    bookingId: varchar('booking_id', { length: 25 })
      .notNull()
      .references(() => bookings.id),
    bookingCode: varchar('booking_code', { length: 255 }).notNull(),
    trackingCode: varchar('tracking_code', { length: 255 }).notNull(),

    senderId: varchar('sender_id', { length: 25 })
      .notNull()
      .references(() => customers.id),
    receiverId: varchar('receiver_id', { length: 25 })
      .notNull()
      .references(() => customers.id),
    secondReceiverId: varchar('second_receiver_id', { length: 25 }).references(() => customers.id),

    status: smallint('status').notNull().default(ParcelStatus.CREATED),
    parcelDetails: varchar('parcel_details', { length: 255 }).notNull(),
    parcelContent: varchar('parcel_content', { length: 255 }).notNull(),

    // bigint defaults via SQL literal
    parcelValuePsw: bigint('parcel_value_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    chargePsw: bigint('charge_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),

    cardId: varchar('card_id', { length: 25 }).references(() => cards.id),
    cardNumber: varchar('card_number', { length: 255 }),
    secondCardId: varchar('second_card_id', { length: 25 }).references(() => cards.id),
    secondCardNumber: varchar('second_card_number', { length: 255 }),

    pickupLocationId: varchar('pickup_location_id', { length: 25 }).references(() => locations.id),

    plannedToBePaidPsw: bigint('planned_tobepaid_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),

    method: smallint('method').notNull().default(PaymentMethod.CASH),

    callCenterAssignedToUserId: varchar('call_center_assigned_to_user_id', {
      length: 25,
    }).references(() => users.id),
    callCenterCalledAt: timestamp('call_center_called_at', { withTimezone: false }),
    shelfPickerStaffId: varchar('shelf_picker_staff_id', { length: 25 }).references(() => users.id),
    taxReportConfirmation: boolean('tax_report_confirmation').notNull().default(false),
    callSender: boolean('call_sender').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedBy: varchar('deleted_by', { length: 25 }).references(() => users.id),
    deletedAt: timestamp('deleted_at', { withTimezone: false }),
    deleteReason: varchar('delete_reason', { length: 1000 }),

    createdBy: varchar('created_by', { length: 25 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    processedBy: varchar('processed_by', { length: 25 }).references(() => users.id),
    receivedBy: varchar('received_by', { length: 25 }),
    receivedAt: timestamp('received_at', { withTimezone: false }),
    confirmedBy: varchar('confirmed_by', { length: 25 }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: false }),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
    cashierSessionId: varchar('cashier_session_id', { length: 25 }),
  },
  (t) => ({
    byBookingId: index('parcels_booking_id_idx').on(t.bookingId),
    byBookingCode: index('parcels_booking_code_idx').on(t.bookingCode),
    uqTrackingPerCompany: uniqueIndex('parcels_company_tracking_uq').on(
      t.companyId,
      t.trackingCode,
    ),
    bySender: index('parcels_sender_idx').on(t.senderId),
    byReceiver: index('parcels_receiver_idx').on(t.receiverId),
    byStatus: index('parcels_status_idx').on(t.status),
  }),
);

export const parcelDiscrepancies = pgTable(
  'parcel_discrepancies',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    parcelId: varchar('parcel_id', { length: 25 }).references(() => parcels.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    consignmentId: varchar('consignment_id', { length: 25 }).references(() => consignments.id),
    trackingCode: varchar('tracking_code', { length: 255 }),
    bookingCode: varchar('booking_code', { length: 255 }),
    discrepancyType: varchar('discrepancy_type', { length: 100 }).notNull(),
    notes: varchar('notes', { length: 1000 }),
    status: smallint('status').notNull().default(0), // 0=open, 1=resolved
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    resolvedBy: varchar('resolved_by', { length: 25 }).references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: false }),
    resolutionNote: varchar('resolution_note', { length: 1000 }),
  },
  (t) => ({
    byCompanyStatus: index('parcel_discrepancies_company_status_idx').on(t.companyId, t.status),
    byParcel: index('parcel_discrepancies_parcel_idx').on(t.parcelId),
    byCreated: index('parcel_discrepancies_created_idx').on(t.createdAt),
    byConsignment: index('parcel_discrepancies_consignment_idx').on(t.consignmentId),
    uqOpenByParcel: uniqueIndex('parcel_discrepancies_open_parcel_uq')
      .on(t.parcelId)
      .where(sql`${t.parcelId} IS NOT NULL AND ${t.status} = 0`),
  }),
);

export const parcelStickerPrints = pgTable(
  'parcel_sticker_prints',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    parcelId: varchar('parcel_id', { length: 25 }).references(() => parcels.id),
    bookingCode: varchar('booking_code', { length: 255 }).notNull(),
    trackingCode: varchar('tracking_code', { length: 255 }).notNull(),
    copies: integer('copies').notNull().default(1),
    printedBy: varchar('printed_by', { length: 25 }).references(() => users.id),
    printedAt: timestamp('printed_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyPrintedAt: index('parcel_sticker_prints_company_printed_at_idx').on(
      t.companyId,
      t.printedAt,
    ),
    byBranchPrintedAt: index('parcel_sticker_prints_branch_printed_at_idx').on(
      t.branchId,
      t.printedAt,
    ),
    byParcel: index('parcel_sticker_prints_parcel_idx').on(t.parcelId),
  }),
);

export const parcelReconciliationCases = pgTable(
  'parcel_reconciliation_cases',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    linkedParcelId: varchar('linked_parcel_id', { length: 25 }).references(() => parcels.id),
    cashierSessionId: varchar('cashier_session_id', { length: 25 }).references(
      () => cashierSessions.id,
    ),
    effectiveAt: timestamp('effective_at', { withTimezone: false }),
    originalChargePsw: bigint('original_charge_psw', { mode: 'number' }),
    proposedChargePsw: bigint('proposed_charge_psw', { mode: 'number' }),
    originalPlannedToBePaidPsw: bigint('original_planned_to_be_paid_psw', { mode: 'number' }),
    proposedPlannedToBePaidPsw: bigint('proposed_planned_to_be_paid_psw', { mode: 'number' }),
    caseType: smallint('case_type').notNull().default(ParcelReconciliationCaseType.SHORTAGE),
    actionType: smallint('action_type').default(ParcelReconciliationActionType.VOID_AND_REFUND),
    status: smallint('status').notNull().default(ParcelReconciliationCaseStatus.REQUESTED),
    notes: varchar('notes', { length: 1000 }),
    resolutionNote: varchar('resolution_note', { length: 1000 }),
    evidenceUrl: varchar('evidence_url', { length: 1000 }),
    requestedBy: varchar('requested_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    requestedAt: timestamp('requested_at', { withTimezone: false }).notNull().defaultNow(),
    approvedBy: varchar('approved_by', { length: 25 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    executedBy: varchar('executed_by', { length: 25 }).references(() => users.id),
    executedAt: timestamp('executed_at', { withTimezone: false }),
    voidedPaymentCount: integer('voided_payment_count').notNull().default(0),
    metadata: json('metadata'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyStatus: index('parcel_recon_cases_company_status_idx').on(t.companyId, t.status),
    byParcel: index('parcel_recon_cases_parcel_idx').on(t.parcelId),
    byLinkedParcel: index('parcel_recon_cases_linked_parcel_idx').on(t.linkedParcelId),
    byCashierSession: index('parcel_recon_cases_cashier_session_idx').on(t.cashierSessionId),
    byRequestedAt: index('parcel_recon_cases_requested_idx').on(t.requestedAt),
    uqOpenByParcel: uniqueIndex('parcel_recon_cases_open_parcel_uq')
      .on(t.parcelId)
      .where(sql`${t.status} IN (0, 1)`),
  }),
);

export const consignments = pgTable(
  'consignments',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    sourceId: varchar('source_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    destinationId: varchar('destination_id', { length: 25 })
      .notNull()
      .references(() => branches.id),

    // Use a proper date/timestamp builder (no sql.as)
    consignmentDate: timestamp('consignment_date', { mode: 'date' }).notNull(),

    // Use a proper integer column (no sql.as)
    serialForDay: integer('serial_for_day').notNull(),

    // Human code like YYYYMMDD-<serial>
    code: varchar('code', { length: 255 }).notNull(),

    createdBy: varchar('created_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),

    // Receiving completeness lifecycle
    status: smallint('status').notNull().default(ConsignmentReceivingStatus.OPEN),
    closedBy: varchar('closed_by', { length: 25 }).references(() => users.id),
    closedAt: timestamp('closed_at', { withTimezone: false }),
    closedWithExceptions: boolean('closed_with_exceptions').notNull().default(false),
    closeExceptionReason: varchar('close_exception_reason', { length: 1000 }),
  },
  (t) => ({
    uqDailySerial: uniqueIndex('consignments_daily_serial_uq').on(
      t.companyId,
      t.sourceId,
      t.consignmentDate,
      t.serialForDay,
    ),
    byRoute: index('consignments_route_idx').on(t.sourceId, t.destinationId),
    byStatus: index('consignments_status_idx').on(t.status),
  }),
);

export const consignmentItems = pgTable(
  'consignment_items',
  {
    consignmentId: varchar('consignment_id', { length: 25 })
      .notNull()
      .references(() => consignments.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    addedAt: timestamp('added_at', { withTimezone: false }).notNull().defaultNow(),
    removedAt: timestamp('removed_at', { withTimezone: false }),

    // Per-item receiving record, scoped to this consignment (source of truth for
    // duplicate-scan and wrong-consignment detection)
    arrivedAt: timestamp('arrived_at', { withTimezone: false }),
    arrivedBy: varchar('arrived_by', { length: 25 }).references(() => users.id),
  },
  (t) => ({
    pk: uniqueIndex('consignment_items_uq').on(t.consignmentId, t.parcelId),
    // At most one active consignment per parcel (active = removed_at IS NULL)
    uqActiveParcel: uniqueIndex('consignment_items_parcel_active_uq')
      .on(t.parcelId)
      .where(sql`${t.removedAt} IS NULL`),
    byConsignmentArrived: index('consignment_items_consignment_arrived_idx').on(
      t.consignmentId,
      t.arrivedAt,
    ),
  }),
);

// Pending Bookings awaiting cashier confirmation
export const pendingBookings = pgTable(
  'pending_bookings',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),

    // Complete booking data from attendant (JSON object)
    bookingData: json('booking_data').notNull(),

    // Payment responsibility
    paymentResponsibility: smallint('payment_responsibility')
      .notNull()
      .default(PaymentResponsibility.SENDER),
    senderAmountPsw: bigint('sender_amount_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    recipientAmountPsw: bigint('recipient_amount_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),

    // Attendant who created the pending booking
    attendantId: varchar('attendant_id', { length: 25 })
      .notNull()
      .references(() => users.id),

    // Status tracking
    status: smallint('status').notNull().default(PendingBookingStatus.PENDING),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: false }),
    expiresAt: timestamp('expires_at', { withTimezone: false }).notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: false }),
    cancelledBy: varchar('cancelled_by', { length: 25 }).references(() => users.id),
    cancelReason: text('cancel_reason'),
  },
  (t) => ({
    byCompany: index('pending_bookings_company_idx').on(t.companyId),
    byBranch: index('pending_bookings_branch_idx').on(t.branchId),
    byAttendant: index('pending_bookings_attendant_idx').on(t.attendantId),
    byStatus: index('pending_bookings_status_idx').on(t.status),
    byExpires: index('pending_bookings_expires_idx').on(t.expiresAt),
    byCreated: index('pending_bookings_created_idx').on(t.createdAt),
  }),
);

export const pickupQueues = pgTable(
  'pickup_queues',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    paymentBucket: varchar('payment_bucket', { length: 2 }).notNull(),
    queueDate: timestamp('queue_date', { mode: 'date' }).notNull(),
    queueNumber: integer('queue_number').notNull(),
    queueCode: varchar('queue_code', { length: 32 }).notNull(),
    pickerStaffId: varchar('picker_staff_id', { length: 25 }).references(() => users.id),
    idCardTypeId: varchar('id_card_type_id', { length: 25 }).references(() => cards.id),
    idCardNumber: varchar('id_card_number', { length: 255 }),
    queuedBy: varchar('queued_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    queuedAt: timestamp('queued_at', { withTimezone: false }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: false }),
    endedBy: varchar('ended_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uqPickupQueueOpenParcelDaily: uniqueIndex('pickup_queues_open_parcel_daily_uq')
      .on(t.parcelId, t.queueDate)
      .where(sql`${t.endedAt} IS NULL`),
    uqPickupQueueDailyCode: uniqueIndex('pickup_queues_daily_code_uq').on(
      t.branchId,
      t.locationId,
      t.queueDate,
      t.queueNumber,
    ),
    byBranchQueuedAt: index('pickup_queues_branch_queued_at_idx').on(t.branchId, t.queuedAt),
    byQueueCode: index('pickup_queues_code_idx').on(t.queueCode),
  }),
);

export const parcelInternalHolders = pgTable(
  'parcel_internal_holders',
  {
    parcelId: varchar('parcel_id', { length: 25 })
      .primaryKey()
      .references(() => parcels.id),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    holderType: smallint('holder_type').notNull().default(ParcelHolderType.BRANCH),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    warehouseId: varchar('warehouse_id', { length: 25 }).references(() => warehouses.id),
    updatedBy: varchar('updated_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byBranch: index('parcel_internal_holders_branch_idx').on(t.branchId),
    byLocation: index('parcel_internal_holders_location_idx').on(t.locationId),
    byWarehouse: index('parcel_internal_holders_warehouse_idx').on(t.warehouseId),
  }),
);

export const parcelInternalTransfers = pgTable(
  'parcel_internal_transfers',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    referenceNo: varchar('reference_no', { length: 64 }),
    sourceHolderType: smallint('source_holder_type').notNull().default(ParcelHolderType.BRANCH),
    sourceLocationId: varchar('source_location_id', { length: 25 }).references(() => locations.id),
    sourceWarehouseId: varchar('source_warehouse_id', { length: 25 }).references(
      () => warehouses.id,
    ),
    destinationHolderType: smallint('destination_holder_type')
      .notNull()
      .default(ParcelHolderType.LOCATION),
    destinationLocationId: varchar('destination_location_id', { length: 25 }).references(
      () => locations.id,
    ),
    destinationWarehouseId: varchar('destination_warehouse_id', { length: 25 }).references(
      () => warehouses.id,
    ),
    notes: text('notes'),
    status: smallint('status').notNull().default(ParcelInternalTransferStatus.PENDING),
    transferredBy: varchar('transferred_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    transferredAt: timestamp('transferred_at', { withTimezone: false }).notNull().defaultNow(),
    acknowledgedBy: varchar('acknowledged_by', { length: 25 }).references(() => users.id),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: false }),
    cancelledBy: varchar('cancelled_by', { length: 25 }).references(() => users.id),
    cancelledAt: timestamp('cancelled_at', { withTimezone: false }),
    cancelReason: text('cancel_reason'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byBranchStatus: index('parcel_internal_transfers_branch_status_idx').on(t.branchId, t.status),
    byReference: uniqueIndex('parcel_internal_transfers_reference_uq').on(t.referenceNo),
    byDestinationLocation: index('parcel_internal_transfers_dest_location_idx').on(
      t.destinationLocationId,
    ),
    byDestinationWarehouse: index('parcel_internal_transfers_dest_warehouse_idx').on(
      t.destinationWarehouseId,
    ),
  }),
);

export const parcelInternalTransferItems = pgTable(
  'parcel_internal_transfer_items',
  {
    transferId: varchar('transfer_id', { length: 25 })
      .notNull()
      .references(() => parcelInternalTransfers.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    addedAt: timestamp('added_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    pk: uniqueIndex('parcel_internal_transfer_items_uq').on(t.transferId, t.parcelId),
    byParcel: index('parcel_internal_transfer_items_parcel_idx').on(t.parcelId),
  }),
);

export const parcelDispositionActions = pgTable(
  'parcel_disposition_actions',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    actionType: smallint('action_type').notNull().default(ParcelDispositionActionType.NOTICE_SENT),
    warehouseId: varchar('warehouse_id', { length: 25 }).references(() => warehouses.id),
    notes: text('notes'),
    recoveredAmountPsw: bigint('recovered_amount_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    performedBy: varchar('performed_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    performedAt: timestamp('performed_at', { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyPerformedAt: index('parcel_disposition_actions_company_performed_idx').on(
      t.companyId,
      t.performedAt,
    ),
    byParcelPerformedAt: index('parcel_disposition_actions_parcel_performed_idx').on(
      t.parcelId,
      t.performedAt,
    ),
    byWarehouse: index('parcel_disposition_actions_warehouse_idx').on(t.warehouseId),
  }),
);

export const parcelStorageWaivers = pgTable(
  'parcel_storage_waivers',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    waivedAmountPsw: bigint('waived_amount_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    reason: text('reason').notNull(),
    waivedBy: varchar('waived_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    waivedAt: timestamp('waived_at', { withTimezone: false }).notNull().defaultNow(),
    accountingJournalEntryId: varchar('accounting_journal_entry_id', { length: 25 }),
    accountingPostedAt: timestamp('accounting_posted_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyWaivedAt: index('parcel_storage_waivers_company_waived_idx').on(
      t.companyId,
      t.waivedAt,
    ),
    byParcelWaivedAt: index('parcel_storage_waivers_parcel_waived_idx').on(t.parcelId, t.waivedAt),
  }),
);
