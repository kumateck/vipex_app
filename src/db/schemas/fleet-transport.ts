import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
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

export const FleetFuelLogStatus = {
  DRAFT: 0,
  SUBMITTED: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;

export const fleetVehicles = pgTable(
  'fleet_vehicles',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    plateNumber: varchar('plate_number', { length: 50 }).notNull(),
    model: varchar('model', { length: 255 }).notNull(),
    assignedDriverUserId: varchar('assigned_driver_user_id', { length: 25 }).references(
      () => users.id,
    ),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_vehicles_company_idx').on(t.companyId),
    byCompanyActive: index('fleet_vehicles_company_active_idx').on(t.companyId, t.isActive),
    uqCompanyLowerPlate: uniqueIndex('fleet_vehicles_company_lower_plate_uq').on(
      t.companyId,
      sql`lower(${t.plateNumber})`,
    ),
  }),
);

export const fleetFuelLogs = pgTable(
  'fleet_fuel_logs',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    vehicleId: varchar('vehicle_id', { length: 25 })
      .notNull()
      .references(() => fleetVehicles.id),
    logNo: varchar('log_no', { length: 50 }).notNull(),
    liters: doublePrecision('liters').notNull(),
    fuelCostPsw: bigint('fuel_cost_psw', { mode: 'number' }).notNull().default(0),
    odometerKm: integer('odometer_km'),
    stationName: varchar('station_name', { length: 255 }),
    note: text('note'),
    status: smallint('status').notNull().default(FleetFuelLogStatus.SUBMITTED),
    loggedByUserId: varchar('logged_by_user_id', { length: 25 })
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
    byCompany: index('fleet_fuel_logs_company_idx').on(t.companyId),
    byCompanyStatus: index('fleet_fuel_logs_company_status_idx').on(t.companyId, t.status),
    byVehicle: index('fleet_fuel_logs_vehicle_idx').on(t.vehicleId),
    uqCompanyLogNo: uniqueIndex('fleet_fuel_logs_company_log_no_uq').on(t.companyId, t.logNo),
  }),
);
