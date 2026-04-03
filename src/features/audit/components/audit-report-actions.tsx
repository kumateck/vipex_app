import { Button } from '@/components/ui/button';
import type { EntityAuditLog } from '@/features/audit/api';
import { exportAuditLogsCsv } from '@/features/audit/report-export';

export function AuditReportActions({
  filenamePrefix,
  rows,
  disabled = false,
}: {
  filenamePrefix: string;
  rows: EntityAuditLog[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || rows.length === 0}
        onClick={() => exportAuditLogsCsv(filenamePrefix, rows)}
      >
        Export CSV
      </Button>
      <Button type="button" variant="outline" disabled={disabled} onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}
