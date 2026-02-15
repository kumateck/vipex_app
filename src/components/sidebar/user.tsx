'use client';

import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { UserProfile } from '../user-profile';

export function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserProfile
          variant="sidebar"
          user={{
            name: 'Desmond Adusei',
            email: 'desdhi24@gmail.com',
            avatar: '/avatars/user.jpg',
            role: 'Super Admin',
            branch: 'Head Office',
            company: 'VIPEX',
          }}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
