import { useCallback, useEffect, useRef } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { useAuth } from '@mobile/providers/auth-provider';
import { fetchLatestAndroidUpdate } from '../services/mobile-update-api';
import {
  canInstallMobileUpdate,
  downloadAndInstallMobileUpdate,
  getInstalledMobileVersion,
  openMobileUpdatePermission,
} from '../services/native-mobile-updater';
import type { AndroidMobileUpdate } from '../types/mobile-update';

export function useMobileUpdate() {
  const { bootstrapped, session, withAuth } = useAuth();
  const checkingRef = useRef(false);
  const installingRef = useRef(false);
  const promptedBuildRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<AndroidMobileUpdate | null>(null);

  const installUpdate = useCallback(async (update: AndroidMobileUpdate) => {
    if (installingRef.current) return;
    installingRef.current = true;
    try {
      if (!(await canInstallMobileUpdate())) {
        pendingUpdateRef.current = update;
        Alert.alert(
          'Allow app updates',
          'Android needs permission for Vipex Mobile to install this private update.',
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Open settings',
              onPress: () => void openMobileUpdatePermission(),
            },
          ],
        );
        return;
      }

      pendingUpdateRef.current = null;
      await downloadAndInstallMobileUpdate(update);
      Alert.alert(
        'Update downloading',
        'Android will open the installer when the Vipex Mobile update is ready.',
      );
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Unable to start the mobile update.',
      );
    } finally {
      installingRef.current = false;
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (Platform.OS !== 'android' || !bootstrapped || !session.accessToken || checkingRef.current) {
      return;
    }

    checkingRef.current = true;
    try {
      const installedPromise = getInstalledMobileVersion();
      if (!installedPromise) return;
      const [installed, latest] = await Promise.all([
        installedPromise,
        withAuth(fetchLatestAndroidUpdate),
      ]);

      if (
        latest.versionCode <= installed.versionCode ||
        promptedBuildRef.current === latest.versionCode
      ) {
        return;
      }

      promptedBuildRef.current = latest.versionCode;
      Alert.alert(
        `Vipex Mobile ${latest.version} is available`,
        latest.releaseNotes || 'Install the latest improvements and fixes.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Update now', onPress: () => void installUpdate(latest) },
        ],
      );
    } catch {
      // Update checks are background work and must never block normal app use.
    } finally {
      checkingRef.current = false;
    }
  }, [bootstrapped, installUpdate, session.accessToken, withAuth]);

  useEffect(() => {
    void checkForUpdate();
  }, [checkForUpdate]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const pendingUpdate = pendingUpdateRef.current;
      if (pendingUpdate) {
        void canInstallMobileUpdate().then((allowed) => {
          if (allowed) void installUpdate(pendingUpdate);
        });
        return;
      }
      void checkForUpdate();
    });
    return () => subscription.remove();
  }, [checkForUpdate, installUpdate]);
}
