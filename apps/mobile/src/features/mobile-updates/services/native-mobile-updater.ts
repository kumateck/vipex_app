import { NativeModules, Platform } from 'react-native';
import type { AndroidMobileUpdate, InstalledMobileVersion } from '../types/mobile-update';

type MobileUpdateNativeModule = {
  getInstalledInfo: () => Promise<InstalledMobileVersion>;
  canInstallPackages: () => Promise<boolean>;
  openInstallPermission: () => Promise<void>;
  downloadAndInstall: (
    downloadUrl: string,
    fileName: string,
    expectedSha256: string,
  ) => Promise<number>;
};

function getNativeUpdater(): MobileUpdateNativeModule | null {
  if (Platform.OS !== 'android') return null;
  return (NativeModules.MobileUpdate as MobileUpdateNativeModule | undefined) ?? null;
}

export function getInstalledMobileVersion() {
  return getNativeUpdater()?.getInstalledInfo() ?? null;
}

export async function canInstallMobileUpdate() {
  return (await getNativeUpdater()?.canInstallPackages()) ?? false;
}

export async function openMobileUpdatePermission() {
  const updater = getNativeUpdater();
  if (!updater) throw new Error('Mobile updates are not available on this device.');
  await updater.openInstallPermission();
}

export async function downloadAndInstallMobileUpdate(update: AndroidMobileUpdate) {
  const updater = getNativeUpdater();
  if (!updater) throw new Error('Mobile updates are not available on this device.');
  await updater.downloadAndInstall(update.downloadUrl, update.fileName, update.sha256);
}
