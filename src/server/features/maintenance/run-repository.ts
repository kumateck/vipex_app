import { createId } from '@paralleldrive/cuid2';
import { sql } from '@/db/config';
import type {
  MaintenanceRun,
  MaintenanceResult,
  MaintenanceParams,
  MaintenanceScriptId,
} from '@/shared/maintenance';
import type { TaggedTransaction } from './credit-repair';

export type RunMetadata = { run: MaintenanceRun; fingerprint?: string; consumedByRunId?: string };
export async function startMaintenanceRun(
  companyId: string,
  actorId: string,
  operationId: MaintenanceScriptId,
  params: MaintenanceParams,
  mode: MaintenanceRun['mode'],
) {
  const run: MaintenanceRun = {
    id: createId(),
    operationId,
    params,
    mode,
    status: 'running',
    createdAt: new Date().toISOString(),
  };
  await sql`insert into audit_logs (id, company_id, actor_user_id, entity_type, entity_id, action, message, metadata)
    values (${run.id}, ${companyId}, ${actorId}, 'maintenance_run', ${run.id}, 'MAINTENANCE_RUN_STARTED',
      'System Admin started a maintenance script', ${JSON.stringify({ run })}::json)`;
  return run;
}

export async function finishMaintenanceRun(
  tx: TaggedTransaction | typeof sql,
  companyId: string,
  metadata: RunMetadata,
) {
  const run = metadata.run;
  await tx.unsafe(
    `update audit_logs set action = $1, message = $2, metadata = $3::json
    where id = $4 and company_id = $5 and entity_type = 'maintenance_run'`,
    [
      run.status === 'succeeded' ? 'MAINTENANCE_RUN_SUCCEEDED' : 'MAINTENANCE_RUN_FAILED',
      run.result?.summary ?? run.error ?? 'Maintenance script completed',
      JSON.stringify(metadata),
      run.id,
      companyId,
    ],
  );
}

export async function loadMaintenancePreview(
  tx: TaggedTransaction,
  id: string,
  companyId: string,
  actorId: string,
) {
  const [row] =
    await tx`select metadata from audit_logs where id = ${id} and company_id = ${companyId}
    and actor_user_id = ${actorId} and entity_type = 'maintenance_run' for update`;
  return row?.metadata as RunMetadata | undefined;
}

export async function listMaintenanceRuns(companyId: string): Promise<MaintenanceRun[]> {
  const rows = await sql`select a.metadata, u.fullname as actor_name from audit_logs a
    left join users u on u.id = a.actor_user_id and u.company_id = a.company_id
    where a.company_id = ${companyId} and a.entity_type = 'maintenance_run'
    order by a.created_at desc, a.id desc limit 20`;
  return rows.flatMap((row) =>
    row.metadata?.run ? [{ ...row.metadata.run, actorName: row.actor_name ?? 'System Admin' }] : [],
  );
}

export const completedMaintenanceRun = (
  run: MaintenanceRun,
  result: MaintenanceResult,
): MaintenanceRun => ({
  ...run,
  status: 'succeeded',
  result,
  completedAt: new Date().toISOString(),
});
