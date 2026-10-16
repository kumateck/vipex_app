import { memo, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type DetailItem = { label: string; value: ReactNode; wide?: boolean };

/** Label/value pairs laid out across the dialog width so wide screens show more at once. */
export const DetailGrid = memo(function DetailGrid({ items }: { items: Array<DetailItem | null> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items
        .filter((item): item is DetailItem => item !== null)
        .map((item) => (
          <div key={item.label} className={item.wide ? 'sm:col-span-2 lg:col-span-3' : undefined}>
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-sm font-medium break-words">
              {item.value == null || item.value === '' ? '-' : item.value}
            </dd>
          </div>
        ))}
    </dl>
  );
});

export function DetailCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
