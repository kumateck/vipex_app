import { SidebarTrigger } from '@/components/ui/sidebar';
import { CashierSessionControls } from './cashier-session-controls';
import { UserProfile } from '../user-profile';

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center  gap-2 px-4 py-1 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        {/* <Separator orientation="vertical" className=" data-[orientation=vertical]:h-4" /> */}
        {/* <h1 className="text-base font-medium">Documents</h1> */}
        <div className="ml-auto flex items-center gap-2">
          <CashierSessionControls />
          <UserProfile variant="header" />
        </div>
      </div>
    </header>
  );
}
