import { relations } from 'drizzle-orm';
import {
  companies,
  branches,
  locations,
  statuses,
  roles,
  permissions,
  rolePermissions,
  users,
} from './core';
import { customers, cards, customerCards } from './customers';
import { cashierSessionTypes, cashierSessions } from './cashiers';
import { bookings, parcels, consignments, consignmentItems } from './shipments';
import { deliveries } from './deliveries';
import { payments } from './payments';
import {
  productCategories,
  products,
  inventoryLocations,
  stockLevels,
  stockMovements,
  stockAdjustments,
  stockTransfers,
  stockTransferItems,
} from './inventory';

// Core
export const companiesRelations = relations(companies, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  roles: many(roles),
  permissions: many(permissions),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  company: one(companies, { fields: [branches.companyId], references: [companies.id] }),
  locations: many(locations),
  users: many(users),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  company: one(companies, { fields: [locations.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [locations.branchId], references: [branches.id] }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  company: one(companies, { fields: [roles.companyId], references: [companies.id] }),
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  branch: one(branches, { fields: [users.branchId], references: [branches.id] }),
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  cashierSessions: many(cashierSessions),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  company: one(companies, { fields: [permissions.companyId], references: [companies.id] }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  company: one(companies, { fields: [rolePermissions.companyId], references: [companies.id] }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// Customers (company-scoped; no branch relation)
export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, { fields: [customers.companyId], references: [companies.id] }),
  parcelsSent: many(parcels),
  parcelsReceived: many(parcels),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  company: one(companies, { fields: [cards.companyId], references: [companies.id] }),
  customerCards: many(customerCards),
}));

export const customerCardsRelations = relations(customerCards, ({ one }) => ({
  customer: one(customers, { fields: [customerCards.customerId], references: [customers.id] }),
  card: one(cards, { fields: [customerCards.cardId], references: [cards.id] }),
}));

// Cashiers
export const cashierSessionTypesRelations = relations(cashierSessionTypes, ({ many }) => ({
  sessions: many(cashierSessions),
}));

export const cashierSessionsRelations = relations(cashierSessions, ({ one }) => ({
  cashier: one(users, { fields: [cashierSessions.cashierId], references: [users.id] }),
  branch: one(branches, { fields: [cashierSessions.branchId], references: [branches.id] }),
  sessionType: one(cashierSessionTypes, {
    fields: [cashierSessions.sessionTypeId],
    references: [cashierSessionTypes.id],
  }),
}));

// Shipments
export const bookingsRelations = relations(bookings, ({ one }) => ({
  company: one(companies, { fields: [bookings.companyId], references: [companies.id] }),
  source: one(branches, { fields: [bookings.sourceId], references: [branches.id] }),
  status: one(statuses, { fields: [bookings.statusId], references: [statuses.id] }),
  creator: one(users, { fields: [bookings.createdBy], references: [users.id] }),
}));

export const parcelsRelations = relations(parcels, ({ one }) => ({
  company: one(companies, { fields: [parcels.companyId], references: [companies.id] }),
  source: one(branches, { fields: [parcels.sourceId], references: [branches.id] }),
  destination: one(branches, { fields: [parcels.destinationId], references: [branches.id] }),
  booking: one(bookings, { fields: [parcels.bookingId], references: [bookings.id] }),
  sender: one(customers, { fields: [parcels.senderId], references: [customers.id] }),
  receiver: one(customers, { fields: [parcels.receiverId], references: [customers.id] }),
  status: one(statuses, { fields: [parcels.statusId], references: [statuses.id] }),
}));

export const consignmentsRelations = relations(consignments, ({ one, many }) => ({
  company: one(companies, { fields: [consignments.companyId], references: [companies.id] }),
  source: one(branches, { fields: [consignments.sourceId], references: [branches.id] }),
  destination: one(branches, { fields: [consignments.destinationId], references: [branches.id] }),
  creator: one(users, { fields: [consignments.createdBy], references: [users.id] }),
  items: many(consignmentItems),
}));

export const consignmentItemsRelations = relations(consignmentItems, ({ one }) => ({
  consignment: one(consignments, {
    fields: [consignmentItems.consignmentId],
    references: [consignments.id],
  }),
  parcel: one(parcels, { fields: [consignmentItems.parcelId], references: [parcels.id] }),
}));

// Deliveries
export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  parcel: one(parcels, { fields: [deliveries.parcelId], references: [parcels.id] }),
  createdBy: one(users, { fields: [deliveries.createdBy], references: [users.id] }),
  deliveredBy: one(users, { fields: [deliveries.deliveryUserId], references: [users.id] }),
  rider: one(users, { fields: [deliveries.riderUserId], references: [users.id] }),
  confirmer: one(users, { fields: [deliveries.confirmedBy], references: [users.id] }),
}));

// Payments
export const paymentsRelations = relations(payments, ({ one }) => ({
  parcel: one(parcels, { fields: [payments.parcelId], references: [parcels.id] }),
}));

// Inventory
export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  company: one(companies, { fields: [productCategories.companyId], references: [companies.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  company: one(companies, { fields: [products.companyId], references: [companies.id] }),
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  stockLevels: many(stockLevels),
  stockMovements: many(stockMovements),
  transferItems: many(stockTransferItems),
}));

export const inventoryLocationsRelations = relations(inventoryLocations, ({ one, many }) => ({
  branch: one(branches, { fields: [inventoryLocations.branchId], references: [branches.id] }),
  stockLevels: many(stockLevels),
  stockMovements: many(stockMovements),
  transfersFrom: many(stockTransfers),
  transfersTo: many(stockTransfers),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  product: one(products, { fields: [stockLevels.productId], references: [products.id] }),
  location: one(inventoryLocations, {
    fields: [stockLevels.locationId],
    references: [inventoryLocations.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, { fields: [stockMovements.productId], references: [products.id] }),
  location: one(inventoryLocations, {
    fields: [stockMovements.locationId],
    references: [inventoryLocations.id],
  }),
  adjustment: one(stockAdjustments, {
    fields: [stockMovements.id],
    references: [stockAdjustments.movementId],
  }),
}));

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ one }) => ({
  movement: one(stockMovements, {
    fields: [stockAdjustments.movementId],
    references: [stockMovements.id],
  }),
  approver: one(users, { fields: [stockAdjustments.approvedBy], references: [users.id] }),
}));

export const stockTransfersRelations = relations(stockTransfers, ({ one, many }) => ({
  fromLocation: one(inventoryLocations, {
    fields: [stockTransfers.fromLocationId],
    references: [inventoryLocations.id],
  }),
  toLocation: one(inventoryLocations, {
    fields: [stockTransfers.toLocationId],
    references: [inventoryLocations.id],
  }),
  requester: one(users, { fields: [stockTransfers.requestedBy], references: [users.id] }),
  approver: one(users, { fields: [stockTransfers.approvedBy], references: [users.id] }),
  items: many(stockTransferItems),
}));

export const stockTransferItemsRelations = relations(stockTransferItems, ({ one }) => ({
  transfer: one(stockTransfers, {
    fields: [stockTransferItems.transferId],
    references: [stockTransfers.id],
  }),
  product: one(products, { fields: [stockTransferItems.productId], references: [products.id] }),
}));
