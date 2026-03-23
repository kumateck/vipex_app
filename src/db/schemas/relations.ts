import { relations } from 'drizzle-orm';
import { companies, branches, locations, roles, rolePermissions, users } from './core';
import { pendingBookings, pickupQueues } from './shipments';
import { receiptTemplates, generatedReceipts } from './receipts';
import {
  customers,
  cards,
  customerCards,
  customerCreditTransactions,
  customerCreditAllocations,
} from './customers';
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
import {
  taxProfiles,
  taxComponents,
  chartOfAccounts,
  companyBankAccounts,
  expenseCategories,
  accountingApprovalPolicies,
  pettyCashFunds,
  journalBatches,
  journalEntries,
  journalLines,
  dailyCashConfirmations,
  expenseRequests,
  pettyCashReplenishments,
  cashToBankTransfers,
  taxFilingPeriods,
  taxJournalItems,
  taxFilingRuns,
  taxFilingAuditLogs,
} from './accounting';

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
  pickupQueues: many(pickupQueues),
  pettyCashFunds: many(pettyCashFunds),
  journalEntries: many(journalEntries),
  journalLines: many(journalLines),
  dailyCashConfirmations: many(dailyCashConfirmations),
  expenseRequests: many(expenseRequests),
  cashToBankTransfers: many(cashToBankTransfers),
  taxJournalItems: many(taxJournalItems),
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
  recordedJournalEntries: many(journalEntries),
  recordedJournalLines: many(journalLines),
  dailyCashConfirmations: many(dailyCashConfirmations),
  expenseRequests: many(expenseRequests),
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
  creditTransactions: many(customerCreditTransactions),
  creditAllocations: many(customerCreditAllocations),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  company: one(companies, { fields: [cards.companyId], references: [companies.id] }),
  customerCards: many(customerCards),
}));

export const customerCardsRelations = relations(customerCards, ({ one }) => ({
  customer: one(customers, { fields: [customerCards.customerId], references: [customers.id] }),
  card: one(cards, { fields: [customerCards.cardId], references: [cards.id] }),
}));

export const customerCreditTransactionsRelations = relations(
  customerCreditTransactions,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerCreditTransactions.customerId],
      references: [customers.id],
    }),
    company: one(companies, {
      fields: [customerCreditTransactions.companyId],
      references: [companies.id],
    }),
  }),
);

export const customerCreditAllocationsRelations = relations(
  customerCreditAllocations,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerCreditAllocations.customerId],
      references: [customers.id],
    }),
    company: one(companies, {
      fields: [customerCreditAllocations.companyId],
      references: [companies.id],
    }),
    chargeTransaction: one(customerCreditTransactions, {
      fields: [customerCreditAllocations.chargeTransactionId],
      references: [customerCreditTransactions.id],
    }),
    paymentTransaction: one(customerCreditTransactions, {
      fields: [customerCreditAllocations.paymentTransactionId],
      references: [customerCreditTransactions.id],
    }),
  }),
);

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
  pickupQueue: one(pickupQueues, { fields: [parcels.id], references: [pickupQueues.parcelId] }),
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

// Accounting
export const taxProfilesRelations = relations(taxProfiles, ({ one, many }) => ({
  company: one(companies, { fields: [taxProfiles.companyId], references: [companies.id] }),
  components: many(taxComponents),
  taxJournalItems: many(taxJournalItems),
}));

export const taxComponentsRelations = relations(taxComponents, ({ one }) => ({
  profile: one(taxProfiles, { fields: [taxComponents.profileId], references: [taxProfiles.id] }),
}));

export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [chartOfAccounts.companyId],
    references: [companies.id],
  }),
  parentAccount: one(chartOfAccounts, {
    fields: [chartOfAccounts.parentAccountId],
    references: [chartOfAccounts.id],
  }),
  bankAccounts: many(companyBankAccounts),
  expenseCategories: many(expenseCategories),
  pettyCashFunds: many(pettyCashFunds),
  journalLines: many(journalLines),
}));

export const companyBankAccountsRelations = relations(companyBankAccounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [companyBankAccounts.companyId],
    references: [companies.id],
  }),
  account: one(chartOfAccounts, {
    fields: [companyBankAccounts.accountId],
    references: [chartOfAccounts.id],
  }),
  expenseRequests: many(expenseRequests),
  pettyCashReplenishments: many(pettyCashReplenishments),
  cashToBankTransfers: many(cashToBankTransfers),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [expenseCategories.companyId],
    references: [companies.id],
  }),
  account: one(chartOfAccounts, {
    fields: [expenseCategories.accountId],
    references: [chartOfAccounts.id],
  }),
  expenseRequests: many(expenseRequests),
}));

export const accountingApprovalPoliciesRelations = relations(
  accountingApprovalPolicies,
  ({ one }) => ({
    company: one(companies, {
      fields: [accountingApprovalPolicies.companyId],
      references: [companies.id],
    }),
  }),
);

export const pettyCashFundsRelations = relations(pettyCashFunds, ({ one, many }) => ({
  company: one(companies, {
    fields: [pettyCashFunds.companyId],
    references: [companies.id],
  }),
  branch: one(branches, { fields: [pettyCashFunds.branchId], references: [branches.id] }),
  account: one(chartOfAccounts, {
    fields: [pettyCashFunds.accountId],
    references: [chartOfAccounts.id],
  }),
  replenishments: many(pettyCashReplenishments),
}));

export const journalBatchesRelations = relations(journalBatches, ({ one, many }) => ({
  company: one(companies, {
    fields: [journalBatches.companyId],
    references: [companies.id],
  }),
  entries: many(journalEntries),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  company: one(companies, {
    fields: [journalEntries.companyId],
    references: [companies.id],
  }),
  batch: one(journalBatches, { fields: [journalEntries.batchId], references: [journalBatches.id] }),
  branch: one(branches, { fields: [journalEntries.branchId], references: [branches.id] }),
  location: one(locations, {
    fields: [journalEntries.locationId],
    references: [locations.id],
  }),
  recorder: one(users, {
    fields: [journalEntries.recordedByUserId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [journalEntries.approvedByUserId],
    references: [users.id],
  }),
  lines: many(journalLines),
  dailyCashConfirmations: many(dailyCashConfirmations),
  expenseRequests: many(expenseRequests),
  pettyCashReplenishments: many(pettyCashReplenishments),
  cashToBankTransfers: many(cashToBankTransfers),
  taxJournalItems: many(taxJournalItems),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  company: one(companies, { fields: [journalLines.companyId], references: [companies.id] }),
  entry: one(journalEntries, { fields: [journalLines.entryId], references: [journalEntries.id] }),
  account: one(chartOfAccounts, {
    fields: [journalLines.accountId],
    references: [chartOfAccounts.id],
  }),
  branch: one(branches, { fields: [journalLines.branchId], references: [branches.id] }),
  location: one(locations, { fields: [journalLines.locationId], references: [locations.id] }),
  recorder: one(users, {
    fields: [journalLines.recordedByUserId],
    references: [users.id],
  }),
}));

export const dailyCashConfirmationsRelations = relations(dailyCashConfirmations, ({ one }) => ({
  company: one(companies, {
    fields: [dailyCashConfirmations.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [dailyCashConfirmations.branchId],
    references: [branches.id],
  }),
  location: one(locations, {
    fields: [dailyCashConfirmations.locationId],
    references: [locations.id],
  }),
  cashier: one(users, {
    fields: [dailyCashConfirmations.cashierUserId],
    references: [users.id],
  }),
  accountant: one(users, {
    fields: [dailyCashConfirmations.accountantUserId],
    references: [users.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [dailyCashConfirmations.journalEntryId],
    references: [journalEntries.id],
  }),
}));

export const expenseRequestsRelations = relations(expenseRequests, ({ one }) => ({
  company: one(companies, {
    fields: [expenseRequests.companyId],
    references: [companies.id],
  }),
  branch: one(branches, { fields: [expenseRequests.branchId], references: [branches.id] }),
  location: one(locations, {
    fields: [expenseRequests.locationId],
    references: [locations.id],
  }),
  category: one(expenseCategories, {
    fields: [expenseRequests.expenseCategoryId],
    references: [expenseCategories.id],
  }),
  requester: one(users, {
    fields: [expenseRequests.requestedByUserId],
    references: [users.id],
  }),
  recorder: one(users, {
    fields: [expenseRequests.recordedByUserId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [expenseRequests.approvedByUserId],
    references: [users.id],
  }),
  payer: one(users, {
    fields: [expenseRequests.paidByUserId],
    references: [users.id],
  }),
  companyBankAccount: one(companyBankAccounts, {
    fields: [expenseRequests.companyBankAccountId],
    references: [companyBankAccounts.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [expenseRequests.journalEntryId],
    references: [journalEntries.id],
  }),
}));

export const pettyCashReplenishmentsRelations = relations(pettyCashReplenishments, ({ one }) => ({
  company: one(companies, {
    fields: [pettyCashReplenishments.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [pettyCashReplenishments.branchId],
    references: [branches.id],
  }),
  pettyCashFund: one(pettyCashFunds, {
    fields: [pettyCashReplenishments.pettyCashFundId],
    references: [pettyCashFunds.id],
  }),
  companyBankAccount: one(companyBankAccounts, {
    fields: [pettyCashReplenishments.companyBankAccountId],
    references: [companyBankAccounts.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [pettyCashReplenishments.journalEntryId],
    references: [journalEntries.id],
  }),
}));

export const cashToBankTransfersRelations = relations(cashToBankTransfers, ({ one }) => ({
  company: one(companies, {
    fields: [cashToBankTransfers.companyId],
    references: [companies.id],
  }),
  branch: one(branches, { fields: [cashToBankTransfers.branchId], references: [branches.id] }),
  location: one(locations, {
    fields: [cashToBankTransfers.locationId],
    references: [locations.id],
  }),
  companyBankAccount: one(companyBankAccounts, {
    fields: [cashToBankTransfers.companyBankAccountId],
    references: [companyBankAccounts.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [cashToBankTransfers.journalEntryId],
    references: [journalEntries.id],
  }),
}));

export const taxFilingPeriodsRelations = relations(taxFilingPeriods, ({ one, many }) => ({
  company: one(companies, {
    fields: [taxFilingPeriods.companyId],
    references: [companies.id],
  }),
  taxItems: many(taxJournalItems),
  runs: many(taxFilingRuns),
}));

export const taxJournalItemsRelations = relations(taxJournalItems, ({ one, many }) => ({
  company: one(companies, {
    fields: [taxJournalItems.companyId],
    references: [companies.id],
  }),
  branch: one(branches, { fields: [taxJournalItems.branchId], references: [branches.id] }),
  location: one(locations, {
    fields: [taxJournalItems.locationId],
    references: [locations.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [taxJournalItems.journalEntryId],
    references: [journalEntries.id],
  }),
  taxProfile: one(taxProfiles, {
    fields: [taxJournalItems.taxProfileId],
    references: [taxProfiles.id],
  }),
  filingPeriod: one(taxFilingPeriods, {
    fields: [taxJournalItems.filingPeriodId],
    references: [taxFilingPeriods.id],
  }),
  auditLogs: many(taxFilingAuditLogs),
}));

export const taxFilingRunsRelations = relations(taxFilingRuns, ({ one }) => ({
  company: one(companies, {
    fields: [taxFilingRuns.companyId],
    references: [companies.id],
  }),
  filingPeriod: one(taxFilingPeriods, {
    fields: [taxFilingRuns.filingPeriodId],
    references: [taxFilingPeriods.id],
  }),
}));

export const taxFilingAuditLogsRelations = relations(taxFilingAuditLogs, ({ one }) => ({
  taxJournalItem: one(taxJournalItems, {
    fields: [taxFilingAuditLogs.taxJournalItemId],
    references: [taxJournalItems.id],
  }),
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

export const pickupQueuesRelations = relations(pickupQueues, ({ one }) => ({
  company: one(companies, { fields: [pickupQueues.companyId], references: [companies.id] }),
  branch: one(branches, { fields: [pickupQueues.branchId], references: [branches.id] }),
  parcel: one(parcels, { fields: [pickupQueues.parcelId], references: [parcels.id] }),
  pickerStaff: one(users, { fields: [pickupQueues.pickerStaffId], references: [users.id] }),
  queuedByUser: one(users, { fields: [pickupQueues.queuedBy], references: [users.id] }),
  endedByUser: one(users, { fields: [pickupQueues.endedBy], references: [users.id] }),
  idCardType: one(cards, { fields: [pickupQueues.idCardTypeId], references: [cards.id] }),
}));

export const receiptTemplatesRelations = relations(receiptTemplates, ({ one }) => ({
  company: one(companies, { fields: [receiptTemplates.companyId], references: [companies.id] }),
}));

export const generatedReceiptsRelations = relations(generatedReceipts, ({ one }) => ({
  company: one(companies, { fields: [generatedReceipts.companyId], references: [companies.id] }),
  printedBy: one(users, { fields: [generatedReceipts.printedBy], references: [users.id] }),
}));
