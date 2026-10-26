import { config } from 'dotenv';
import postgres from 'postgres';

import type { TaggedTransaction } from '../src/server/features/maintenance/credit-repair';
import {
  traceCreditParcel,
  scanCreditConflicts,
} from '../src/server/features/maintenance/parcel-inspection';

config({ path: '.env', quiet: true });
const code = process.argv[2]?.trim();
const scanCompany = code === '--scan-company' ? process.argv[3]?.trim() : null;
if (
  (!scanCompany && (!code || !/^[A-Za-z0-9-]{3,80}$/.test(code))) ||
  (scanCompany && !/^[a-zA-Z0-9]{1,25}$/.test(scanCompany))
) {
  throw new Error(
    'Usage: bun run scripts/trace-credit-parcel.ts <booking-or-tracking-code> | --scan-company <company-id>',
  );
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const sql = postgres(url, {
  max: 1,
  connect_timeout: 15,
  connection: { default_transaction_read_only: true, statement_timeout: 15000 },
});

try {
  const report = await sql.begin(
    'isolation level repeatable read read only',
    async (transaction) => {
      const tx = transaction as TaggedTransaction;
      if (scanCompany) return { readOnly: true, ...(await scanCreditConflicts(tx, scanCompany)) };
      if (!code) throw new Error('Booking or tracking code is required');
      return traceCreditParcel(tx, code);
    },
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(
    'Read-only trace failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
