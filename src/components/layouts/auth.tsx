import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../sidebar';

import { SiteHeader } from '../sidebar/header';
import { ScreenTimeoutGuard } from '@/features/auth/components/screen-timeout-guard';

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '370px',
        } as React.CSSProperties
      }
    >
      <ScreenTimeoutGuard />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 ">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
