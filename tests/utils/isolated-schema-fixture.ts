import { is, SQL } from 'drizzle-orm';
import { getTableConfig, PgDialect, PgTable } from 'drizzle-orm/pg-core';
import { sql } from '@/db/config';
import * as schema from '@/db/schemas';

const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;

/** Builds real column definitions in a dedicated empty local test DB; no production triggers/FKs. */
export async function createIsolatedSchemaFixture(databaseName: string) {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== `/${databaseName}`) {
    throw new Error(`Tests require the dedicated local ${databaseName} database`);
  }
  const [row] =
    await sql`select count(*)::int as count from information_schema.tables where table_schema = 'public'`;
  if (row?.count !== 0) throw new Error('Isolated fixture database must be empty');
  const tables = new Map<string, PgTable>();
  for (const value of Object.values(schema)) {
    if (is(value, PgTable)) tables.set(getTableConfig(value).name, value);
  }
  const dialect = new PgDialect();
  for (const [name, table] of tables) {
    const columns = getTableConfig(table).columns.map((column) => {
      const value = column.default;
      const literal =
        value instanceof SQL
          ? dialect.sqlToQuery(value).sql
          : value == null
            ? null
            : typeof value === 'object'
              ? `'${JSON.stringify(value).replaceAll("'", "''")}'`
              : typeof value === 'string'
                ? `'${value.replaceAll("'", "''")}'`
                : String(value);
      return `${quote(column.name)} ${column.getSQLType()}${column.notNull ? ' NOT NULL' : ''}${column.primary ? ' PRIMARY KEY' : ''}${literal === null ? '' : ` DEFAULT ${literal}`}`;
    });
    await sql.unsafe(`create table ${quote(name)} (${columns.join(', ')})`);
  }
  return {
    async cleanup() {
      for (const name of [...tables.keys()].reverse())
        await sql.unsafe(`drop table ${quote(name)}`);
    },
  };
}
