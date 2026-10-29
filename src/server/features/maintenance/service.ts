import postgres from 'postgres';
import { sql } from '@/db/config';
import type { AuthUser } from '@/server/plugins/auth';
import { BadRequest, Conflict, isHttpError } from '@/server/utils/http-error';
import type { MaintenanceRunRequest } from '@/shared/maintenance';
import { assertMaintenanceAdmin } from './access';
import { validateMaintenanceParams } from './validation';
import { getMaintenanceCatalog, runRegisteredScript } from './registry';
import {
  completedMaintenanceRun,
  finishMaintenanceRun,
  listMaintenanceRuns,
  loadMaintenancePreview,
  startMaintenanceRun,
} from './run-repository';
import { assertMaintenancePreview, maintenanceFingerprint } from './preview';
import type { TaggedTransaction } from './credit-repair';

export async function getMaintenanceScriptsSvc(user: AuthUser | null) {
  await assertMaintenanceAdmin(user);
  return getMaintenanceCatalog();
}
export async function getMaintenanceRunsSvc(user: AuthUser | null) {
  const { companyId } = await assertMaintenanceAdmin(user);
  return listMaintenanceRuns(companyId);
}

export async function executeMaintenanceRunSvc(
  user: AuthUser | null,
  request: MaintenanceRunRequest,
) {
  const { companyId, actorId } = await assertMaintenanceAdmin(user);
  const { script, params } = validateMaintenanceParams(request.operationId, request.params);
  const apply = request.mode === 'execute';
  const confirmed =
    script.id === 'repair-credit-print-payment'
      ? request.confirmNoCashReceived === true
      : request.confirmRepair === true;
  if (apply && (script.kind !== 'repair' || !request.previewRunId || !confirmed)) {
    throw BadRequest('A repair requires a fresh preview and its operation-specific confirmation');
  }
  const run = await startMaintenanceRun(companyId, actorId, script.id, params, request.mode);
  try {
    const result = await sql.begin(
      apply ? 'isolation level serializable' : 'isolation level repeatable read read only',
      async (transaction) => {
        const tx = transaction as TaggedTransaction;
        await tx.unsafe("set local statement_timeout = '15s'");
        await tx.unsafe("set local lock_timeout = '3s'");
        if (apply) {
          const [lock] =
            await tx`select pg_try_advisory_xact_lock(hashtextextended(${companyId}, 0)) as acquired`;
          if (!lock?.acquired)
            throw Conflict('Another maintenance repair is running. Try again after it finishes');
          const preview = assertMaintenancePreview(
            await loadMaintenancePreview(tx, request.previewRunId!, companyId, actorId),
            request,
            params,
          );
          const current = await runRegisteredScript(tx, {
            operationId: script.id,
            params,
            companyId,
            actorId,
            apply: false,
          });
          if (maintenanceFingerprint(current) !== preview.fingerprint)
            throw Conflict(
              'The records changed since preview. Run a fresh preview before executing',
            );
          const applied = await runRegisteredScript(tx, {
            operationId: script.id,
            params,
            companyId,
            actorId,
            apply: true,
          });
          await finishMaintenanceRun(tx, companyId, { run: completedMaintenanceRun(run, applied) });
          await finishMaintenanceRun(tx, companyId, { ...preview, consumedByRunId: run.id });
          return applied;
        }
        return runRegisteredScript(tx, {
          operationId: script.id,
          params,
          companyId,
          actorId,
          apply: false,
        });
      },
    );
    const completed = completedMaintenanceRun(run, result);
    if (!apply)
      await finishMaintenanceRun(sql, companyId, {
        run: completed,
        fingerprint: result.readyToApply ? maintenanceFingerprint(result) : undefined,
      });
    return completed;
  } catch (error) {
    const message =
      error instanceof postgres.PostgresError
        ? 'The database operation failed or timed out. Review the records and try a fresh preview.'
        : error instanceof Error
          ? error.message
          : 'The maintenance operation failed';
    await finishMaintenanceRun(sql, companyId, {
      run: { ...run, status: 'failed', completedAt: new Date().toISOString(), error: message },
    });
    if (error instanceof Error && isHttpError(error)) throw error;
    throw BadRequest(message);
  }
}
