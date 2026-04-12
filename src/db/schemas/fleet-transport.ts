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
import { employees } from './hr';
import { parcels } from './shipments';

export const FleetFuelLogStatus = {
  DRAFT: 0,
  SUBMITTED: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;

export const FleetTripStatus = {
  PLANNED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
} as const;

export const FleetTripEventType = {
  CHECK_IN: 0,
  CHECK_OUT: 1,
} as const;

export const FleetTripLoadMatchStatus = {
  ASSIGNED: 0,
  LOADED: 1,
  UNLOADED: 2,
  CANCELLED: 3,
} as const;

export const FleetTripStatusUpdateType = {
  EN_ROUTE: 0,
  AT_PICKUP: 1,
  AT_DROPOFF: 2,
  DELAYED: 3,
  STOPPED: 4,
} as const;

export const FleetShiftRosterRole = {
  DRIVER: 0,
  CREW: 1,
} as const;

export const FleetShiftRosterStatus = {
  PLANNED: 0,
  COMPLETED: 1,
  CANCELLED: 2,
} as const;

export const FleetComplianceIncidentType = {
  VIOLATION: 0,
  ACCIDENT: 1,
} as const;

export const FleetComplianceIncidentSeverity = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
} as const;

export const FleetPolicyAckStatus = {
  ACKNOWLEDGED: 0,
  REVOKED: 1,
} as const;

export const FleetVehicleOwnershipType = {
  COMPANY_OWNED: 0,
  LEASED: 1,
  THIRD_PARTY: 2,
} as const;

export const FleetVehicleFuelType = {
  PETROL: 0,
  DIESEL: 1,
  ELECTRIC: 2,
  HYBRID: 3,
  GAS: 4,
  OTHER: 5,
} as const;

export const FleetVehicleLifecycleStatus = {
  ACTIVE: 0,
  IN_MAINTENANCE: 1,
  RETIRED: 2,
  DECOMMISSIONED: 3,
} as const;

export const FleetDriverComplianceType = {
  LICENSE: 0,
  TRAINING: 1,
  MEDICAL: 2,
  BACKGROUND_CHECK: 3,
  OTHER: 4,
} as const;

export const FleetMaintenanceIntervalUnit = {
  KM: 0,
  DAYS: 1,
  WEEKS: 2,
  MONTHS: 3,
} as const;

export const FleetMaintenanceWorkOrderStatus = {
  OPEN: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
} as const;

export const fleetRoutePlans = pgTable(
  'fleet_route_plans',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 64 }),
    originLabel: varchar('origin_label', { length: 255 }),
    destinationLabel: varchar('destination_label', { length: 255 }),
    distanceKm: doublePrecision('distance_km'),
    estimatedDurationMin: integer('estimated_duration_min'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_route_plans_company_idx').on(t.companyId),
    byCompanyActive: index('fleet_route_plans_company_active_idx').on(t.companyId, t.isActive),
    byBranch: index('fleet_route_plans_branch_idx').on(t.branchId),
    uqCompanyLowerName: uniqueIndex('fleet_route_plans_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

export const fleetRoutePlanStops = pgTable(
  'fleet_route_plan_stops',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    routePlanId: varchar('route_plan_id', { length: 25 })
      .notNull()
      .references(() => fleetRoutePlans.id),
    sequenceNo: integer('sequence_no').notNull(),
    label: varchar('label', { length: 255 }).notNull(),
    address: varchar('address', { length: 500 }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    plannedArrivalOffsetMin: integer('planned_arrival_offset_min'),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_route_plan_stops_company_idx').on(t.companyId),
    byRoutePlan: index('fleet_route_plan_stops_route_plan_idx').on(t.routePlanId),
    uqRouteSequence: uniqueIndex('fleet_route_plan_stops_route_sequence_uq').on(
      t.routePlanId,
      t.sequenceNo,
    ),
  }),
);

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
    year: integer('year'),
    vin: varchar('vin', { length: 64 }),
    ownershipType: smallint('ownership_type')
      .notNull()
      .default(FleetVehicleOwnershipType.COMPANY_OWNED),
    lessorName: varchar('lessor_name', { length: 255 }),
    leaseStartAt: timestamp('lease_start_at', { withTimezone: false }),
    leaseEndAt: timestamp('lease_end_at', { withTimezone: false }),
    fuelType: smallint('fuel_type').notNull().default(FleetVehicleFuelType.DIESEL),
    expectedKmPerLiter: doublePrecision('expected_km_per_liter'),
    tankCapacityLiters: doublePrecision('tank_capacity_liters'),
    payloadCapacityKg: doublePrecision('payload_capacity_kg'),
    cargoCapacityCbm: doublePrecision('cargo_capacity_cbm'),
    lifecycleStatus: smallint('lifecycle_status')
      .notNull()
      .default(FleetVehicleLifecycleStatus.ACTIVE),
    insuranceExpiryAt: timestamp('insurance_expiry_at', { withTimezone: false }),
    roadworthyExpiryAt: timestamp('roadworthy_expiry_at', { withTimezone: false }),
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

export const fleetVehicleDocuments = pgTable(
  'fleet_vehicle_documents',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    vehicleId: varchar('vehicle_id', { length: 25 })
      .notNull()
      .references(() => fleetVehicles.id),
    documentType: varchar('document_type', { length: 100 }).notNull(),
    documentNumber: varchar('document_number', { length: 100 }),
    issuer: varchar('issuer', { length: 255 }),
    issuedAt: timestamp('issued_at', { withTimezone: false }),
    expiresAt: timestamp('expires_at', { withTimezone: false }),
    fileUrl: varchar('file_url', { length: 500 }),
    note: text('note'),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_vehicle_documents_company_idx').on(t.companyId),
    byVehicle: index('fleet_vehicle_documents_vehicle_idx').on(t.vehicleId),
    byExpiry: index('fleet_vehicle_documents_expiry_idx').on(t.companyId, t.expiresAt),
  }),
);

export const fleetDriverComplianceRecords = pgTable(
  'fleet_driver_compliance_records',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    employeeId: varchar('employee_id', { length: 25 })
      .notNull()
      .references(() => employees.id),
    complianceType: smallint('compliance_type')
      .notNull()
      .default(FleetDriverComplianceType.LICENSE),
    documentNumber: varchar('document_number', { length: 100 }),
    issuer: varchar('issuer', { length: 255 }),
    issuedAt: timestamp('issued_at', { withTimezone: false }),
    expiresAt: timestamp('expires_at', { withTimezone: false }),
    fileUrl: varchar('file_url', { length: 500 }),
    note: text('note'),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_driver_compliance_company_idx').on(t.companyId),
    byEmployee: index('fleet_driver_compliance_employee_idx').on(t.employeeId),
    byExpiry: index('fleet_driver_compliance_expiry_idx').on(t.companyId, t.expiresAt),
  }),
);

export const fleetMaintenancePlans = pgTable(
  'fleet_maintenance_plans',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    vehicleId: varchar('vehicle_id', { length: 25 })
      .notNull()
      .references(() => fleetVehicles.id),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    intervalUnit: smallint('interval_unit').notNull().default(FleetMaintenanceIntervalUnit.DAYS),
    intervalValue: integer('interval_value').notNull().default(30),
    lastServiceAt: timestamp('last_service_at', { withTimezone: false }),
    lastServiceOdometerKm: integer('last_service_odometer_km'),
    nextDueAt: timestamp('next_due_at', { withTimezone: false }),
    nextDueOdometerKm: integer('next_due_odometer_km'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_maintenance_plans_company_idx').on(t.companyId),
    byVehicle: index('fleet_maintenance_plans_vehicle_idx').on(t.vehicleId),
    byDueDate: index('fleet_maintenance_plans_due_date_idx').on(t.companyId, t.nextDueAt),
  }),
);

export const fleetMaintenanceWorkOrders = pgTable(
  'fleet_maintenance_work_orders',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    vehicleId: varchar('vehicle_id', { length: 25 })
      .notNull()
      .references(() => fleetVehicles.id),
    planId: varchar('plan_id', { length: 25 }).references(() => fleetMaintenancePlans.id),
    workOrderNo: varchar('work_order_no', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    openedAt: timestamp('opened_at', { withTimezone: false }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: false }),
    completedAt: timestamp('completed_at', { withTimezone: false }),
    startedOdometerKm: integer('started_odometer_km'),
    completedOdometerKm: integer('completed_odometer_km'),
    estimatedCostPsw: bigint('estimated_cost_psw', { mode: 'number' }).notNull().default(0),
    actualCostPsw: bigint('actual_cost_psw', { mode: 'number' }).notNull().default(0),
    status: smallint('status').notNull().default(FleetMaintenanceWorkOrderStatus.OPEN),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    updatedBy: varchar('updated_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_maintenance_work_orders_company_idx').on(t.companyId),
    byVehicle: index('fleet_maintenance_work_orders_vehicle_idx').on(t.vehicleId),
    byStatus: index('fleet_maintenance_work_orders_status_idx').on(t.companyId, t.status),
    uqCompanyWorkOrderNo: uniqueIndex('fleet_maintenance_work_orders_company_work_order_no_uq').on(
      t.companyId,
      t.workOrderNo,
    ),
  }),
);

export const fleetVehicleDowntimeEvents = pgTable(
  'fleet_vehicle_downtime_events',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    vehicleId: varchar('vehicle_id', { length: 25 })
      .notNull()
      .references(() => fleetVehicles.id),
    workOrderId: varchar('work_order_id', { length: 25 }).references(
      () => fleetMaintenanceWorkOrders.id,
    ),
    reason: varchar('reason', { length: 255 }).notNull(),
    note: text('note'),
    startedAt: timestamp('started_at', { withTimezone: false }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: false }),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    closedBy: varchar('closed_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_vehicle_downtime_company_idx').on(t.companyId),
    byVehicle: index('fleet_vehicle_downtime_vehicle_idx').on(t.vehicleId),
    byStartedAt: index('fleet_vehicle_downtime_started_at_idx').on(t.companyId, t.startedAt),
    byEndedAt: index('fleet_vehicle_downtime_ended_at_idx').on(t.companyId, t.endedAt),
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

export const fleetTrips = pgTable(
  'fleet_trips',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    tripNo: varchar('trip_no', { length: 50 }).notNull(),
    vehicleId: varchar('vehicle_id', { length: 25 })
      .notNull()
      .references(() => fleetVehicles.id),
    routePlanId: varchar('route_plan_id', { length: 25 }).references(() => fleetRoutePlans.id),
    driverEmployeeId: varchar('driver_employee_id', { length: 25 })
      .notNull()
      .references(() => employees.id),
    plannedStartAt: timestamp('planned_start_at', { withTimezone: false }),
    plannedEndAt: timestamp('planned_end_at', { withTimezone: false }),
    startedAt: timestamp('started_at', { withTimezone: false }),
    endedAt: timestamp('ended_at', { withTimezone: false }),
    startOdometerKm: integer('start_odometer_km'),
    endOdometerKm: integer('end_odometer_km'),
    note: text('note'),
    status: smallint('status').notNull().default(FleetTripStatus.PLANNED),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    updatedBy: varchar('updated_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_trips_company_idx').on(t.companyId),
    byCompanyStatus: index('fleet_trips_company_status_idx').on(t.companyId, t.status),
    byVehicle: index('fleet_trips_vehicle_idx').on(t.vehicleId),
    byRoutePlan: index('fleet_trips_route_plan_idx').on(t.routePlanId),
    byDriver: index('fleet_trips_driver_idx').on(t.driverEmployeeId),
    byBranch: index('fleet_trips_branch_idx').on(t.branchId),
    uqCompanyTripNo: uniqueIndex('fleet_trips_company_trip_no_uq').on(t.companyId, t.tripNo),
  }),
);

export const fleetTripCrewAssignments = pgTable(
  'fleet_trip_crew_assignments',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    tripId: varchar('trip_id', { length: 25 })
      .notNull()
      .references(() => fleetTrips.id),
    employeeId: varchar('employee_id', { length: 25 })
      .notNull()
      .references(() => employees.id),
    role: varchar('role', { length: 100 }).notNull().default('crew'),
    assignedBy: varchar('assigned_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_trip_crew_company_idx').on(t.companyId),
    byTrip: index('fleet_trip_crew_trip_idx').on(t.tripId),
    byEmployee: index('fleet_trip_crew_employee_idx').on(t.employeeId),
    uqCompanyTripEmployee: uniqueIndex('fleet_trip_crew_company_trip_employee_uq').on(
      t.companyId,
      t.tripId,
      t.employeeId,
    ),
  }),
);

export const fleetTripEvents = pgTable(
  'fleet_trip_events',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    tripId: varchar('trip_id', { length: 25 })
      .notNull()
      .references(() => fleetTrips.id),
    eventType: smallint('event_type').notNull().default(FleetTripEventType.CHECK_IN),
    occurredAt: timestamp('occurred_at', { withTimezone: false }).notNull().defaultNow(),
    odometerKm: integer('odometer_km'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    locationLabel: varchar('location_label', { length: 255 }),
    note: text('note'),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_trip_events_company_idx').on(t.companyId),
    byTrip: index('fleet_trip_events_trip_idx').on(t.tripId),
    byCompanyTripOccurredAt: index('fleet_trip_events_company_trip_occurred_idx').on(
      t.companyId,
      t.tripId,
      t.occurredAt,
    ),
  }),
);

export const fleetTripLoadMatches = pgTable(
  'fleet_trip_load_matches',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    tripId: varchar('trip_id', { length: 25 })
      .notNull()
      .references(() => fleetTrips.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    status: smallint('status').notNull().default(FleetTripLoadMatchStatus.ASSIGNED),
    matchedBy: varchar('matched_by', { length: 25 }).references(() => users.id),
    matchedAt: timestamp('matched_at', { withTimezone: false }).notNull().defaultNow(),
    loadedAt: timestamp('loaded_at', { withTimezone: false }),
    unloadedAt: timestamp('unloaded_at', { withTimezone: false }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_trip_load_matches_company_idx').on(t.companyId),
    byTrip: index('fleet_trip_load_matches_trip_idx').on(t.tripId),
    byParcel: index('fleet_trip_load_matches_parcel_idx').on(t.parcelId),
    byStatus: index('fleet_trip_load_matches_status_idx').on(t.companyId, t.status),
    uqCompanyTripParcel: uniqueIndex('fleet_trip_load_matches_company_trip_parcel_uq').on(
      t.companyId,
      t.tripId,
      t.parcelId,
    ),
  }),
);

export const fleetTripTelemetryPoints = pgTable(
  'fleet_trip_telemetry_points',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    tripId: varchar('trip_id', { length: 25 })
      .notNull()
      .references(() => fleetTrips.id),
    sampledAt: timestamp('sampled_at', { withTimezone: false }).notNull().defaultNow(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    speedKph: doublePrecision('speed_kph'),
    headingDeg: doublePrecision('heading_deg'),
    altitudeM: doublePrecision('altitude_m'),
    accuracyM: doublePrecision('accuracy_m'),
    source: varchar('source', { length: 50 }),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_trip_telemetry_company_idx').on(t.companyId),
    byTrip: index('fleet_trip_telemetry_trip_idx').on(t.tripId),
    byTripSampledAt: index('fleet_trip_telemetry_trip_sampled_idx').on(t.tripId, t.sampledAt),
  }),
);

export const fleetTripStatusUpdates = pgTable(
  'fleet_trip_status_updates',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    tripId: varchar('trip_id', { length: 25 })
      .notNull()
      .references(() => fleetTrips.id),
    statusType: smallint('status_type').notNull().default(FleetTripStatusUpdateType.EN_ROUTE),
    occurredAt: timestamp('occurred_at', { withTimezone: false }).notNull().defaultNow(),
    locationLabel: varchar('location_label', { length: 255 }),
    note: text('note'),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_trip_status_updates_company_idx').on(t.companyId),
    byTrip: index('fleet_trip_status_updates_trip_idx').on(t.tripId),
    byTripOccurredAt: index('fleet_trip_status_updates_trip_occurred_idx').on(
      t.tripId,
      t.occurredAt,
    ),
  }),
);

export const fleetShiftRosters = pgTable(
  'fleet_shift_rosters',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    employeeId: varchar('employee_id', { length: 25 })
      .notNull()
      .references(() => employees.id),
    vehicleId: varchar('vehicle_id', { length: 25 }).references(() => fleetVehicles.id),
    roleType: smallint('role_type').notNull().default(FleetShiftRosterRole.DRIVER),
    status: smallint('status').notNull().default(FleetShiftRosterStatus.PLANNED),
    shiftStartAt: timestamp('shift_start_at', { withTimezone: false }).notNull(),
    shiftEndAt: timestamp('shift_end_at', { withTimezone: false }).notNull(),
    note: text('note'),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    updatedBy: varchar('updated_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_shift_rosters_company_idx').on(t.companyId),
    byBranch: index('fleet_shift_rosters_branch_idx').on(t.branchId),
    byEmployee: index('fleet_shift_rosters_employee_idx').on(t.employeeId),
    byVehicle: index('fleet_shift_rosters_vehicle_idx').on(t.vehicleId),
    byWindow: index('fleet_shift_rosters_window_idx').on(t.companyId, t.shiftStartAt, t.shiftEndAt),
    byStatus: index('fleet_shift_rosters_status_idx').on(t.companyId, t.status),
  }),
);

export const fleetMaintenanceParts = pgTable(
  'fleet_maintenance_parts',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    sku: varchar('sku', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }),
    unit: varchar('unit', { length: 30 }).notNull().default('unit'),
    qtyOnHand: doublePrecision('qty_on_hand').notNull().default(0),
    reorderLevel: doublePrecision('reorder_level').notNull().default(0),
    averageUnitCostPsw: bigint('average_unit_cost_psw', { mode: 'number' }).notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    note: text('note'),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    updatedBy: varchar('updated_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_maintenance_parts_company_idx').on(t.companyId),
    byBranch: index('fleet_maintenance_parts_branch_idx').on(t.branchId),
    byCompanyActive: index('fleet_maintenance_parts_company_active_idx').on(
      t.companyId,
      t.isActive,
    ),
    uqCompanySku: uniqueIndex('fleet_maintenance_parts_company_sku_uq').on(t.companyId, t.sku),
  }),
);

export const fleetMaintenancePartMovements = pgTable(
  'fleet_maintenance_part_movements',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    partId: varchar('part_id', { length: 25 })
      .notNull()
      .references(() => fleetMaintenanceParts.id),
    workOrderId: varchar('work_order_id', { length: 25 }).references(
      () => fleetMaintenanceWorkOrders.id,
    ),
    quantity: doublePrecision('quantity').notNull(),
    unitCostPsw: bigint('unit_cost_psw', { mode: 'number' }).notNull().default(0),
    movementType: smallint('movement_type').notNull().default(0), // 0=in, 1=out, 2=adjustment
    note: text('note'),
    movedBy: varchar('moved_by', { length: 25 }).references(() => users.id),
    movedAt: timestamp('moved_at', { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_part_movements_company_idx').on(t.companyId),
    byPart: index('fleet_part_movements_part_idx').on(t.partId),
    byWorkOrder: index('fleet_part_movements_work_order_idx').on(t.workOrderId),
    byMovedAt: index('fleet_part_movements_moved_at_idx').on(t.companyId, t.movedAt),
  }),
);

export const fleetComplianceIncidents = pgTable(
  'fleet_compliance_incidents',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    tripId: varchar('trip_id', { length: 25 }).references(() => fleetTrips.id),
    vehicleId: varchar('vehicle_id', { length: 25 }).references(() => fleetVehicles.id),
    employeeId: varchar('employee_id', { length: 25 }).references(() => employees.id),
    incidentType: smallint('incident_type')
      .notNull()
      .default(FleetComplianceIncidentType.VIOLATION),
    severity: smallint('severity').notNull().default(FleetComplianceIncidentSeverity.LOW),
    occurredAt: timestamp('occurred_at', { withTimezone: false }).notNull(),
    locationLabel: varchar('location_label', { length: 255 }),
    description: text('description').notNull(),
    actionTaken: text('action_taken'),
    resolvedAt: timestamp('resolved_at', { withTimezone: false }),
    reportedBy: varchar('reported_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_compliance_incidents_company_idx').on(t.companyId),
    byType: index('fleet_compliance_incidents_type_idx').on(t.companyId, t.incidentType),
    bySeverity: index('fleet_compliance_incidents_severity_idx').on(t.companyId, t.severity),
    byOccurredAt: index('fleet_compliance_incidents_occurred_idx').on(t.companyId, t.occurredAt),
    byEmployee: index('fleet_compliance_incidents_employee_idx').on(t.employeeId),
    byVehicle: index('fleet_compliance_incidents_vehicle_idx').on(t.vehicleId),
  }),
);

export const fleetPolicyAcknowledgments = pgTable(
  'fleet_policy_acknowledgments',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    employeeId: varchar('employee_id', { length: 25 }).references(() => employees.id),
    userId: varchar('user_id', { length: 25 }).references(() => users.id),
    policyCode: varchar('policy_code', { length: 100 }).notNull(),
    policyVersion: varchar('policy_version', { length: 30 }).notNull(),
    status: smallint('status').notNull().default(FleetPolicyAckStatus.ACKNOWLEDGED),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: false }).notNull().defaultNow(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('fleet_policy_ack_company_idx').on(t.companyId),
    byEmployee: index('fleet_policy_ack_employee_idx').on(t.employeeId),
    byUser: index('fleet_policy_ack_user_idx').on(t.userId),
    byPolicy: index('fleet_policy_ack_policy_idx').on(t.companyId, t.policyCode, t.policyVersion),
    uqAck: uniqueIndex('fleet_policy_ack_company_subject_policy_uq').on(
      t.companyId,
      t.employeeId,
      t.userId,
      t.policyCode,
      t.policyVersion,
    ),
  }),
);
