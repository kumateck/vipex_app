import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../sidebar';

import { SiteHeader } from '../sidebar/header';
import { ScreenTimeoutGuard } from '@/features/auth/components/screen-timeout-guard';

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ScreenTimeoutGuard />
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-auto w-full max-w-full p-5">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
