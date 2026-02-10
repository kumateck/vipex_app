import {
  pgTable,
  varchar,
  timestamp,
  bigint,
  index,
  uniqueIndex,
  smallint,
  integer,
  boolean,
  json,
} from 'drizzle-orm/pg-core';
import { companies, branches, users } from './core';
import { consignments } from './shipments';
import { ConsignmentStatus, AutoGroupingMode } from './enums';
import { createId } from '@paralleldrive/cuid2';

// Enhanced consignment configurations
export const consignmentConfigs = pgTable(
  'consignment_configs',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),

    // Auto-grouping settings
    autoGroupingMode: smallint('auto_grouping_mode')
      .notNull()
      .default(AutoGroupingMode.BY_DESTINATION),
    minParcelCount: integer('min_parcel_count').notNull().default(5), // Minimum parcels to create consignment
    maxParcelCount: integer('max_parcel_count').notNull().default(50), // Maximum parcels per consignment
    maxWeightKg: smallint('max_weight_kg').notNull().default(100), // Maximum weight per consignment

    // Grouping schedules
    groupingSchedule: json('grouping_schedule'), // Cron-like schedules
    maxWaitMinutes: integer('max_wait_minutes').notNull().default(120), // Max wait time before auto-grouping

    // Route-specific settings
    sourceBranchId: varchar('source_branch_id', { length: 25 }).references(() => branches.id),
    destinationBranchId: varchar('destination_branch_id', { length: 25 }).references(
      () => branches.id,
    ),

    // Shipping preferences
    preferredShippingTime: varchar('preferred_shipping_time', { length: 10 }), // "09:00", "14:00"
    maxTransitTimeHours: integer('max_transit_time_hours').notNull().default(48), // Maximum expected transit time

    // Active flag
    isActive: boolean('is_active').notNull().default(true),

    // Audit fields
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('consignment_configs_company_idx').on(t.companyId),
    byRoute: index('consignment_configs_route_idx').on(t.sourceBranchId, t.destinationBranchId),
    byMode: index('consignment_configs_mode_idx').on(t.autoGroupingMode),
    uqCompanyRoute: uniqueIndex('consignment_configs_company_route_uq').on(
      t.companyId,
      t.sourceBranchId,
      t.destinationBranchId,
    ),
  }),
);

// Consignment manifest for shipping
export const consignmentManifests = pgTable(
  'consignment_manifests',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    consignmentId: varchar('consignment_id', { length: 25 })
      .notNull()
      .references(() => consignments.id),

    // Manifest details
    manifestNumber: varchar('manifest_number', { length: 255 }).notNull(),
    totalParcels: integer('total_parcels').notNull(),
    totalWeight: smallint('total_weight'),
    totalValuePsw: bigint('total_value_psw', { mode: 'number' }).notNull(),

    // Shipping information
    carrierName: varchar('carrier_name', { length: 255 }),
    vehicleNumber: varchar('vehicle_number', { length: 50 }),
    driverName: varchar('driver_name', { length: 255 }),
    driverContact: varchar('driver_contact', { length: 50 }),

    // Route and timing
    routeDescription: varchar('route_description', { length: 500 }),
    estimatedDepartureTime: timestamp('estimated_departure_time', { withTimezone: false }),
    estimatedArrivalTime: timestamp('estimated_arrival_time', { withTimezone: false }),
    actualDepartureTime: timestamp('actual_departure_time', { withTimezone: false }),
    actualArrivalTime: timestamp('actual_arrival_time', { withTimezone: false }),

    // Status tracking
    status: smallint('status').notNull().default(ConsignmentStatus.PREPARING),

    // Quality control
    qualityCheckedBy: varchar('quality_checked_by', { length: 25 }).references(() => users.id),
    qualityCheckedAt: timestamp('quality_checked_at', { withTimezone: false }),
    qualityNotes: varchar('quality_notes', { length: 1000 }),

    // Audit fields
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byConsignment: index('consignment_manifests_consignment_idx').on(t.consignmentId),
    byStatus: index('consignment_manifests_status_idx').on(t.status),
    uqManifestNumber: uniqueIndex('consignment_manifests_manifest_number_uq').on(t.manifestNumber),
  }),
);

// Parcel grouping suggestions
export const consignmentSuggestions = pgTable(
  'consignment_suggestions',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 }).notNull(),
    sourceBranchId: varchar('source_branch_id', { length: 25 }).notNull(),

    // Grouping criteria
    destinationBranchId: varchar('destination_branch_id', { length: 25 }).notNull(),
    parcelIds: json('parcel_ids').notNull(), // Array of parcel UUIDs

    // Suggested groupings
    suggestedGroupings: json('suggested_groupings').notNull(), // AI/algorithm suggestions

    // Metrics for suggestions
    totalValuePsw: bigint('total_value_psw', { mode: 'number' }).notNull(),
    totalWeight: smallint('total_weight'),
    parcelCount: integer('parcel_count').notNull(),
    efficiencyScore: smallint('efficiency_score'), // 0-100 efficiency rating

    // Status
    status: varchar('status', { length: 20 }).default('PENDING'), // PENDING | ACCEPTED | REJECTED
    reviewedBy: varchar('reviewed_by', { length: 25 }).references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: false }),
    notes: varchar('notes', { length: 1000 }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: false }),
  },
  (t) => ({
    bySourceBranch: index('consignment_suggestions_source_branch_idx').on(t.sourceBranchId),
    byDestination: index('consignment_suggestions_destination_branch_idx').on(
      t.destinationBranchId,
    ),
    byStatus: index('consignment_suggestions_status_idx').on(t.status),
    byEfficiency: index('consignment_suggestions_efficiency_idx').on(t.efficiencyScore),
  }),
);

// Consignment tracking events
export const consignmentTrackingEvents = pgTable(
  'consignment_tracking_events',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    consignmentId: varchar('consignment_id', { length: 25 })
      .notNull()
      .references(() => consignments.id),

    // Event details
    eventType: varchar('event_type', { length: 50 }).notNull(), // PICKUP | IN_TRANSIT | ARRIVAL | DELIVERY
    eventLocation: varchar('event_location', { length: 255 }),
    eventDescription: varchar('event_description', { length: 1000 }),

    // Coordinates (optional)
    latitude: varchar('latitude', { length: 20 }),
    longitude: varchar('longitude', { length: 20 }),

    // Photos/documents
    photoUrl: varchar('photo_url', { length: 500 }),
    documentUrl: varchar('document_url', { length: 500 }),

    // Timestamp and user
    eventTime: timestamp('event_time', { withTimezone: false }).notNull(),
    recordedBy: varchar('recorded_by', { length: 25 }).references(() => users.id),

    // Metadata
    metadata: json('metadata'), // Additional event-specific data
  },
  (t) => ({
    byConsignment: index('consignment_tracking_events_consignment_idx').on(t.consignmentId),
    byEventType: index('consignment_tracking_events_event_type_idx').on(t.eventType),
    byEventTime: index('consignment_tracking_events_event_time_idx').on(t.eventTime),
  }),
);
