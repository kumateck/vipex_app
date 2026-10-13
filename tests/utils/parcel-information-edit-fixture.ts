import { SQL } from 'drizzle-orm';
import { getTableConfig, PgDialect, type AnyPgTable } from 'drizzle-orm/pg-core';
import { db, sql } from '@/db/config';
import { customers, parcels, auditLogs, ParcelStatus } from '@/db/schemas';

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;

export async function createParcelInformationEditFixture() {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.pathname !== '/vipex_parcel_information_edit_test'
  ) {
    throw new Error(
      'Parcel edit tests require the dedicated local vipex_parcel_information_edit_test database',
    );
  }
  const [count] =
    await sql`SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'`;
  if (count?.count !== 0) throw new Error('Parcel edit test database must be empty');
  const dialect = new PgDialect();
  for (const table of [customers, parcels, auditLogs] as AnyPgTable[]) {
    const config = getTableConfig(table);
    const columns = config.columns.map((column) => {
      const value = column.default;
      const defaultSql =
        value instanceof SQL
          ? dialect.sqlToQuery(value).sql
          : typeof value === 'string'
            ? `'${value.replace(/'/g, "''")}'`
            : value == null
              ? null
              : String(value);
      return `${quote(column.name)} ${column.getSQLType()}${column.notNull ? ' NOT NULL' : ''}${column.primary ? ' PRIMARY KEY' : ''}${defaultSql == null ? '' : ` DEFAULT ${defaultSql}`}`;
    });
    await sql.unsafe(`CREATE TABLE ${quote(config.name)} (${columns.join(', ')})`);
  }
  const old = await Bun.file('drizzle/0073_parcel_customer_name_snapshots.sql').text();
  await sql.unsafe(old.slice(old.indexOf('CREATE OR REPLACE FUNCTION')));
  await sql.unsafe(await Bun.file('drizzle/0081_parcel_receiver_name_corrections.sql').text());

  return {
    async reset() {
      await db.delete(auditLogs);
      await db.delete(parcels);
      await db.delete(customers);
      await db.insert(customers).values([
        { id: 'sender', companyId: 'company-a', fullname: 'Sender', createdBy: 'actor' },
        {
          id: 'receiver',
          companyId: 'company-a',
          fullname: 'Original Receiver',
          telephone: '0240000001',
          telephone2: '0240000002',
          createdBy: 'actor',
        },
        { id: 'second', companyId: 'company-a', fullname: 'Second Receiver', createdBy: 'actor' },
        {
          id: 'duplicate',
          companyId: 'company-a',
          fullname: 'Duplicate',
          telephone: '0500000001',
          telephone2: '0500000002',
          createdBy: 'actor',
        },
      ]);
      await db.insert(parcels).values(
        ['parcel-a', 'parcel-b'].map((id) => ({
          id,
          companyId: 'company-a',
          sourceId: 'source',
          destinationId: 'branch-a',
          bookingId: 'booking',
          bookingCode: id,
          trackingCode: id,
          senderId: 'sender',
          receiverId: 'receiver',
          secondReceiverId: 'second',
          parcelDetails: 'Box',
          parcelContent: 'Clothes',
          status: ParcelStatus.AWAITING_PICKUP,
          createdBy: 'actor',
          chargePsw: 5000,
        })),
      );
    },
    async cleanup() {
      await sql.unsafe('DROP TABLE audit_logs, parcels, customers');
      await sql.unsafe('DROP FUNCTION set_parcel_customer_name_snapshots()');
    },
  };
}
