import { SQL } from 'drizzle-orm';
import { getTableConfig, PgDialect, type AnyPgTable } from 'drizzle-orm/pg-core';
import { db, sql } from '@/db/config';
import {
  auditLogs,
  bookings,
  branches,
  customerCreditTransactions,
  customers,
  parcels,
  payments,
  selfServiceBookingDrafts,
  users,
  UserStatus,
} from '@/db/schemas';

const tables = [
  users,
  branches,
  customers,
  bookings,
  parcels,
  payments,
  customerCreditTransactions,
  auditLogs,
  selfServiceBookingDrafts,
];
const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;

export async function createChargeAgentBookingFixture() {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.pathname !== '/vipex_charge_agent_booking_test'
  ) {
    throw new Error(
      'Charge-agent booking tests require the dedicated local vipex_charge_agent_booking_test database',
    );
  }
  const [count] =
    await sql`SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'`;
  if (count?.count !== 0) throw new Error('Charge-agent booking test database must be empty');

  // Use real column definitions/defaults; unrelated FK tables are outside this fixture.
  const dialect = new PgDialect();
  const tableSql = (table: AnyPgTable) => {
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
    return `CREATE TABLE ${quote(config.name)} (${columns.join(', ')})`;
  };
  for (const table of tables) await sql.unsafe(tableSql(table));
  await sql.unsafe(
    'ALTER TABLE parcels ADD CONSTRAINT charge_agent_fk FOREIGN KEY (charge_agent_user_id) REFERENCES users(id)',
  );
  await db
    .insert(branches)
    .values({ id: 'branch-a', companyId: 'company-a', name: 'Accra', createdBy: 'creator' });
  await db.insert(users).values(
    [
      {
        id: 'creator',
        fullname: 'Creator',
        branchId: 'branch-a',
        companyId: 'company-a',
        status: UserStatus.ACTIVE,
      },
      {
        id: 'agent-a',
        fullname: 'Agent A',
        branchId: 'branch-a',
        companyId: 'company-a',
        status: UserStatus.ACTIVE,
      },
      {
        id: 'agent-b',
        fullname: 'Agent B',
        branchId: 'branch-a',
        companyId: 'company-a',
        status: UserStatus.ACTIVE,
      },
      {
        id: 'other-branch',
        fullname: 'Other Branch',
        branchId: 'branch-b',
        companyId: 'company-a',
        status: UserStatus.ACTIVE,
      },
      {
        id: 'other-company',
        fullname: 'Other Company',
        branchId: 'branch-a',
        companyId: 'company-b',
        status: UserStatus.ACTIVE,
      },
      {
        id: 'inactive',
        fullname: 'Inactive',
        branchId: 'branch-a',
        companyId: 'company-a',
        status: UserStatus.INACTIVE,
      },
    ].map((user) => ({
      ...user,
      telephone: '0240000000',
      email: `${user.id}@test.local`,
      roleId: 'role-a',
      createdBy: 'creator',
    })),
  );

  return {
    async clearBookings() {
      await sql.unsafe(
        'TRUNCATE self_service_booking_drafts, customer_credit_transactions, payments, parcels, bookings, audit_logs',
      );
    },
    async draft() {
      const [draft] = await db
        .insert(selfServiceBookingDrafts)
        .values({
          companyId: 'company-a',
          branchId: 'branch-a',
          senderFullname: 'Sender',
          senderPhone: '0240000001',
          senderCustomerId: 'sender',
          receiverFullname: 'Receiver',
          receiverPhone: '0240000002',
          receiverCustomerId: 'receiver',
          destinationBranchId: 'branch-b',
          parcelContent: 'Clothes',
          parcelValuePsw: 5000,
          callSender: true,
          expiresAt: new Date(Date.now() + 60000),
        })
        .returning();
      return draft!;
    },
    async cleanup() {
      for (const table of [...tables].reverse())
        await sql.unsafe(`DROP TABLE ${quote(getTableConfig(table).name)}`);
    },
  };
}
