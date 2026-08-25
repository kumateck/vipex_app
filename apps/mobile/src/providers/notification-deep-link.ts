export type NotificationDeepLinkTarget =
  | { kind: 'thread'; threadId: string; title: string; threadType?: string }
  | { kind: 'voice'; channelId: string; name: string; callId?: string; roomName?: string }
  | null;

export function resolveNotificationDeepLink(
  data: Record<string, unknown>,
): NotificationDeepLinkTarget {
  const threadId = typeof data.threadId === 'string' ? data.threadId : null;
  const threadTitle = typeof data.threadTitle === 'string' ? data.threadTitle : 'Chat Thread';
  const threadType = typeof data.threadType === 'string' ? data.threadType : undefined;
  const channelId = typeof data.channelId === 'string' ? data.channelId : null;
  const channelName = typeof data.channelName === 'string' ? data.channelName : 'Voice Channel';
  const callId = typeof data.callId === 'string' ? data.callId : undefined;
  const roomName = typeof data.roomName === 'string' ? data.roomName : undefined;
  const entityType = typeof data.entityType === 'string' ? data.entityType : '';

  if (threadId || entityType.includes('thread') || entityType.includes('message')) {
    return threadId ? { kind: 'thread', threadId, title: threadTitle, threadType } : null;
  }

  if (channelId || entityType.includes('voice') || entityType.includes('call')) {
    return channelId ? { kind: 'voice', channelId, name: channelName, callId, roomName } : null;
  }

  return null;
}
