import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../sidebar';

import { SiteHeader } from '../sidebar/header';

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col overflow-hidden ">
        <SiteHeader />
        <div className="flex-1 overflow-auto w-full max-w-full  p-5">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
