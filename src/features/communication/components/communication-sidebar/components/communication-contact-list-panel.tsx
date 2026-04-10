import { useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isValid,
  parseISO,
} from 'date-fns';

type ContactItem = {
  id: string;
  fullname: string;
  initials: string;
  roleName: string | null;
  branchName: string | null;
  locationName: string | null;
  threadId: string | null;
  lastMessageAt: string | null;
  draftMessage: string | null;
  unreadCount: number;
  mentionCount: number;
  isOnline: boolean;
  isTyping: boolean;
  requiresRequest: boolean;
};

type CommunicationContactListPanelProps = {
  mode: 'chats' | 'colleagues';
  contacts: ContactItem[];
  isLoadingUsers: boolean;
  startingUserId: string | null;
  onContactSelect: (contact: ContactItem) => Promise<void>;
  onOpenRequestDialog: (targetUserId?: string) => void;
};

function ContactRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-2">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function formatCompactTime(value: string | null): string | null {
  if (!value) return null;
  const ts = parseISO(value);
  if (!isValid(ts)) return null;
  const now = new Date();
  const minutes = differenceInMinutes(now, ts);
  if (minutes < 60) return `${Math.max(minutes, 1)}m`;
  const hours = differenceInHours(now, ts);
  if (hours < 24) return `${hours}h`;
  const days = differenceInDays(now, ts);
  return `${days}d`;
}

export function CommunicationContactListPanel({
  mode,
  contacts,
  isLoadingUsers,
  startingUserId,
  onContactSelect,
  onOpenRequestDialog,
}: CommunicationContactListPanelProps) {
  const location = useLocation();
  const isChats = mode === 'chats';

  return (
    <SidebarGroup className="flex min-h-0 flex-1 flex-col p-0">
      {mode === 'colleagues' ? (
        <div className="px-1 pb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onOpenRequestDialog()}
          >
            <Plus className="mr-1 h-4 w-4" />
            Request Chat
          </Button>
        </div>
      ) : null}
      <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto pr-1">
        <SidebarMenu>
          {isLoadingUsers ? (
            <>
              <ContactRowSkeleton />
              <ContactRowSkeleton />
              <ContactRowSkeleton />
              <ContactRowSkeleton />
            </>
          ) : null}
          {!isLoadingUsers && !contacts.length ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              {isChats ? 'No chats yet.' : 'No colleagues found for direct chat.'}
            </p>
          ) : null}
          {contacts.map((contact) => {
            const isActive =
              !!contact.threadId && location.pathname === `/communication/chat/${contact.threadId}`;
            const profileLine = [contact.roleName, contact.branchName, contact.locationName]
              .filter(Boolean)
              .join(' • ');
            const activityTimeLabel = formatCompactTime(contact.lastMessageAt);
            const activityLine = contact.draftMessage
              ? `Draft: ${contact.draftMessage}`
              : contact.isTyping
                ? 'Typing...'
                : contact.lastMessageAt
                  ? 'Last message'
                  : isChats
                    ? 'No conversation yet'
                    : 'Start conversation';
            return (
              <SidebarMenuItem key={contact.id} className="w-full">
                <SidebarMenuButton
                  type="button"
                  onClick={() => void onContactSelect(contact)}
                  disabled={startingUserId === contact.id}
                  isActive={isActive}
                  className="h-auto w-full items-start gap-3 py-2.5"
                >
                  <div
                    className={cn(
                      'relative mt-0.5 rounded-full border border-transparent',
                      isActive && 'border-primary',
                    )}
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="text-xs font-semibold">
                        {contact.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-sidebar',
                        contact.isOnline ? 'bg-emerald-500' : 'bg-muted',
                      )}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="min-w-0 flex-1 text-xs font-semibold leading-3">
                      {contact.fullname}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {profileLine || 'No role assigned'}
                    </span>
                    <span
                      className={cn(
                        'truncate text-xs',
                        contact.isTyping
                          ? 'text-emerald-400'
                          : contact.draftMessage
                            ? 'text-amber-400'
                            : 'text-muted-foreground',
                      )}
                    >
                      {activityLine}
                    </span>
                  </div>
                  {!isChats && contact.requiresRequest ? (
                    <span className="ml-2 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">
                      Request
                    </span>
                  ) : null}
                  <div className="ml-2 flex w-8 shrink-0 flex-col items-end gap-0.5">
                    <span className="min-h-[14px] text-[11px] text-muted-foreground">
                      {isChats ? (activityTimeLabel ?? '') : ''}
                    </span>
                    <span className="min-h-[12px] text-[10px] font-semibold text-emerald-400">
                      {isChats && contact.unreadCount > 0 ? `+${contact.unreadCount}` : ''}
                    </span>
                    <span className="min-h-[12px] text-[10px] font-semibold text-red-400">
                      {isChats && contact.mentionCount > 0 ? `-${contact.mentionCount}` : ''}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
