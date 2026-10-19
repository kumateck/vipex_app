import {
  pgTable,
  varchar,
  timestamp,
  index,
  uniqueIndex,
  smallint,
  text,
} from 'drizzle-orm/pg-core';
import { companies, branches, users, locations, warehouses } from '../core';
import { ParcelHolderType, ParcelInternalTransferStatus } from '../enums';
import { createId } from '@paralleldrive/cuid2';
import { parcels } from './booking-parcels';

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
