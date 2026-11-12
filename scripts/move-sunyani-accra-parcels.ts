import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
import postgres from 'postgres';
import { createId } from '@paralleldrive/cuid2';
import type { TaggedTransaction } from '../src/server/features/maintenance/credit-repair';
import {
  loadSunyaniAccraRoute,
  lockSunyaniAccraParcels,
  moveLockedSunyaniAccraParcels,
  previewSunyaniAccraMove,
} from './sunyani-accra-pickup-location';

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    'company-id': { type: 'string' },
    'env-file': { type: 'string' },
    'expected-count': { type: 'string' },
    apply: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

if (values.help) {
  console.log(
    'Usage: bun scripts/move-sunyani-accra-parcels.ts --company-id <id> --env-file <path> [--apply] [--expected-count <n>]\nPreview is read-only by default. --apply changes the pickup location and records an audit per parcel.',
  );
  process.exit(0);
}

const companyId = values['company-id']?.trim();
const envFile = values['env-file'];
if (!companyId || !envFile) throw new Error('Provide --company-id and --env-file. See --help.');
const expected = values['expected-count'];
const expectedCount = expected === undefined ? undefined : Number(expected);
if (expected !== undefined && (!/^\d+$/.test(expected) || !Number.isSafeInteger(expectedCount))) {
  throw new Error('--expected-count must be a nonnegative whole number.');
}

const env = parse(await Bun.file(resolve(envFile)).text());
if (!env.DATABASE_URL) throw new Error('Selected environment file has no DATABASE_URL.');
const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 20 });
const runId = createId();

try {
  const result = await sql.begin(
    values.apply ? 'isolation level read committed' : 'isolation level repeatable read read only',
    async (transaction) => {
      const tx = transaction as TaggedTransaction;
      await tx`set local lock_timeout = '10s'`;
      await tx`set local statement_timeout = '120s'`;
      const route = await loadSunyaniAccraRoute(tx, companyId, values.apply);
      // Queue issuance locks the same parcel. Read queue state after acquiring those locks.
      const lockedIds = values.apply ? await lockSunyaniAccraParcels(tx, route) : [];
      const preview = await previewSunyaniAccraMove(tx, route);
      console.log(
        JSON.stringify(
          { mode: values.apply ? 'apply' : 'preview', runId, route, ...preview },
          null,
          2,
        ),
      );
      if (!values.apply) return;
      if (
        preview.toMove !== lockedIds.length ||
        (expectedCount !== undefined && preview.toMove !== expectedCount)
      )
        throw new Error('The number of parcels has changed. Run preview again.');
      if (preview.parcelsWithConflictingPickupTickets || preview.pendingReceiverHandovers)
        throw new Error(
          'Resolve conflicting open pickup tickets and pending handovers before applying.',
        );
      if (!lockedIds.length) return { moved: 0, audited: 0 };
      return moveLockedSunyaniAccraParcels(tx, route, lockedIds, runId);
    },
  );
  if (result) console.log(JSON.stringify({ committed: true, runId, ...result }));
  else console.log('Preview complete. No records changed.');
} finally {
  await sql.end();
}
