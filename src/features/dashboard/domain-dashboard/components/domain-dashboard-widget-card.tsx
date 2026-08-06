import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DashboardWidget } from '../types';

export function DomainDashboardWidgetCard({ widget }: { widget: DashboardWidget }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{widget.title}</CardTitle>
        <CardDescription>
          {widget.description ?? `${widget.subdomain} · ${widget.module}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          {widget.subdomain} / {widget.module}
        </div>
        <Button asChild size="sm" className="w-full">
          <Link to={widget.route}>Open Module</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
