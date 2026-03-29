import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

const CHECK_INTERVAL_MS = 10 * 60 * 1000;

export function AppUpdateProvider({ children }: PropsWithChildren) {
  const isCheckingRef = useRef(false);
  const lastCheckAtRef = useRef(0);

  async function runUpdateCheck() {
    if (__DEV__) return;
    if (!Updates.isEnabled) return;
    if (isCheckingRef.current) return;

    const now = Date.now();
    if (now - lastCheckAtRef.current < CHECK_INTERVAL_MS) return;

    isCheckingRef.current = true;
    lastCheckAtRef.current = now;

    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return;

      Alert.alert('Update available', 'A new app update is ready. Install now?', [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Install',
          onPress: () => {
            void (async () => {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            })();
          },
        },
      ]);
    } catch {
      // Silent in production to avoid interrupting user workflow.
    } finally {
      isCheckingRef.current = false;
    }
  }

  useEffect(() => {
    void runUpdateCheck();

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void runUpdateCheck();
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  return children;
}
