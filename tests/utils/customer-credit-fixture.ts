import { db, sql } from '@/db/config';
import {
  customerCreditTransactions,
  customers,
  parcels,
  users,
  rolePermissions,
  companyModules,
} from '@/db/schemas';
import { PaymentMethod, UserStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createIsolatedSchemaFixture } from './isolated-schema-fixture';

export async function createCustomerCreditFixture() {
  const fixture = await createIsolatedSchemaFixture('vipex_customer_credit_test');
  await sql.unsafe(await Bun.file('drizzle/0090_credit_adjustment_reference_index.sql').text());
  await db.insert(users).values(
    ['accounts', 'viewer'].map((id) => ({
      id,
      companyId: 'company',
      branchId: 'source',
      roleId: id,
      fullname: id,
      email: `${id}@example.test`,
      telephone: '0200000000',
      createdBy: 'accounts',
      status: UserStatus.ACTIVE,
    })),
  );
  await db
    .insert(rolePermissions)
    .values(
      [
        PermissionKeys.CanReadCustomers,
        PermissionKeys.CanUpdateCustomers,
        PermissionKeys.CanUpdateParcels,
        PermissionKeys.CanCreateCustomerWalletCreditPayments,
        PermissionKeys.CanReadCustomerWalletCredit,
      ].map((permission) => ({ roleId: 'accounts', companyId: 'company', permission })),
    );
  await db
    .insert(companyModules)
    .values({ companyId: 'company', moduleCode: 'customer_wallet_credit', isEnabled: true });
  return {
    cleanup: fixture.cleanup,
    async reset() {
      await sql`truncate parcels, customers, customer_credit_transactions, customer_credit_allocations, payments, audit_logs`;
      await db.insert(customers).values([
        {
          id: 'customer',
          companyId: 'company',
          fullname: 'Business',
          customerType: 1,
          creditEligible: true,
          creditLimitPsw: 100000,
          createdBy: 'accounts',
        },
        {
          id: 'individual',
          companyId: 'company',
          fullname: 'Individual',
          customerType: 0,
          createdBy: 'accounts',
        },
        {
          id: 'foreign',
          companyId: 'other',
          fullname: 'Other',
          customerType: 1,
          createdBy: 'accounts',
        },
      ]);
      for (const [id, amount, customerId, companyId] of [
        ['parcel-a', 5000, 'customer', 'company'],
        ['parcel-b', 2500, 'customer', 'company'],
        ['parcel-other', 9000, 'foreign', 'other'],
      ] as const) {
        await db.insert(parcels).values({
          id,
          bookingCode: `BOOK-${id}`,
          trackingCode: `TRACK-${id}`,
          companyId,
          senderId: customerId,
          receiverId: 'individual',
          sourceId: 'source',
          destinationId: 'destination',
          bookingId: 'booking',
          method: PaymentMethod.CREDIT,
          chargePsw: amount,
          plannedToBePaidPsw: 0,
          status: 5,
          parcelDetails: 'Box',
          parcelContent: 'Clothes',
        });
        await db.insert(customerCreditTransactions).values({
          id: `charge-${id}`,
          companyId,
          customerId,
          sourceType: 0,
          transactionType: 0,
          referenceId: id,
          signedAmountPsw: amount,
          createdBy: 'accounts',
        });
      }
    },
  };
}
