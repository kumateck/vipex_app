import type { PropsWithChildren } from 'react';

// TODO(push): The old push notification service has no
// bare-RN-CLI equivalent. Re-implement this provider against FCM (Android) /
// APNs (iOS) directly — e.g. via `@react-native-firebase/messaging` — once the
// backend's push-sending pipeline has been migrated off the old push API.
// `resolveNotificationDeepLink` below is kept as a reference for how
// notification payloads should route once a real listener is wired back up
// (previously driven by `Notifications.addNotificationResponseReceivedListener`).

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
    if (!threadId) return null;
    return { kind: 'thread', threadId, title: threadTitle, threadType };
  }

  if (channelId || entityType.includes('voice') || entityType.includes('call')) {
    if (!channelId) return null;
    return { kind: 'voice', channelId, name: channelName, callId, roomName };
  }

  return null;
}

export function CommunicationNotificationsProvider({ children }: PropsWithChildren) {
  // Push registration and notification-tap handling are disabled pending the
  // FCM/APNs migration described above. This provider is currently a no-op
  // passthrough — kept in the tree so re-enabling push later doesn't require
  // touching the provider nesting in app/_layout.tsx.
  return children;
}
