import { createHash } from 'node:crypto';
import type {
  MaintenanceParams,
  MaintenanceResult,
  MaintenanceRunRequest,
} from '@/shared/maintenance';
import { Conflict } from '@/server/utils/http-error';
import type { RunMetadata } from './run-repository';

export const maintenanceFingerprint = (result: MaintenanceResult) =>
  createHash('sha256').update(JSON.stringify(result.details)).digest('hex');

export function assertMaintenancePreview(
  metadata: RunMetadata | undefined,
  request: MaintenanceRunRequest,
  params: MaintenanceParams,
  now = Date.now(),
) {
  const previous = metadata?.run;
  if (
    !previous ||
    previous.mode !== 'preview' ||
    previous.status !== 'succeeded' ||
    !previous.result?.readyToApply ||
    previous.operationId !== request.operationId ||
    JSON.stringify(previous.params) !== JSON.stringify(params) ||
    !metadata?.fingerprint ||
    metadata.consumedByRunId
  ) {
    throw Conflict('Run a fresh preview for these parameters before executing the repair');
  }
  const age = now - new Date(previous.completedAt ?? previous.createdAt).getTime();
  if (!Number.isFinite(age) || age < 0 || age > 10 * 60_000)
    throw Conflict('Preview expired. Run a fresh preview before executing the repair');
  return metadata;
}
