import type { ReactNode } from 'react';

export function HandoverField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span> {children || '-'}
    </p>
  );
}
