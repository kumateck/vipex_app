import type { ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Hash,
  MessageSquareText,
  Mic,
  MicOff,
  PhoneCall,
  Settings,
  Users2,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  CommunicationCallSession,
  CommunicationChannel,
  CommunicationThread,
} from '../../../api/communication.api';
import type { ChannelParticipantPreview } from '../types/communication-chat.types';
import { formatDateTime, prettyValue } from '../utils/communication-chat-format';

export function SectionHeader({
  title,
  icon,
  isOpen,
  onToggle,
}: {
  title: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/40"
    >
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </span>
      {isOpen ? (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

export function ThreadListItem({
  thread,
  title,
  onClick,
  icon,
  isActive,
  unreadCount,
  mentionCount,
}: {
  thread: CommunicationThread;
  title?: string;
  onClick: () => void;
  icon: 'dm' | 'group';
  isActive: boolean;
  unreadCount: number;
  mentionCount: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border p-2.5 text-left transition-colors ${
        isActive
          ? 'border-primary/50 bg-primary/10'
          : 'border-transparent bg-muted/20 hover:border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-content-center rounded-md bg-background text-muted-foreground">
            {icon === 'dm' ? (
              <MessageSquareText className="h-4 w-4" />
            ) : (
              <Users2 className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {title?.trim() || thread.title || 'Untitled thread'}
            </p>
            <p className="text-xs text-muted-foreground">{formatDateTime(thread.lastMessageAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {mentionCount > 0 ? <Badge variant="destructive">@{mentionCount}</Badge> : null}
          {unreadCount > 0 ? <Badge variant="default">{unreadCount}</Badge> : null}
          <Badge variant="outline">{thread.participantCount ?? 0}</Badge>
        </div>
      </div>
    </button>
  );
}

export function ChannelListItem({
  channel,
  onOpen,
  isActive,
  unreadCount,
  mentionCount,
  onManageMembers,
}: {
  channel: CommunicationChannel;
  onOpen: () => void;
  isActive: boolean;
  unreadCount: number;
  mentionCount: number;
  onManageMembers?: () => void;
}) {
  return (
    <div
      className={`w-full rounded-md border p-2.5 text-left transition-colors ${
        isActive
          ? 'border-primary/50 bg-primary/10'
          : 'border-transparent bg-muted/20 hover:border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-content-center rounded-md bg-background text-muted-foreground">
            <Hash className="h-4 w-4" />
          </span>
          <button type="button" onClick={onOpen} className="min-w-0 text-left">
            <p className="truncate text-sm font-medium">{channel.name}</p>
            <p className="text-xs text-muted-foreground">{prettyValue(channel.visibility)}</p>
          </button>
        </div>
        <div className="flex items-center gap-1">
          {mentionCount > 0 ? <Badge variant="destructive">@{mentionCount}</Badge> : null}
          {unreadCount > 0 ? <Badge variant="default">{unreadCount}</Badge> : null}
          <Badge variant="outline">{channel.participantCount}</Badge>
          {channel.visibility === 'private' && onManageMembers ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onManageMembers}
            >
              <Settings className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function VoiceChannelListItem({
  channel,
  activeCall,
  participantCount,
  participants,
  isJoining,
  isActive,
  unreadCount,
  mentionCount,
  onJoin,
  onManageMembers,
}: {
  channel: CommunicationChannel;
  activeCall: CommunicationCallSession | null;
  participantCount: number;
  participants: ChannelParticipantPreview[];
  isJoining: boolean;
  isActive: boolean;
  unreadCount: number;
  mentionCount: number;
  onJoin: () => void;
  onManageMembers?: () => void;
}) {
  return (
    <div
      className={`rounded-md border p-2.5 transition-colors ${
        isActive
          ? 'border-primary/50 bg-primary/10'
          : 'border-transparent bg-muted/20 hover:border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-content-center rounded-md bg-background text-muted-foreground">
            <Volume2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{channel.name}</p>
            <p className="text-xs text-muted-foreground">
              {prettyValue(channel.visibility)} voice{activeCall ? ' • Live' : ' • Idle'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {mentionCount > 0 ? <Badge variant="destructive">@{mentionCount}</Badge> : null}
          {unreadCount > 0 ? <Badge variant="default">{unreadCount}</Badge> : null}
          <Badge variant={activeCall ? 'default' : 'outline'}>{participantCount}</Badge>
          {channel.visibility === 'private' && onManageMembers ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onManageMembers}
            >
              <Settings className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
      {participants.length ? (
        <>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {participants.map((participant) => participant.label).join(', ')}
            {participantCount > participants.length
              ? ` +${participantCount - participants.length} more`
              : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {participants.map((participant) => (
              <span
                key={participant.label}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {participant.isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {participant.isVideoOff ? (
                  <VideoOff className="h-3 w-3" />
                ) : (
                  <Video className="h-3 w-3" />
                )}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">No one connected</p>
      )}
      <div className="mt-2">
        <Button size="sm" className="w-full" onClick={onJoin} disabled={isJoining}>
          <PhoneCall className="mr-1 h-4 w-4" />
          {isJoining ? 'Joining...' : 'Join Voice'}
        </Button>
      </div>
    </div>
  );
}
