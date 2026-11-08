import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
import postgres from 'postgres';
import { createId } from '@paralleldrive/cuid2';
import type { TaggedTransaction } from '../src/server/features/maintenance/credit-repair';
import {
  KUMASI_RECEIVING_LOCATION_ID,
  planMissingParcelLocations,
  type LocationRepairBranch,
  type LocationRepairLocation,
} from './parcel-location-repair';

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    'company-id': { type: 'string' },
    'env-file': { type: 'string', default: '.env' },
    'kumasi-location-id': { type: 'string', default: KUMASI_RECEIVING_LOCATION_ID },
    apply: { type: 'boolean', default: false },
  },
});
const companyId = values['company-id'];
if (!companyId)
  throw new Error('Required: --company-id <company ID>. Preview is the default; --apply writes.');
const env = parse(await Bun.file(resolve(values['env-file']!)).text());
if (!env.DATABASE_URL) throw new Error('Selected environment file has no DATABASE_URL.');
const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 20 });
const runId = createId();

try {
  await sql.begin(
    values.apply ? 'isolation level serializable' : 'isolation level repeatable read read only',
    async (transaction) => {
      // Postgres.js omits callable SQL overloads from its TransactionSql declaration.
      const tx = transaction as TaggedTransaction;
      await tx`set local lock_timeout = '10s'`;
      await tx`set local statement_timeout = '120s'`;
      const companies = await tx`select id from companies where id = ${companyId}`;
      if (companies.length !== 1) throw new Error('Company not found.');
      const candidates = await tx.unsafe(
        `select id, booking_code, destination_id, status from parcels
       where company_id = $1 and pickup_location_id is null
         and not is_deleted and deleted_at is null order by id${values.apply ? ' for update' : ''}`,
        [companyId],
      );
      const branchIds = [...new Set(candidates.map((parcel) => String(parcel.destination_id)))];
      const branches = branchIds.length
        ? await tx.unsafe<LocationRepairBranch[]>(
            `select id, name, company_id from branches
          where company_id = $1 and id = any($2::varchar[]) and not is_deleted${values.apply ? ' for share' : ''}`,
            [companyId, branchIds],
          )
        : [];
      if (branches.length !== branchIds.length)
        throw new Error('A destination branch is unavailable. No repair applied.');
      const locations = branchIds.length
        ? await tx.unsafe<LocationRepairLocation[]>(
            `select id, name, branch_id, company_id, can_receive, is_deleted
          from locations where company_id = $1 and branch_id = any($2::varchar[])${values.apply ? ' for share' : ''}`,
            [companyId, branchIds],
          )
        : [];
      const plan = planMissingParcelLocations(
        companyId,
        branches,
        locations,
        values['kumasi-location-id'],
      );
      const summary = plan.map((item) => ({
        ...item,
        parcelCount: candidates.filter((parcel) => parcel.destination_id === item.branchId).length,
      }));
      console.log(
        JSON.stringify(
          {
            mode: values.apply ? 'apply' : 'preview',
            runId,
            companyId,
            total: candidates.length,
            branches: summary,
          },
          null,
          2,
        ),
      );
      if (!values.apply || !candidates.length) return;
      const audits = [];
      for (const item of plan) {
        const parcelIds = candidates
          .filter((parcel) => parcel.destination_id === item.branchId)
          .map((parcel) => String(parcel.id));
        const updated =
          await tx`update parcels set pickup_location_id = ${item.locationId}, updated_at = now()
        where company_id = ${companyId} and id = any(${sql.array(parcelIds)}::varchar[]) and pickup_location_id is null
          and not is_deleted and deleted_at is null returning id, booking_code, status`;
        if (updated.length !== parcelIds.length)
          throw new Error('Parcel changed during repair. Transaction rolled back.');
        for (const parcel of updated)
          audits.push({
            id: createId(),
            company_id: companyId,
            actor_user_id: null,
            entity_type: 'parcel',
            entity_id: parcel.id,
            action: 'PARCEL_PICKUP_LOCATION_BACKFILLED',
            message: `User-authorized missing destination location repair for ${parcel.booking_code}`,
            metadata: {
              runId,
              source: 'codex_user_authorized_data_repair',
              reason:
                'Fill missing destination pickup locations: Kumasi uses Anloga Junction; other branches use their sole active receiving location.',
              previous: { pickupLocationId: null, status: parcel.status },
              patch: { pickupLocationId: item.locationId },
              destinationId: item.branchId,
              locationName: item.locationName,
              historicalLocationInferred: true,
            },
          });
      }
      await tx`insert into audit_logs (id, company_id, actor_user_id, entity_type, entity_id, action, message, metadata)
      select id, company_id, actor_user_id, entity_type, entity_id, action, message, metadata
      from jsonb_to_recordset(${tx.json(audits)}::jsonb) as records(
        id varchar, company_id varchar, actor_user_id varchar, entity_type varchar,
        entity_id varchar, action varchar, message varchar, metadata json)`;
      const [remaining] =
        await tx`select count(*)::int as count from parcels where company_id = ${companyId}
      and pickup_location_id is null and not is_deleted and deleted_at is null`;
      if (remaining?.count !== 0)
        throw new Error('Missing pickup locations remain. Transaction rolled back.');
      console.log(
        JSON.stringify({
          repaired: candidates.length,
          audited: audits.length,
          remaining: remaining.count,
          runId,
        }),
      );
    },
  );
  console.log(values.apply ? 'Committed successfully.' : 'Preview only. No records changed.');
} finally {
  await sql.end();
}
