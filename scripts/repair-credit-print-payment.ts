import { config } from 'dotenv';
import postgres from 'postgres';
import { parseRepairOptions } from './credit-print-repair';
import {
  executeCreditPrintRepair,
  type TaggedTransaction,
} from '../src/server/features/maintenance/credit-repair';

config({ path: '.env', quiet: true });
const options = parseRepairOptions(process.argv.slice(2));
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const sql = postgres(url, {
  max: 1,
  connect_timeout: 15,
  connection: {
    default_transaction_read_only: !options.apply,
    statement_timeout: 15000,
    lock_timeout: 3000,
  },
});
try {
  const result = await sql.begin(
    options.apply ? 'isolation level serializable' : 'isolation level repeatable read read only',
    (tx) => executeCreditPrintRepair(tx as TaggedTransaction, options),
  );
  console.log(JSON.stringify({ mode: options.apply ? 'apply' : 'dry-run', ...result }, null, 2));
  if (result.status === 'repaired')
    console.log(
      'Repair committed. Reprint the sticker and credit acknowledgement using the updated application.',
    );
} catch (error) {
  console.error('Repair aborted:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
