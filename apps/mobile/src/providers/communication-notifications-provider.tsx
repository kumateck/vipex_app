import type { PropsWithChildren } from 'react';
import { RiderAssignmentRealtimeProvider } from '@mobile/features/rider/assignment-realtime';

// TODO(push): The old push notification service has no
// bare-RN-CLI equivalent. Re-implement this provider against FCM (Android) /
// APNs (iOS) directly — e.g. via `@react-native-firebase/messaging` — once the
// backend's push-sending pipeline has been migrated off the old push API.
// `resolveNotificationDeepLink` in notification-deep-link.ts is kept as a reference for how
// notification payloads should route once a real listener is wired back up
// (previously driven by `Notifications.addNotificationResponseReceivedListener`).

export function CommunicationNotificationsProvider({ children }: PropsWithChildren) {
  // Push registration and notification-tap handling are disabled pending the
  // FCM/APNs migration described above. This provider is currently a no-op
  // passthrough — kept in the tree so re-enabling push later doesn't require
  // touching the provider nesting in app/_layout.tsx.
  return <RiderAssignmentRealtimeProvider>{children}</RiderAssignmentRealtimeProvider>;
}
