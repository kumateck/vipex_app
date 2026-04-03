import { downloadCsv } from '@/features/dashboard/utils/export-csv';
import type { EntityAuditLog } from './api';
import { formatAuditDateTime } from './report-utils';

export function exportAuditLogsCsv(filenamePrefix: string, rows: EntityAuditLog[]) {
  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(
    `${filenamePrefix}-${today}.csv`,
    ['Time', 'User', 'Module', 'Action', 'Entity ID', 'Message'],
    rows.map((row) => [
      formatAuditDateTime(row.createdAt),
      row.actorUserName || row.actorUserId || '-',
      row.entityType,
      row.action,
      row.entityId || '-',
      row.message || '-',
    ]),
  );
}
