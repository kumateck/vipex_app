import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { registerCommunicationPushToken } from '@mobile/lib/api';
import { useAuth } from './auth-provider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getEasProjectId() {
  const expoExtra = (Constants.expoConfig?.extra ?? {}) as { eas?: { projectId?: string } };
  const manifestExtra = ((
    Constants as unknown as {
      manifest2?: { extra?: { expoClient?: { extra?: { eas?: { projectId?: string } } } } };
    }
  ).manifest2?.extra?.expoClient?.extra ?? {}) as { eas?: { projectId?: string } };
  return expoExtra.eas?.projectId ?? manifestExtra.eas?.projectId ?? null;
}

export function CommunicationNotificationsProvider({ children }: PropsWithChildren) {
  const { session, withAuth } = useAuth();
  const lastRegisteredTokenRef = useRef<string | null>(null);
  const lastDeepLinkNonceRef = useRef<string | null>(null);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
      const nonce = JSON.stringify({
        id: response.notification.request.identifier,
        at: response.notification.date,
      });
      if (lastDeepLinkNonceRef.current === nonce) return;
      lastDeepLinkNonceRef.current = nonce;

      const threadId = typeof data.threadId === 'string' ? data.threadId : null;
      const threadTitle = typeof data.threadTitle === 'string' ? data.threadTitle : 'Chat Thread';
      const threadType = typeof data.threadType === 'string' ? data.threadType : undefined;
      const channelId = typeof data.channelId === 'string' ? data.channelId : null;
      const channelName = typeof data.channelName === 'string' ? data.channelName : 'Voice Channel';
      const callId = typeof data.callId === 'string' ? data.callId : undefined;
      const roomName = typeof data.roomName === 'string' ? data.roomName : undefined;
      const entityType = typeof data.entityType === 'string' ? data.entityType : '';

      if (threadId || entityType.includes('thread') || entityType.includes('message')) {
        if (!threadId) return;
        router.push({
          pathname: '/communication/thread/[threadId]' as never,
          params: { threadId, title: threadTitle, threadType },
        });
        return;
      }

      if (channelId || entityType.includes('voice') || entityType.includes('call')) {
        if (!channelId) return;
        router.push({
          pathname: '/communication/voice/[channelId]' as never,
          params: { channelId, name: channelName, callId, roomName },
        });
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        if (!active) return;
        if (!session.accessToken) return;
        if (!Device.isDevice) return;

        const existing = await Notifications.getPermissionsAsync();
        let finalStatus = existing.status;
        if (finalStatus !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          finalStatus = requested.status;
        }
        if (finalStatus !== 'granted') return;

        const projectId = getEasProjectId();
        if (!projectId) return;

        const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenResult.data?.trim();
        if (!token) return;
        if (token === lastRegisteredTokenRef.current) return;

        const platform: 'ios' | 'android' | 'web' =
          Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

        await withAuth((accessToken) =>
          registerCommunicationPushToken(accessToken, {
            token,
            platform,
          }),
        );
        lastRegisteredTokenRef.current = token;
      } catch {
        // Keep auth/navigation flow non-blocking even if push registration fails.
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [session.accessToken, withAuth]);

  return children;
}
