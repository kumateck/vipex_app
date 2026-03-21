import { relations } from 'drizzle-orm';
import { companies, branches, locations, roles, rolePermissions, users } from './core';
import { pendingBookings } from './shipments';
import { receiptTemplates, generatedReceipts } from './receipts';
import { customers, cards, customerCards } from './customers';
import { cashierSessionTypes, cashierSessions } from './shifts';
import { shiftTypes } from './shifts';
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
} from './inventory';

// Core
export const companiesRelations = relations(companies, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  roles: many(roles),
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
  location: one(locations, { fields: [users.locationId], references: [locations.id] }),
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  cashierSessions: many(cashierSessions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  company: one(companies, { fields: [rolePermissions.companyId], references: [companies.id] }),
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
  shiftType: one(shiftTypes, {
    fields: [cashierSessions.shiftTypeId],
    references: [shiftTypes.id],
  }),
}));

// Shipments
export const bookingsRelations = relations(bookings, ({ one }) => ({
  company: one(companies, { fields: [bookings.companyId], references: [companies.id] }),
  source: one(branches, { fields: [bookings.sourceId], references: [branches.id] }),
  creator: one(users, { fields: [bookings.createdBy], references: [users.id] }),
}));

export const parcelsRelations = relations(parcels, ({ one }) => ({
  company: one(companies, { fields: [parcels.companyId], references: [companies.id] }),
  source: one(branches, { fields: [parcels.sourceId], references: [branches.id] }),
  destination: one(branches, { fields: [parcels.destinationId], references: [branches.id] }),
  booking: one(bookings, { fields: [parcels.bookingId], references: [bookings.id] }),
  sender: one(customers, { fields: [parcels.senderId], references: [customers.id] }),
  receiver: one(customers, { fields: [parcels.receiverId], references: [customers.id] }),
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
  stockAdjustments: many(stockAdjustments),
  stockTransfers: many(stockTransfers),
}));

export const inventoryLocationsRelations = relations(inventoryLocations, ({ one, many }) => ({
  company: one(companies, { fields: [inventoryLocations.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [inventoryLocations.branchId], references: [branches.id] }),
  stockLevels: many(stockLevels),
  stockMovements: many(stockMovements),
  stockAdjustments: many(stockAdjustments),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  company: one(companies, { fields: [stockLevels.companyId], references: [companies.id] }),
  product: one(products, { fields: [stockLevels.productId], references: [products.id] }),
  location: one(inventoryLocations, {
    fields: [stockLevels.locationId],
    references: [inventoryLocations.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  company: one(companies, { fields: [stockMovements.companyId], references: [companies.id] }),
  product: one(products, { fields: [stockMovements.productId], references: [products.id] }),
  location: one(inventoryLocations, {
    fields: [stockMovements.locationId],
    references: [inventoryLocations.id],
  }),
  creator: one(users, { fields: [stockMovements.createdBy], references: [users.id] }),
}));

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ one }) => ({
  company: one(companies, { fields: [stockAdjustments.companyId], references: [companies.id] }),
  product: one(products, { fields: [stockAdjustments.productId], references: [products.id] }),
  location: one(inventoryLocations, {
    fields: [stockAdjustments.locationId],
    references: [inventoryLocations.id],
  }),
  creator: one(users, { fields: [stockAdjustments.createdBy], references: [users.id] }),
}));

export const stockTransfersRelations = relations(stockTransfers, ({ one }) => ({
  company: one(companies, { fields: [stockTransfers.companyId], references: [companies.id] }),
  product: one(products, { fields: [stockTransfers.productId], references: [products.id] }),
  fromLocation: one(inventoryLocations, {
    fields: [stockTransfers.fromLocationId],
    references: [inventoryLocations.id],
  }),
  toLocation: one(inventoryLocations, {
    fields: [stockTransfers.toLocationId],
    references: [inventoryLocations.id],
  }),
  creator: one(users, { fields: [stockTransfers.createdBy], references: [users.id] }),
  completer: one(users, { fields: [stockTransfers.completedBy], references: [users.id] }),
}));

// Receipt System Relations
export const pendingBookingsRelations = relations(pendingBookings, ({ one }) => ({
  company: one(companies, { fields: [pendingBookings.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [pendingBookings.branchId], references: [branches.id] }),
  attendant: one(users, { fields: [pendingBookings.attendantId], references: [users.id] }),
}));

export const receiptTemplatesRelations = relations(receiptTemplates, ({ one }) => ({
  company: one(companies, { fields: [receiptTemplates.companyId], references: [companies.id] }),
}));

export const generatedReceiptsRelations = relations(generatedReceipts, ({ one }) => ({
  company: one(companies, { fields: [generatedReceipts.companyId], references: [companies.id] }),
  printedBy: one(users, { fields: [generatedReceipts.printedBy], references: [users.id] }),
}));
