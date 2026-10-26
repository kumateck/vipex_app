import type postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from '@/db/config';
import type { TaggedTransaction } from '../credit-repair';

/** Keep repository SELECTs on the existing read-only transaction. Postgres.js transaction
 * functions omit root driver options; Drizzle needs those parsers/serializers to initialize. */
export function bookingInspectionExecutor(tx: TaggedTransaction) {
  const client = new Proxy(tx, {
    get(target, property, receiver) {
      return property === 'options' ? sql.options : Reflect.get(target, property, receiver);
    },
  });
  return drizzle(client as unknown as postgres.Sql);
}
