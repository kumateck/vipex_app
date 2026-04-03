import type { EntityAuditLog } from './api';

export function formatAuditDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export function toAuditSearchableText(row: EntityAuditLog) {
  return `${row.action} ${row.message ?? ''}`.toLowerCase();
}

export function isHighRiskAuditLog(row: EntityAuditLog) {
  const text = toAuditSearchableText(row);
  return (
    text.includes('delete') ||
    text.includes('override') ||
    text.includes('reject') ||
    text.includes('failed') ||
    text.includes('suspicious')
  );
}
