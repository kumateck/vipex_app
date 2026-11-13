import { SQL } from 'drizzle-orm';
import { getTableConfig, PgDialect, type AnyPgTable } from 'drizzle-orm/pg-core';
import { db, sql } from '@/db/config';
import {
  auditLogs,
  customers,
  customerCreditTransactions,
  deliveries,
  locations,
  parcelInternalHolders,
  receivingOffices,
  parcelReceiverOtps,
  refreshTokens,
  parcels,
} from '@/db/schemas';
import { findCorrectionParcels } from '@/server/features/shipments/customer-corrections';
import type { CustomerCorrectionInput } from '@/shared/shipments/parcel-customer-correction';

const tables = [
  customers,
  parcels,
  auditLogs,
  deliveries,
  locations,
  parcelInternalHolders,
  receivingOffices,
  parcelReceiverOtps,
  customerCreditTransactions,
  refreshTokens,
] as AnyPgTable[];
const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;

export async function createCustomerCorrectionFixture() {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.pathname !== '/vipex_customer_corrections_test'
  ) {
    throw new Error(
      'Corrections tests require the isolated local vipex_customer_corrections_test database',
    );
  }
  const [row] =
    await sql`select count(*)::int as count from information_schema.tables where table_schema='public'`;
  if (row?.count !== 0) throw new Error('Customer correction test database must be empty');
  const dialect = new PgDialect();
  for (const table of tables) {
    const config = getTableConfig(table);
    const columns = config.columns.map((column) => {
      const value = column.default;
      const defaultSql =
        value instanceof SQL
          ? dialect.sqlToQuery(value).sql
          : typeof value === 'string'
            ? `'${value.replace(/'/g, "''")}'`
            : Array.isArray(value)
              ? `'${JSON.stringify(value).replace(/'/g, "''")}'`
              : value == null
                ? null
                : String(value);
      return `${quote(column.name)} ${column.getSQLType()}${column.notNull ? ' NOT NULL' : ''}${column.primary ? ' PRIMARY KEY' : ''}${defaultSql == null ? '' : ` DEFAULT ${defaultSql}`}`;
    });
    await sql.unsafe(`CREATE TABLE ${quote(config.name)} (${columns.join(', ')})`);
  }
  const initial = await Bun.file('drizzle/0073_parcel_customer_name_snapshots.sql').text();
  const handoverMigration = await Bun.file('drizzle/0094_receiver_cashier_signature.sql').text();
  const handoverCheck = handoverMigration
    .split('--> statement-breakpoint')
    .find((statement) => statement.includes('ADD CONSTRAINT'));
  if (!handoverCheck) throw new Error('Receiver handover constraint is missing');
  await sql.unsafe(handoverCheck);
  await sql.unsafe(initial.slice(initial.indexOf('CREATE OR REPLACE FUNCTION')));
  await sql.unsafe(await Bun.file('drizzle/0095_parcel_customer_corrections.sql').text());
  return {
    async reset() {
      for (const table of [...tables].reverse()) await db.delete(table);
      await db.insert(customers).values([
        {
          id: 'sender',
          companyId: 'company',
          fullname: 'Sender',
          telephone: '0241111111',
          createdBy: 'actor',
        },
        {
          id: 'receiver',
          companyId: 'company',
          fullname: 'Wrong Receiver',
          telephone: '0540345985',
          createdBy: 'actor',
        },
        {
          id: 'second',
          companyId: 'company',
          fullname: 'Second Receiver',
          telephone: '0242222222',
          createdBy: 'actor',
        },
        {
          id: 'correct',
          companyId: 'company',
          fullname: 'Bright Lawson',
          telephone: '0540345785',
          telephone2: '0243333333',
          createdBy: 'actor',
        },
        {
          id: 'foreign',
          companyId: 'other-company',
          fullname: 'Foreign',
          telephone: '0540345785',
          createdBy: 'actor',
        },
      ]);
      await db.insert(parcels).values(
        ['parcel-a', 'parcel-b'].map((id) => ({
          id,
          companyId: 'company',
          sourceId: 'kumasi',
          destinationId: 'accra',
          bookingId: 'booking',
          bookingCode: 'KN3432637L',
          trackingCode: id,
          senderId: 'sender',
          receiverId: 'receiver',
          secondReceiverId: 'second',
          parcelDetails: 'Box',
          parcelContent: 'Print part',
          status: 5,
          chargePsw: 5000,
          createdBy: 'actor',
          callCenterAssignedToUserId: 'different-actor',
          callCenterCalledAt: new Date(),
        })),
      );
    },
    async input(overrides: Partial<CustomerCorrectionInput> = {}) {
      const [parcel] = await findCorrectionParcels('company', 'KN3432637L');
      const party = overrides.party ?? 'receiver';
      return {
        parcelId: parcel!.id,
        expectedVersion: parcel!.version,
        expectedCustomerVersion: parcel!.parties[party]!.version,
        party,
        mode: 'profile' as const,
        updateName: true,
        fullname: 'Corrected Customer',
        telephone: '0245555555',
        telephone2: null,
        reason: 'Wrong contact entered during booking',
        companyId: 'company',
        actorUserId: 'actor',
        ...overrides,
      };
    },
    async otp(targetReceiver = 'main', phone = '0540345985', parcelId = 'parcel-a') {
      const [otp] = await db
        .insert(parcelReceiverOtps)
        .values({
          companyId: 'company',
          branchId: 'accra',
          parcelId,
          targetReceiver,
          phone,
          otpHash: 'hash',
          expiresAt: new Date(Date.now() + 300000),
          createdBy: 'actor',
          verificationToken: 'old-token',
          verificationTokenExpiresAt: new Date(Date.now() + 600000),
        })
        .returning();
      return otp!;
    },
    async cleanup() {
      await sql.unsafe(
        `DROP TABLE ${tables.map((table) => quote(getTableConfig(table).name)).join(', ')}`,
      );
      await sql.unsafe('DROP FUNCTION set_parcel_customer_name_snapshots()');
    },
  };
}
