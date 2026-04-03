import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
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

  useEffect(() => {
    let active = true;

    const run = async () => {
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
    };

    void run();

    return () => {
      active = false;
    };
  }, [session.accessToken, withAuth]);

  return children;
}
