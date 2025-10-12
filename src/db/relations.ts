import { relations } from 'drizzle-orm';
import {
  companies,
  branches,
  customers,
  cards,
  customerCards,
  statuses,
  roles,
  users,
  permissions,
  rolePermissions,
  locations,
  cashierSessionTypes,
  cashierSessions,
  bookings,
  consignments,
  parcels,
  deliveries,
} from './schema';

// Company -> Branches, Users, Roles, Permissions
export const companiesRelations = relations(companies, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  roles: many(roles),
  permissions: many(permissions),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  company: one(companies, {
    fields: [branches.companyId],
    references: [companies.id],
  }),
  locations: many(locations),
  users: many(users),
  bookingsFrom: many(bookings, { relationName: 'bookings_source' }),
  bookingsTo: many(bookings, { relationName: 'bookings_destination' }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [customers.branchId],
    references: [branches.id],
  }),
  parcelsSent: many(parcels, { relationName: 'parcels_sender' }),
  parcelsReceived: many(parcels, { relationName: 'parcels_receiver' }),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  company: one(companies, {
    fields: [cards.companyId],
    references: [companies.id],
  }),
  customerCards: many(customerCards),
}));

export const customerCardsRelations = relations(customerCards, ({ one }) => ({
  customer: one(customers, {
    fields: [customerCards.customerId],
    references: [customers.id],
  }),
  card: one(cards, {
    fields: [customerCards.cardId],
    references: [cards.id],
  }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  company: one(companies, {
    fields: [roles.companyId],
    references: [companies.id],
  }),
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  bookingsCreated: many(bookings),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  company: one(companies, {
    fields: [permissions.companyId],
    references: [companies.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  company: one(companies, {
    fields: [rolePermissions.companyId],
    references: [companies.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  branch: one(branches, {
    fields: [locations.branchId],
    references: [branches.id],
  }),
}));

export const cashierSessionTypesRelations = relations(cashierSessionTypes, ({ many }) => ({
  sessions: many(cashierSessions),
}));

export const cashierSessionsRelations = relations(cashierSessions, ({ one, many }) => ({
  cashier: one(users, {
    fields: [cashierSessions.cashierId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [cashierSessions.branchId],
    references: [branches.id],
  }),
  sessionType: one(cashierSessionTypes, {
    fields: [cashierSessions.sessionTypeId],
    references: [cashierSessionTypes.id],
  }),
  bookings: many(bookings),
  parcels: many(parcels),
  deliveries: many(deliveries),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  company: one(companies, {
    fields: [bookings.companyId],
    references: [companies.id],
  }),
  source: one(branches, {
    fields: [bookings.sourceId],
    references: [branches.id],
    relationName: 'bookings_source',
  }),
  destination: one(branches, {
    fields: [bookings.destinationId],
    references: [branches.id],
    relationName: 'bookings_destination',
  }),
  status: one(statuses, {
    fields: [bookings.statusId],
    references: [statuses.id],
  }),
  creator: one(users, {
    fields: [bookings.createdBy],
    references: [users.id],
  }),
  cashierSession: one(cashierSessions, {
    fields: [bookings.cashierSessionId],
    references: [cashierSessions.id],
  }),
}));

export const consignmentsRelations = relations(consignments, ({ one }) => ({
  company: one(companies, {
    fields: [consignments.companyId],
    references: [companies.id],
  }),
  source: one(branches, {
    fields: [consignments.sourceId],
    references: [branches.id],
  }),
  destination: one(branches, {
    fields: [consignments.destinationId],
    references: [branches.id],
  }),
  creator: one(users, {
    fields: [consignments.createdBy],
    references: [users.id],
  }),
}));

export const parcelsRelations = relations(parcels, ({ one }) => ({
  company: one(companies, {
    fields: [parcels.companyId],
    references: [companies.id],
  }),
  source: one(branches, {
    fields: [parcels.sourceId],
    references: [branches.id],
  }),
  destination: one(branches, {
    fields: [parcels.destinationId],
    references: [branches.id],
  }),
  booking: one(bookings, {
    fields: [parcels.bookingCode],
    references: [bookings.bookingCode],
  }),
  sender: one(customers, {
    fields: [parcels.senderId],
    references: [customers.id],
    relationName: 'parcels_sender',
  }),
  receiver: one(customers, {
    fields: [parcels.receiverId],
    references: [customers.id],
    relationName: 'parcels_receiver',
  }),
  status: one(statuses, {
    fields: [parcels.statusId],
    references: [statuses.id],
  }),
  cashierSession: one(cashierSessions, {
    fields: [parcels.cashierSessionId],
    references: [cashierSessions.id],
  }),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  parcel: one(parcels, {
    fields: [deliveries.parcelId],
    references: [parcels.id],
  }),
  createdBy: one(users, {
    fields: [deliveries.createdBy],
    references: [users.id],
  }),
  deliveredBy: one(users, {
    fields: [deliveries.deliveredBy],
    references: [users.id],
  }),
  confirmedBy: one(users, {
    fields: [deliveries.confirmedBy],
    references: [users.id],
  }),
  cashierSession: one(cashierSessions, {
    fields: [deliveries.cashierSessionId],
    references: [cashierSessions.id],
  }),
}));
