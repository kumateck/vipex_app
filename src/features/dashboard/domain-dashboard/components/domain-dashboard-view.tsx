import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/components/sidebar/navigation';
import { inferRequiredPermissionByPath } from '@/shared/permissions/path-access';
import type { DashboardModel, DashboardWidget } from '../types';
import { DomainDashboardWidgetCard } from './domain-dashboard-widget-card';

function groupWidgets(widgets: DashboardWidget[]) {
  const subdomainMap = new Map<string, Map<string, DashboardWidget[]>>();
  for (const widget of widgets) {
    const moduleMap = subdomainMap.get(widget.subdomain) ?? new Map();
    const moduleWidgets = moduleMap.get(widget.module) ?? [];
    moduleWidgets.push(widget);
    moduleMap.set(widget.module, moduleWidgets);
    subdomainMap.set(widget.subdomain, moduleMap);
  }

  return [...subdomainMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([subdomain, modules]) => ({
      subdomain,
      modules: [...modules.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([module, entries]) => ({ module, widgets: entries })),
    }));
}

type SidebarNode = {
  title: string;
  url?: string;
  items?: SidebarNode[];
  children?: SidebarNode[];
};

function collectSidebarLinks(nodes: SidebarNode[], permissions: Set<string>, limit: number) {
  const links: Array<{ title: string; url: string }> = [];
  const visit = (node: SidebarNode) => {
    if (links.length >= limit) return;
    if (node.url) {
      const requiredPermission = inferRequiredPermissionByPath(node.url);
      const allowed = !requiredPermission || permissions.has(requiredPermission);
      if (allowed) links.push({ title: node.title, url: node.url });
    }
    for (const child of node.children ?? []) visit(child);
    for (const item of node.items ?? []) visit(item);
  };
  for (const node of nodes) visit(node);
  return links;
}

export function DomainDashboardView({
  isLoading = false,
  model,
  userPermissions,
}: {
  isLoading?: boolean;
  model: DashboardModel;
  userPermissions: string[];
}) {
  const grouped = useMemo(() => groupWidgets(model.widgets), [model.widgets]);
  const quickLinks = useMemo(
    () =>
      collectSidebarLinks(
        ROUTES.flatMap((route) => route.menu as SidebarNode[]),
        new Set(userPermissions),
        12,
      ),
    [userPermissions],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{model.domain} Dashboard</CardTitle>
          <CardDescription>
            No widgets are currently available for your permission scope.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Quick links to modules you can access:</p>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Button key={link.url} asChild size="sm" variant="outline">
                <Link to={link.url}>{link.title}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-semibold">{model.domain} Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Action-oriented workspace aligned with your domain permissions.
        </p>
      </div>

      {grouped.map((subdomainSection) => (
        <section key={subdomainSection.subdomain} className="space-y-4">
          <div className="rounded-md border px-4 py-3">
            <h2 className="text-lg font-semibold">{subdomainSection.subdomain}</h2>
          </div>

          {subdomainSection.modules.map((moduleSection) => (
            <div key={moduleSection.module} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {moduleSection.module}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {moduleSection.widgets.map((widget) => (
                  <DomainDashboardWidgetCard key={widget.id} widget={widget} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
